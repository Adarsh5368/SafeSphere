import mongoose from 'mongoose';

const geofenceStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'GeofenceState must belong to a user'],
    index: true
  },
  geofenceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Geofence',
    required: [true, 'GeofenceState must belong to a geofence'],
    index: true
  },
  isInside: {
    type: Boolean,
    required: [true, 'Please provide inside state'],
    default: false
  },
  lastChecked: {
    type: Date,
    required: [true, 'Please provide last checked time'],
    default: Date.now,
    index: true
  },
  lastEntry: {
    type: Date,
    default: null
  },
  lastExit: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index to ensure one state per user-geofence pair
geofenceStateSchema.index({ userId: 1, geofenceId: 1 }, { unique: true });
geofenceStateSchema.index({ lastChecked: -1 });
geofenceStateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

// Virtual populate for user
geofenceStateSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for geofence
geofenceStateSchema.virtual('geofence', {
  ref: 'Geofence',
  localField: 'geofenceId',
  foreignField: '_id',
  justOne: true
});

// Static method to find or create state
geofenceStateSchema.statics.findOrCreate = async function(userId, geofenceId, isInside) {
  let state = await this.findOne({ userId, geofenceId });
  
  if (!state) {
    state = await this.create({
      userId,
      geofenceId,
      isInside,
      lastChecked: new Date()
    });
  }
  
  return state;
};

// Instance method to update state with transition tracking
geofenceStateSchema.methods.updateState = function(isInside) {
  const wasInside = this.isInside;
  const now = new Date();
  
  this.isInside = isInside;
  this.lastChecked = now;
  
  // Track transitions
  if (!wasInside && isInside) {
    this.lastEntry = now;
  } else if (wasInside && !isInside) {
    this.lastExit = now;
  }
  
  return this.save();
};

const GeofenceState = mongoose.model('GeofenceState', geofenceStateSchema);

export default GeofenceState;