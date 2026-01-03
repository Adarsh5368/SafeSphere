import User from '../models/User.js';
import Location from '../models/Location.js';
import Alert from '../models/Alert.js';
import Geofence from '../models/Geofence.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import notificationService from '../services/emailService.js';

// Get user profile (replaces parts of user-management Lambda)
export const getProfile = catchAsync(async (req, res, next) => {
  let user;
  
  if (req.user.userType === 'PARENT') {
    user = await User.findById(req.user._id)
      .populate({
        path: 'children',
        match: { isActive: true },
        select: 'name email age createdAt'
      });
  } else {
    user = await User.findById(req.user._id)
      .populate('parentId', 'name email phone familyCode');
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req, res, next) => {
  // Fields that can be updated
  const allowedFields = req.user.userType === 'PARENT' 
    ? ['name', 'phone', 'profilePhoto', 'trustedContacts']
    : ['name', 'profilePhoto'];
  
  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });
  
  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    filteredBody,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

// Get family members
export const getFamilyMembers = catchAsync(async (req, res, next) => {
  let familyMembers = [];
  
  if (req.user.userType === 'PARENT') {
    // Get all children (including inactive ones for management purposes)
    familyMembers = await User.find({
      parentId: req.user._id
    }).select('name email age userType createdAt isActive lastLogin');
  } else {
    // Get parent and siblings
    if (req.user.parentId) {
      const [parent, siblings] = await Promise.all([
        User.findById(req.user.parentId).select('name email phone userType'),
        User.find({
          parentId: req.user.parentId,
          _id: { $ne: req.user._id },
          isActive: true
        }).select('name email age userType')
      ]);
      
      if (parent) {
        familyMembers.push(parent);
      }
      familyMembers = familyMembers.concat(siblings);
    }
  }
  
  res.status(200).json({
    status: 'success',
    results: familyMembers.length,
    data: {
      familyMembers,
      children: familyMembers.filter(m => m.userType === 'CHILD') // Alias for frontend compatibility
    }
  });
});

// Get user dashboard data
export const getDashboard = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userType = req.user.userType;
  
  if (userType === 'PARENT') {
    // Parent dashboard
    const [activeGeofences, unreadAlerts] = await Promise.all([
      Geofence.countDocuments({ parentId: userId, isActive: true }),
      Alert.countDocuments({ parentId: userId, isRead: false })
    ]);
    
    // Get all children with last login info
    const children = await User.find({ parentId: userId, isActive: true })
      .select('name email age createdAt lastLogin');
    
    // Calculate last activity time
    const now = new Date();
    const lastActivity = children.reduce((latest, child) => {
      if (child.lastLogin && (!latest || child.lastLogin > latest)) {
        return child.lastLogin;
      }
      return latest;
    }, null);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalChildren: children.length,
        activeGeofences,
        unreadAlerts,
        lastActivity: lastActivity || new Date()
      }
    });
  } else {
    // Child dashboard
    const [parent, myAlerts, myGeofences] = await Promise.all([
      User.findById(req.user.parentId).select('name email phone'),
      Alert.find({ userId })
        .sort({ timestamp: -1 })
        .limit(5),
      Geofence.find({
        parentId: req.user.parentId,
        isActive: true,
        $or: [{ childId: null }, { childId: userId }]
      }).select('name centerLat centerLon radius')
    ]);
    
    const myLatestLocation = await Location.findOne({ userId })
      .sort({ timestamp: -1 })
      .select('latitude longitude timestamp accuracy');
    
    res.status(200).json({
      status: 'success',
      data: {
        userType,
        summary: {
          totalAlerts: myAlerts.length,
          activeGeofences: myGeofences.length,
          hasParent: !!parent
        },
        parent,
        latestLocation: myLatestLocation,
        recentAlerts: myAlerts,
        geofences: myGeofences
      }
    });
  }
});

// Search users (for family management)
export const searchUsers = catchAsync(async (req, res, next) => {
  const { query, userType } = req.query;
  
  if (!query || query.length < 3) {
    return next(new AppError('Search query must be at least 3 characters long', 400));
  }
  
  const searchCriteria = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  };
  
  if (userType) {
    searchCriteria.userType = userType;
  }
  
  const users = await User.find(searchCriteria)
    .select('name email userType familyCode')
    .limit(10);
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// Update trusted contacts (Parent only)
export const updateTrustedContacts = catchAsync(async (req, res, next) => {
  const { trustedContacts } = req.body;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can update trusted contacts', 403));
  }
  
  if (!Array.isArray(trustedContacts)) {
    return next(new AppError('Trusted contacts must be an array', 400));
  }
  
  // Validate trusted contacts structure
  for (const contact of trustedContacts) {
    if (!contact.name || !contact.phone) {
      return next(new AppError('Each trusted contact must have name and phone', 400));
    }
    
    // Validate phone format
    if (!/^\+[1-9]\d{1,14}$/.test(contact.phone)) {
      return next(new AppError(`Invalid phone format for ${contact.name}`, 400));
    }
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { trustedContacts },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Trusted contacts updated successfully',
    data: {
      trustedContacts: updatedUser.trustedContacts
    }
  });
});

// Get user activity summary
export const getActivitySummary = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { days = 7 } = req.query;
  
  // Check access permissions
  if (userId !== req.user._id.toString()) {
    if (req.user.userType !== 'PARENT') {
      return next(new AppError('You can only view your own activity', 403));
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.parentId.toString() !== req.user._id.toString()) {
      return next(new AppError('User not found or access denied', 404));
    }
  }
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const [locationCount, alertCount, lastLocation] = await Promise.all([
    Location.countDocuments({
      userId,
      createdAt: { $gte: startDate }
    }),
    Alert.countDocuments({
      userId,
      timestamp: { $gte: startDate }
    }),
    Location.findOne({ userId })
      .sort({ timestamp: -1 })
      .select('timestamp latitude longitude')
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      period: `${days} days`,
      summary: {
        locationUpdates: locationCount,
        alertsTriggered: alertCount,
        lastSeen: lastLocation?.timestamp,
        lastLocation: lastLocation ? {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude
        } : null
      }
    }
  });
});

// Delete account (soft delete)
export const deleteAccount = catchAsync(async (req, res, next) => {
  // For now, just deactivate the account
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});