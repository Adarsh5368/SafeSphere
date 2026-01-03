import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        // Allow standard email format OR child-generated email format
        const standardEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const childEmailRegex = /^[^\s@]+\.child\.\d+@[^\s@]+\.[^\s@]+$/;
        return standardEmailRegex.test(email) || childEmailRegex.test(email);
      },
      message: 'Please provide a valid email'
    }
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  userType: {
    type: String,
    required: [true, 'Please provide user type'],
    enum: ['PARENT', 'CHILD']
  },
  parentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  childIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  familyCode: {
    type: String,
    index: true
  },
  trustedContacts: [{
    name: String,
    phone: String,
    email: String
  }],
  phone: {
    type: String,
    validate: {
      validator: function(phone) {
        return !phone || /^\+[1-9]\d{1,14}$/.test(phone);
      },
      message: 'Please provide a valid phone number'
    }
  },
  profilePhoto: String,
  isActive: {
    type: Boolean,
    default: true
  },
  age: Number,
  lastLogin: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ parentId: 1 });
userSchema.index({ familyCode: 1 });
userSchema.index({ userType: 1, isActive: 1 });

// Virtual populate for children
userSchema.virtual('children', {
  ref: 'User',
  localField: '_id',
  foreignField: 'parentId'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate family code for parents
userSchema.methods.generateFamilyCode = function() {
  this.familyCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  return this.familyCode;
};

const User = mongoose.model('User', userSchema);

export default User;