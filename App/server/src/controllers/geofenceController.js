import Geofence from '../models/Geofence.js';
import GeofenceState from '../models/GeofenceState.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { validateCoordinates } from '../utils/geospatial.js';

// Create geofence (replaces create-geofence-handler Lambda)
export const createGeofence = catchAsync(async (req, res, next) => {
  const { name, centerLat, centerLon, radius, childId, notifyOnEntry = true, notifyOnExit = true } = req.body;
  const parentId = req.user._id;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can create geofences', 403));
  }
  
  // Validate coordinates
  validateCoordinates(centerLat, centerLon);
  
  // If childId is specified, validate it's the parent's child
  if (childId) {
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== parentId.toString() || child.userType !== 'CHILD') {
      return next(new AppError('Invalid child ID or child does not belong to you', 400));
    }
  }
  
  const geofence = await Geofence.create({
    parentId,
    name,
    centerLat,
    centerLon,
    radius,
    childId: childId || null,
    notifyOnEntry,
    notifyOnExit
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Geofence created successfully',
    data: {
      geofence
    }
  });
});

// Get all geofences for parent
export const getGeofences = catchAsync(async (req, res, next) => {
  const parentId = req.user._id;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can view geofences', 403));
  }
  
  const { page = 1, limit = 100, childId, isActive } = req.query;
  
  // Build query
  const query = { parentId };
  if (childId) {
    query.childId = childId;
  }
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  const skip = (page - 1) * limit;
  
  const geofences = await Geofence.find(query)
    .populate('childId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Geofence.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: geofences.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      geofences
    }
  });
});

// Get specific geofence
export const getGeofence = catchAsync(async (req, res, next) => {
  const { geofenceId } = req.params;
  
  const geofence = await Geofence.findById(geofenceId)
    .populate('parent', 'name email')
    .populate('child', 'name email');
  
  if (!geofence) {
    return next(new AppError('Geofence not found', 404));
  }
  
  // Check if user has access to this geofence
  if (geofence.parentId.toString() !== req.user._id.toString()) {
    if (req.user.userType !== 'CHILD' || !geofence.childId || geofence.childId.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have access to this geofence', 403));
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      geofence
    }
  });
});

// Update geofence
export const updateGeofence = catchAsync(async (req, res, next) => {
  const { geofenceId } = req.params;
  
  const geofence = await Geofence.findById(geofenceId);
  
  if (!geofence) {
    return next(new AppError('Geofence not found', 404));
  }
  
  // Only parent can update geofence
  if (geofence.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own geofences', 403));
  }
  
  // Validate coordinates if provided
  if (req.body.centerLat !== undefined || req.body.centerLon !== undefined) {
    const centerLat = req.body.centerLat || geofence.centerLat;
    const centerLon = req.body.centerLon || geofence.centerLon;
    validateCoordinates(centerLat, centerLon);
  }
  
  // Validate childId if provided
  if (req.body.childId) {
    const child = await User.findById(req.body.childId);
    if (!child || child.parentId.toString() !== req.user._id.toString() || child.userType !== 'CHILD') {
      return next(new AppError('Invalid child ID or child does not belong to you', 400));
    }
  }
  
  const allowedFields = ['name', 'centerLat', 'centerLon', 'radius', 'childId', 'notifyOnEntry', 'notifyOnExit', 'isActive'];
  const updateData = {};
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });
  
  const updatedGeofence = await Geofence.findByIdAndUpdate(
    geofenceId,
    updateData,
    { new: true, runValidators: true }
  ).populate('child', 'name email');
  
  res.status(200).json({
    status: 'success',
    message: 'Geofence updated successfully',
    data: {
      geofence: updatedGeofence
    }
  });
});

// Delete geofence
export const deleteGeofence = catchAsync(async (req, res, next) => {
  const { geofenceId } = req.params;
  
  const geofence = await Geofence.findById(geofenceId);
  
  if (!geofence) {
    return next(new AppError('Geofence not found', 404));
  }
  
  // Only parent can delete geofence
  if (geofence.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own geofences', 403));
  }
  
  await Geofence.findByIdAndDelete(geofenceId);
  
  // Clean up related geofence states
  await GeofenceState.deleteMany({ geofenceId });
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get geofence states for monitoring
export const getGeofenceStates = catchAsync(async (req, res, next) => {
  const { childId } = req.params;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can view geofence states', 403));
  }
  
  // Verify child belongs to parent
  const child = await User.findById(childId);
  if (!child || child.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('Child not found or does not belong to you', 404));
  }
  
  const states = await GeofenceState.find({ userId: childId })
    .populate('geofence', 'name centerLat centerLon radius isActive')
    .sort({ lastChecked: -1 });
  
  res.status(200).json({
    status: 'success',
    results: states.length,
    data: {
      states
    }
  });
});

// Toggle geofence active status
export const toggleGeofence = catchAsync(async (req, res, next) => {
  const { geofenceId } = req.params;
  
  const geofence = await Geofence.findById(geofenceId);
  
  if (!geofence) {
    return next(new AppError('Geofence not found', 404));
  }
  
  // Only parent can toggle geofence
  if (geofence.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only modify your own geofences', 403));
  }
  
  geofence.isActive = !geofence.isActive;
  await geofence.save();
  
  res.status(200).json({
    status: 'success',
    message: `Geofence ${geofence.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      geofence
    }
  });
});

// Get geofences that apply to a specific child
export const getChildGeofences = catchAsync(async (req, res, next) => {
  const { childId } = req.params;
  
  // Check if user can access this child's data
  if (req.user.userType === 'CHILD' && req.user._id.toString() !== childId) {
    return next(new AppError('You can only view your own geofences', 403));
  }
  
  if (req.user.userType === 'PARENT') {
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== req.user._id.toString()) {
      return next(new AppError('Child not found or does not belong to you', 404));
    }
  }
  
  const parentId = req.user.userType === 'PARENT' ? req.user._id : req.user.parentId;
  
  // Get geofences that apply to this child (general ones and specific ones)
  const geofences = await Geofence.find({
    parentId,
    isActive: true,
    $or: [
      { childId: null }, // General geofences
      { childId: childId } // Specific to this child
    ]
  }).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: geofences.length,
    data: {
      geofences
    }
  });
});