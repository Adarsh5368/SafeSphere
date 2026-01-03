import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from '../config/config.js';
// Load environment variables
dotenv.config();

const geofenceSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Geofence must belong to a parent'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide geofence name'],
    trim: true,
    maxlength: [50, 'Geofence name cannot be more than 50 characters']
  },
  centerLat: {
    type: Number,
    required: [true, 'Please provide center latitude'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  centerLon: {
    type: Number,
    required: [true, 'Please provide center longitude'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  radius: {
    type: Number,
    required: [true, 'Please provide radius'],
    min: [1, 'Radius must be at least 1 meter'],
    max: [parseInt(config.MAX_GEOFENCE_RADIUS || '10000'), 'Radius too large']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  childId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  notifyOnEntry: {
    type: Boolean,
    default: true
  },
  notifyOnExit: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
geofenceSchema.index({ parentId: 1, createdAt: -1 });
geofenceSchema.index({ childId: 1 });
geofenceSchema.index({ isActive: 1 });

// Virtual populate for parent
geofenceSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for child
geofenceSchema.virtual('child', {
  ref: 'User',
  localField: 'childId',
  foreignField: '_id',
  justOne: true
});

// Method to check if a point is inside the geofence
geofenceSchema.methods.isPointInside = function(lat, lon) {
  const earthRadius = 6371000; // meters
  const dLat = this.toRadians(lat - this.centerLat);
  const dLon = this.toRadians(lon - this.centerLon);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(this.centerLat)) * Math.cos(this.toRadians(lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  
  return distance <= this.radius;
};

geofenceSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

const Geofence = mongoose.model('Geofence', geofenceSchema);

export default Geofence;