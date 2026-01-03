import mongoose from 'mongoose';
import config from '../config/config.js';
const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Location must belong to a user'],
    index: true
  },
  latitude: {
    type: Number,
    required: [true, 'Please provide latitude'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    required: [true, 'Please provide longitude'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  accuracy: {
    type: Number,
    default: 0,
    min: [0, 'Accuracy cannot be negative']
  },
  speed: {
    type: Number,
    default: null,
    min: [0, 'Speed cannot be negative']
  },
  heading: {
    type: Number,
    default: null,
    min: [0, 'Heading must be between 0 and 360'],
    max: [360, 'Heading must be between 0 and 360']
  },
  timestamp: {
    type: Date,
    required: [true, 'Please provide timestamp'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
locationSchema.index({ userId: 1, timestamp: -1 });
locationSchema.index({ timestamp: -1 });
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

// Virtual populate for user
locationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Validation for location age
locationSchema.pre('save', function(next) {
  const locationAge = Date.now() - new Date(this.timestamp).getTime();
  
  // Allow timestamps slightly in the future (up to 5 minutes) due to clock differences
  if (locationAge < -300000) {
    return next(new Error('Location timestamp is too far in the future'));
  }
  
  // Allow older timestamps (up to 30 minutes for flexibility)
  if (locationAge > 1800000) {
    return next(new Error('Location data is too old'));
  }
  
  // Very lenient accuracy threshold for development (500m)
  // In production, you can make this stricter
  if (this.accuracy && this.accuracy > 500) {
    // Don't reject, just warn
  }
  
  next();
});

const Location = mongoose.model('Location', locationSchema);

export default Location;