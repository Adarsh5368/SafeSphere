import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import { createSendToken } from '../utils/jwt.js';
import notificationService from '../services/emailService.js';

// Generate random password
const generateRandomPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Register new user (PARENT only - children are created by parents)
export const signup = catchAsync(async (req, res, next) => {
  const { email, name, userType, phone, profilePhoto } = req.body;
  
  // Only allow PARENT registration
  if (userType !== 'PARENT') {
    return next(new AppError('Direct registration is only allowed for parents. Children must be added by their parents.', 403));
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }
  
  // Generate family code for parents
  const familyCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  
  // For now, we'll require password in the request body
  // In production, this might be handled differently
  if (!req.body.password) {
    return next(new AppError('Password is required', 400));
  }
  
  const newUser = await User.create({
    email,
    name,
    password: req.body.password,
    userType,
    phone,
    profilePhoto,
    familyCode,
    trustedContacts: userType === 'PARENT' ? [] : undefined
  });
  
  // Send welcome email
  try {
    await notificationService.sendWelcomeEmail(newUser);
  } catch (error) {
    // Email sending failed silently
  }
  
  createSendToken(newUser, 201, req, res, 'User registered successfully');
});

// Login user
export const login = catchAsync(async (req, res, next) => {
  const { email, password, familyCode } = req.body;
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  
  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // For CHILD users require familyCode to match
  if (user.userType === 'CHILD') {
    if (!familyCode) {
      return next(new AppError('Family code is required for child login', 400));
    }

    // Child user should have familyCode set (copied from parent at creation)
    if (!user.familyCode || user.familyCode !== familyCode) {
      return next(new AppError('Invalid family code', 401));
    }
  }
  
  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  
  // If everything ok, send token to client
  createSendToken(user, 200, req, res, 'Logged in successfully');
});

// Logout user
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

// Get current user
export const getMe = catchAsync(async (req, res, next) => {
  // Get user with populated children if parent
  let user;
  if (req.user.userType === 'PARENT') {
    user = await User.findById(req.user._id).populate({
      path: 'children',
      match: { isActive: true },
      select: 'name email userType age createdAt'
    });
  } else {
    user = await User.findById(req.user._id).populate({
      path: 'parentId',
      select: 'name email phone'
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update current user
export const updateMe = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /updateMyPassword.', 400)
    );
  }
  
  // Filter out unwanted fields that are not allowed to be updated
  const allowedFields = ['name', 'phone', 'profilePhoto', 'trustedContacts'];
  const filteredBody = {};
  
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });
  
  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Update password
export const updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  
  // Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  
  // If so, update password
  user.password = req.body.password;
  await user.save();
  
  // Log user in, send JWT
  createSendToken(user, 200, req, res, 'Password updated successfully');
});

// Forgot password
export const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  
  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  try {
    // For now, just return the token (in production, send via email)
    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      resetToken // Remove this in production
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(
      new AppError('There was an error sending the email. Try again later!', 500)
    );
  }
});

// Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  
  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  
  // Update changedPasswordAt property for the user (done in pre-save middleware)
  
  // Log the user in, send JWT
  createSendToken(user, 200, req, res, 'Password reset successfully');
});

// Create child user (Parent only)
export const createChildUser = catchAsync(async (req, res, next) => {
  const { name, age } = req.body;
  const parentId = req.user._id;
  const parentEmail = req.user.email;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can create child accounts', 403));
  }
  
  // Generate email for child
  const emailParts = parentEmail.split('@');
  const childEmail = `${emailParts[0]}.child.${Date.now()}@${emailParts[1]}`;
  
  // Generate temporary password
  const tempPassword = generateRandomPassword();
  
  const childUser = await User.create({
    email: childEmail,
    name,
    password: tempPassword,
    userType: 'CHILD',
    parentId,
    familyCode: req.user.familyCode,
    age
  });
  
  // Update parent's childIds
  await User.findByIdAndUpdate(parentId, {
    $push: { childIds: childUser._id }
  });
  
  // Send welcome email with credentials
  try {
    await notificationService.sendWelcomeEmail(childUser, tempPassword);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
  
  res.status(201).json({
    status: 'success',
    message: 'Child user created successfully',
    data: {
      child: childUser,
      credentials: {
        name: name,
        email: childEmail,
        password: tempPassword,
        familyCode: req.user.familyCode
      }
    }
  });
});

// Deactivate child (Parent only)
export const deactivateChild = catchAsync(async (req, res, next) => {
  const { childId } = req.params;
  
  if (req.user.userType !== 'PARENT') {
    return next(new AppError('Only parents can deactivate child accounts', 403));
  }
  
  const child = await User.findById(childId);
  if (!child) {
    return next(new AppError('Child not found', 404));
  }
  
  if (child.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only deactivate your own children', 403));
  }
  
  child.isActive = false;
  await child.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Child deactivated successfully',
    data: {
      child
    }
  });
});

// Join family (Child only)
export const joinFamily = catchAsync(async (req, res, next) => {
  const { familyCode } = req.body;
  
  if (req.user.userType !== 'CHILD') {
    return next(new AppError('Only children can join families', 403));
  }
  
  if (req.user.parentId) {
    return next(new AppError('You are already part of a family', 400));
  }
  
  // Find parent with the family code
  const parent = await User.findOne({ familyCode, userType: 'PARENT' });
  if (!parent) {
    return next(new AppError('Invalid family code', 404));
  }
  
  // Update child's parentId and familyCode
  req.user.parentId = parent._id;
  req.user.familyCode = familyCode;
  await req.user.save();
  
  // Add child to parent's childIds
  await User.findByIdAndUpdate(parent._id, {
    $push: { childIds: req.user._id }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Successfully joined family',
    data: {
      parent: {
        name: parent.name,
        email: parent.email
      }
    }
  });
});