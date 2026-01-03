import { body, param, query, validationResult } from 'express-validator';
import AppError from './appError.js';
import config from '../config/config.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  next();
};

export const validateEmail = () =>
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');

export const validateEmailForLogin = () =>
  body('email')
    .custom((email) => {
      // Allow standard email format OR child-generated email format
      const standardEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const childEmailRegex = /^[^\s@]+\.child\.\d+@[^\s@]+\.[^\s@]+$/;
      
      if (standardEmailRegex.test(email) || childEmailRegex.test(email)) {
        return true;
      }
      throw new Error('Please provide a valid email address');
    })
    .normalizeEmail();

export const validatePassword = () =>
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase, uppercase, number, and special character');

export const validateName = () =>
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces');

export const validateUserType = () =>
  body('userType')
    .isIn(['PARENT', 'CHILD'])
    .withMessage('User type must be either PARENT or CHILD');

export const validatePhone = () =>
  body('phone')
    .optional()
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Phone number must be in international format');

export const validateCoordinates = () => [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

export const validateGeofenceCoordinates = () => [
  body('centerLat').isFloat({ min: -90, max: 90 }).withMessage('Center latitude must be between -90 and 90'),
  body('centerLon').isFloat({ min: -180, max: 180 }).withMessage('Center longitude must be between -180 and 180')
];

export const validateGeofenceRadius = () =>
  body('radius')
    .isFloat({ min: 1, max: config.MAX_GEOFENCE_RADIUS })
    .withMessage(`Radius must be between 1 and ${config.MAX_GEOFENCE_RADIUS} meters`);

export const validateObjectId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ID`);

export const validateTimestamp = () =>
  body('timestamp').isISO8601().withMessage('Timestamp must be ISO 8601').toDate();

export const validatePagination = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100').toInt()
];

// Validation sets
export const registerValidation = [
  validateEmail(),
  validatePassword(),
  validateName(),
  validateUserType(),
  // validatePhone(), // Temporarily disabled for testing
  handleValidationErrors
];

export const loginValidation = [
  validateEmailForLogin(),
  body('password').notEmpty().withMessage('Password is required'),
  body('familyCode')
    .optional()
    .isLength({ min: 6, max: 12 })
    .withMessage('Family code must be between 6 and 12 characters')
    .isAlphanumeric()
    .withMessage('Family code must be alphanumeric'),
  handleValidationErrors
];

// Location validation
export const locationValidation = [
  validateCoordinates(),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude must be a number'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 359.99 })
    .withMessage('Heading must be between 0 and 359.99 degrees'),
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Speed must be a positive number'),
  validateTimestamp(),
  handleValidationErrors
];

// Date range validation
export const validateDateRange = () => [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be ISO 8601 format')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be ISO 8601 format')
    .toDate(),
  query('endDate')
    .optional()
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Geofence validation
export const geofenceValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Geofence name must be between 1 and 100 characters'),
  validateGeofenceCoordinates(),
  validateGeofenceRadius(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  handleValidationErrors
];

// Alert validation
export const alertValidation = [
  body('type')
    .isIn(['PANIC', 'GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY', 'LOCATION_LOST'])
    .withMessage('Invalid alert type'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters'),
  body('severity')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid severity level'),
  handleValidationErrors
];

// Panic alert validation
export const panicValidation = [
  validateCoordinates(),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Emergency message must be less than 500 characters'),
  handleValidationErrors
];
