import Alert from '../models/Alert.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { validateCoordinates } from '../utils/geospatial.js';
import notificationService from '../services/emailService.js';

// Trigger panic alert (replaces panic-handler Lambda)
export const triggerPanic = catchAsync(async (req, res, next) => {
  const { latitude, longitude, message = 'Emergency! Child needs help!' } = req.body;
  const userId = req.user._id;
  
  if (req.user.userType !== 'CHILD') {
    return next(new AppError('Only children can trigger panic alerts', 403));
  }
  
  if (!req.user.parentId) {
    return next(new AppError('No parent found. Cannot send panic alert.', 400));
  }
  
  // Validate coordinates
  validateCoordinates(latitude, longitude);
  
  // Get parent and child details
  const [child, parent] = await Promise.all([
    User.findById(userId),
    User.findById(req.user.parentId)
  ]);
  
  if (!parent) {
    return next(new AppError('Parent not found', 404));
  }
  
  // Create panic alert
  const alert = await Alert.create({
    userId,
    parentId: parent._id,
    type: 'PANIC',
    location: { latitude, longitude },
    message,
    timestamp: new Date()
  });
  
  // Populate userId field for response
  await alert.populate('userId', 'name email');
  
  // Broadcast alert via WebSocket if available
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${parent._id}`).emit('alert-received', {
      _id: alert._id,
      type: alert.type,
      message: alert.message,
      timestamp: alert.timestamp,
      userId: child._id,
      userName: child.name,
      location: { latitude, longitude }
    });
  }
  
  // Send notifications asynchronously
  setImmediate(async () => {
    try {
      const notifications = await notificationService.sendPanicAlert(
        child,
        parent,
        parent.trustedContacts || [],
        { latitude, longitude },
        message
      );
      
      // Update alert with notification status
      alert.notificationSent = notifications.some(n => n.status === 'success');
      if (!alert.notificationSent) {
        alert.notificationError = 'All notifications failed';
      }
      await alert.save();
    } catch (error) {
      alert.notificationError = error.message;
      await alert.save();
    }
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Panic alert triggered successfully',
    data: {
      alert
    }
  });
});

// Get alerts for parent
export const getAlerts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, isRead, type, childId } = req.query;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can view alerts', 403));
  }
  
  // Build query
  const query = { parentId: req.user._id };
  
  if (isRead !== undefined) {
    query.isRead = isRead === 'true';
  }
  
  if (type) {
    query.type = type;
  }
  
  if (childId) {
    // Verify child belongs to parent
    const child = await User.findById(childId);
    if (!child || child.parentId.toString() !== req.user._id.toString()) {
      return next(new AppError('Child not found or does not belong to you', 404));
    }
    query.userId = childId;
  }
  
  const skip = (page - 1) * limit;
  
  const alerts = await Alert.find(query)
    .populate('user', 'name email userType')
    .populate('geofence', 'name')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Alert.countDocuments(query);
  const unreadCount = await Alert.countDocuments({ ...query, isRead: false });
  
  res.status(200).json({
    status: 'success',
    results: alerts.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    summary: {
      total,
      unread: unreadCount
    },
    data: {
      alerts
    }
  });
});

// Mark alert as read
export const markAlertAsRead = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;
  
  const alert = await Alert.findById(alertId);
  
  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }
  
  // Check if user has access to this alert
  if (alert.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have access to this alert', 403));
  }
  
  alert.isRead = true;
  await alert.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Alert marked as read',
    data: {
      alert
    }
  });
});

// Mark multiple alerts as read
export const markMultipleAlertsAsRead = catchAsync(async (req, res, next) => {
  const { alertIds } = req.body;
  
  if (!Array.isArray(alertIds) || alertIds.length === 0) {
    return next(new AppError('Please provide an array of alert IDs', 400));
  }
  
  // Update only alerts that belong to the current user
  const result = await Alert.updateMany(
    {
      _id: { $in: alertIds },
      parentId: req.user._id
    },
    {
      isRead: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    message: `${result.modifiedCount} alerts marked as read`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

// Mark all alerts as read
export const markAllAlertsAsRead = catchAsync(async (req, res, next) => {
  const result = await Alert.updateMany(
    {
      parentId: req.user._id,
      isRead: false
    },
    {
      isRead: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    message: `${result.modifiedCount} alerts marked as read`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

// Get alert details
export const getAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;
  
  const alert = await Alert.findById(alertId)
    .populate('user', 'name email userType age')
    .populate('parent', 'name email phone')
    .populate('geofence', 'name centerLat centerLon radius');
  
  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }
  
  // Check access permissions
  const hasAccess = alert.parentId.toString() === req.user._id.toString() ||
                   alert.userId.toString() === req.user._id.toString();
  
  if (!hasAccess) {
    return next(new AppError('You do not have access to this alert', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      alert
    }
  });
});

// Delete alert
export const deleteAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;
  
  const alert = await Alert.findById(alertId);
  
  if (!alert) {
    return next(new AppError('Alert not found', 404));
  }
  
  // Only parent can delete alerts
  if (alert.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own alerts', 403));
  }
  
  await Alert.findByIdAndDelete(alertId);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get alert statistics
export const getAlertStats = catchAsync(async (req, res, next) => {
  const { timeRange = '7d' } = req.query;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can view alert statistics', 403));
  }
  
  // Calculate date range
  let startDate;
  const now = new Date();
  
  switch (timeRange) {
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  
  const matchStage = {
    parentId: req.user._id,
    timestamp: { $gte: startDate }
  };
  
  const stats = await Alert.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        unreadAlerts: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        panicAlerts: {
          $sum: { $cond: [{ $eq: ['$type', 'PANIC'] }, 1, 0] }
        },
        geofenceAlerts: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$type', 'GEOFENCE_ENTRY'] },
                  { $eq: ['$type', 'GEOFENCE_EXIT'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  const alertsByType = await Alert.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const alertsByChild = await Alert.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'child'
      }
    },
    { $unwind: '$child' },
    {
      $group: {
        _id: '$userId',
        childName: { $first: '$child.name' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      timeRange,
      summary: stats[0] || {
        totalAlerts: 0,
        unreadAlerts: 0,
        panicAlerts: 0,
        geofenceAlerts: 0
      },
      alertsByType,
      alertsByChild
    }
  });
});

// Get recent alerts (for dashboard)
export const getRecentAlerts = catchAsync(async (req, res, next) => {
  const { limit = 5 } = req.query;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can view alerts', 403));
  }
  
  const alerts = await Alert.find({ parentId: req.user._id })
    .populate('userId', 'name email')
    .populate('geofenceId', 'name')
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));
  
  const unreadCount = await Alert.countDocuments({
    parentId: req.user._id,
    isRead: false
  });
  
  res.status(200).json({
    status: 'success',
    results: alerts.length,
    summary: {
      unread: unreadCount
    },
    data: {
      alerts
    }
  });
});