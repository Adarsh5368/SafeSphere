import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Alert must belong to a user'],
    index: true
  },
  parentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Alert must have a parent recipient'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Please provide alert type'],
    enum: ['PANIC', 'GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY'],
    index: true
  },
  location: {
    type: {
      latitude: {
        type: Number,
        required: true,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        required: true,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    required: true
  },
  geofenceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Geofence',
    default: null
  },
  geofenceName: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: [true, 'Please provide alert message'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  timestamp: {
    type: Date,
    required: [true, 'Please provide timestamp'],
    index: true
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationError: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
alertSchema.index({ parentId: 1, timestamp: -1 });
alertSchema.index({ userId: 1, timestamp: -1 });
alertSchema.index({ type: 1, timestamp: -1 });
alertSchema.index({ isRead: 1, parentId: 1 });
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // Auto-delete after 90 days

// Virtual populate for user (child)
alertSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for parent
alertSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for geofence
alertSchema.virtual('geofence', {
  ref: 'Geofence',
  localField: 'geofenceId',
  foreignField: '_id',
  justOne: true
});

// Instance method to mark as read
alertSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;