import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import { extractTokenFromRequest } from '../utils/jwt.js';
import config from '../config/config.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+password');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token does no longer exist.', 401)
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }

    // 5) Check if user is active
    if (!currentUser.isActive) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    return next(error);
  }
};

// Restrict to certain roles
export const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Check if user is parent of the child being accessed
export const checkParentChildRelation = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    if (req.user.userType !== 'PARENT') {
      return next(new AppError('Only parents can perform this action', 403));
    }

    const child = await User.findById(childId);
    if (!child) {
      return next(new AppError('Child not found', 404));
    }

    if (child.parentId.toString() !== parentId.toString()) {
      return next(new AppError('You can only access your own children', 403));
    }

    req.child = child;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access their own data or their children's data
export const checkDataAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Users can always access their own data
    if (userId === currentUserId.toString()) {
      return next();
    }

    // Parents can access their children's data
    if (req.user.userType === 'PARENT') {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return next(new AppError('User not found', 404));
      }

      if (targetUser.parentId && targetUser.parentId.toString() === currentUserId.toString()) {
        req.targetUser = targetUser;
        return next();
      }
    }

    return next(new AppError('You do not have permission to access this data', 403));
  } catch (error) {
    next(error);
  }
};

// Optional authentication - don't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (token) {
      const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};