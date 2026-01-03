import Location from '../models/Location.js';
import User from '../models/User.js';
import Geofence from '../models/Geofence.js';
import GeofenceState from '../models/GeofenceState.js';
import Alert from '../models/Alert.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { validateCoordinates, validateAccuracy, validateLocationAge } from '../utils/geospatial.js';
import { isPointInGeofence } from '../utils/geospatial.js';
import notificationService from '../services/emailService.js';

// Helper function to calculate distance between two coordinates (in meters)
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Record location (replaces location-processor Lambda)
export const recordLocation = catchAsync(async (req, res, next) => {
  const { latitude, longitude, accuracy, speed, heading, timestamp } = req.body;
  const userId = req.user._id;
  
  // Input validation
  validateCoordinates(latitude, longitude);
  
  let locationTimestamp = timestamp ? new Date(timestamp) : new Date();
  
  // Validate location age with lenient settings
  try {
    validateLocationAge(locationTimestamp, 600000); // 10 minutes
  } catch (ageError) {
    // Use current server time if timestamp is problematic
    locationTimestamp = new Date();
  }
  
  const validatedAccuracy = validateAccuracy(accuracy);
  
  // Server-side rate limiting: Check if last update was too recent
  const lastLocation = await Location.findOne({ userId })
    .sort({ timestamp: -1 })
    .select('timestamp latitude longitude');
  
  if (lastLocation) {
    const timeDiff = Date.now() - new Date(lastLocation.timestamp).getTime();
    
    // If less than 5 seconds have passed, check distance
    if (timeDiff < 5000) {
      return res.status(429).json({
        status: 'success',
        message: 'Location update too frequent, skipped',
        data: { location: lastLocation }
      });
    }
    
    // If less than 15 seconds, check if significant movement (10+ meters)
    if (timeDiff < 15000) {
      const distance = calculateHaversineDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        latitude,
        longitude
      );
      
      if (distance < 10) {
        return res.status(200).json({
          status: 'success',
          message: 'Location unchanged, skipped',
          data: { location: lastLocation }
        });
      }
    }
  }
  
  // Update user's lastLogin to show they're active
  await User.findByIdAndUpdate(userId, {
    lastLogin: new Date()
  });
  
  // Create location record
  const location = await Location.create({
    userId,
    latitude,
    longitude,
    accuracy: validatedAccuracy,
    speed,
    heading,
    timestamp: locationTimestamp
  });
  
  // Broadcast location update via WebSocket
  const io = req.app.get('io');
  if (io) {
    // Get user info
    const user = await User.findById(userId).select('name parentId');
    if (user && user.parentId) {
      // Send to parent's room
      io.to(`user:${user.parentId}`).emit('location-update', {
        childId: userId,
        childName: user.name,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      });
    }
  }
  
  // Trigger geofence evaluation asynchronously
  setImmediate(() => {
    evaluateGeofences(userId, latitude, longitude).catch(error => {
      // Error handling
    });
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Location recorded successfully',
    data: {
      location
    }
  });
});

// Get location history
export const getLocationHistory = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { startTime, endTime, from, to, limit = 100, page = 1 } = req.query;
  
  // Support both startTime/endTime and from/to query params
  const start = from || startTime;
  const end = to || endTime;
  
  // Check if user can access this data
  if (userId !== req.user._id.toString()) {
    if (req.user.userType !== 'PARENT') {
      return next(new AppError('You can only access your own location history', 403));
    }
    
    // Verify the user is the parent's child
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.parentId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only access your children\'s location history', 403));
    }
  }
  
  // Build query
  const query = { userId };
  
  if (start && end) {
    query.timestamp = {
      $gte: new Date(start),
      $lte: new Date(end)
    };
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  const locations = await Location.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email userType');
  
  const total = await Location.countDocuments(query);
  
  // Transform locations to match frontend expectations
  const transformedLocations = locations.map(loc => ({
    _id: loc._id,
    coordinates: {
      latitude: loc.latitude,
      longitude: loc.longitude
    },
    latitude: loc.latitude,
    longitude: loc.longitude,
    timestamp: loc.timestamp,
    speed: loc.speed,
    accuracy: loc.accuracy,
    user: loc.user
  }));
  
  res.status(200).json({
    status: 'success',
    results: transformedLocations.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      locations: transformedLocations
    }
  });
});

// Get current locations of children
export const getChildrenLocations = catchAsync(async (req, res, next) => {
  const { childIds } = req.body;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can access children locations', 403));
  }
  
  // Validate that all childIds belong to the requesting parent
  const validChildIds = [];
  
  for (const childId of childIds) {
    const child = await User.findById(childId);
    
    if (child && child.userType === 'CHILD') {
      // Check if child has a parentId and it matches
      if (child.parentId && child.parentId.toString() === req.user._id.toString()) {
        validChildIds.push(childId);
      }
    }
  }
  
  if (validChildIds.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        locations: []
      }
    });
  }
  
  // Get latest location for each valid child
  const locations = [];
  
  for (const childId of validChildIds) {
    const latestLocation = await Location.findOne({ userId: childId })
      .sort({ timestamp: -1 })
      .populate('user', 'name email');
    
    if (latestLocation) {
      locations.push(latestLocation);
    }
  }
  
  res.status(200).json({
    status: 'success',
    results: locations.length,
    data: {
      locations
    }
  });
});

// Get user's current location
export const getCurrentLocation = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  // Check access permissions
  if (userId !== req.user._id.toString()) {
    if (req.user.userType !== 'PARENT') {
      return next(new AppError('You can only access your own location', 403));
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.parentId.toString() !== req.user._id.toString()) {
      return next(new AppError('You can only access your children\'s location', 403));
    }
  }
  
  const currentLocation = await Location.findOne({ userId })
    .sort({ timestamp: -1 })
    .populate('user', 'name email userType');
  
  if (!currentLocation) {
    return next(new AppError('No location data found for this user', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      location: currentLocation
    }
  });
});

// Geofence evaluation function (replaces geofence-evaluator Lambda)
const evaluateGeofences = async (userId, latitude, longitude) => {
  try {
    // Get user to find parentId
    const user = await User.findById(userId);
    if (!user || !user.parentId) {
      return; // No parent, no geofences to check
    }
    
    // Get all active geofences for this parent
    const geofences = await Geofence.find({
      parentId: user.parentId,
      isActive: true,
      $or: [
        { childId: null }, // General geofences
        { childId: userId } // Specific to this child
      ]
    });
    
    // Evaluate each geofence
    for (const geofence of geofences) {
      const isInside = isPointInGeofence(
        latitude,
        longitude,
        geofence.centerLat,
        geofence.centerLon,
        geofence.radius
      );
      
      // Get or create geofence state
      let state = await GeofenceState.findOne({
        userId,
        geofenceId: geofence._id
      });
      
      const wasInside = state ? state.isInside : false;
      
      // Update or create state
      if (state) {
        await state.updateState(isInside);
      } else {
        state = await GeofenceState.create({
          userId,
          geofenceId: geofence._id,
          isInside,
          lastChecked: new Date()
        });
      }
      
      // Check for state changes and create alerts
      let alertType = null;
      
      if (!wasInside && isInside && geofence.notifyOnEntry) {
        alertType = 'GEOFENCE_ENTRY';
      } else if (wasInside && !isInside && geofence.notifyOnExit) {
        alertType = 'GEOFENCE_EXIT';
      }
      
      if (alertType) {
        // Create alert
        const alert = await Alert.create({
          userId,
          parentId: user.parentId,
          type: alertType,
          location: { latitude, longitude },
          geofenceId: geofence._id,
          geofenceName: geofence.name,
          message: `${user.name} ${alertType === 'GEOFENCE_ENTRY' ? 'entered' : 'left'} ${geofence.name}`,
          timestamp: new Date()
        });
        
        // Send notification
        try {
          const parent = await User.findById(user.parentId);
          if (parent) {
            await notificationService.sendGeofenceAlert(
              user,
              parent,
              geofence,
              alertType,
              { latitude, longitude }
            );
            
            alert.notificationSent = true;
            await alert.save();
          }
        } catch (notificationError) {
          alert.notificationError = notificationError.message;
          await alert.save();
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

// Delete old locations (cleanup)
export const cleanupOldLocations = catchAsync(async (req, res, next) => {
  const daysToKeep = parseInt(req.query.days) || 30;
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const result = await Location.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  res.status(200).json({
    status: 'success',
    message: `Deleted ${result.deletedCount} old location records`,
    data: {
      deletedCount: result.deletedCount,
      cutoffDate
    }
  });
});