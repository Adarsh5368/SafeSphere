import express from 'express';
import {
  recordLocation,
  getLocationHistory,
  getChildrenLocations,
  getCurrentLocation,
  cleanupOldLocations
} from '../controllers/locationController.js';
import { protect, restrictTo, checkDataAccess } from '../middleware/auth.js';
import {
  locationValidation,
  validateObjectId,
  validateDateRange,
  validatePagination,
  handleValidationErrors
} from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Record location (children only)
router.post('/', restrictTo('CHILD'), locationValidation, recordLocation);

// Get children's current locations (parents only)
router.post('/children', restrictTo('PARENT'), getChildrenLocations);

// Get location history
router.get('/history/:userId',
  validateObjectId('userId'),
  validateDateRange(),
  validatePagination(),
  handleValidationErrors,
  checkDataAccess,
  getLocationHistory
);

// Get current location
router.get('/current/:userId',
  validateObjectId('userId'),
  handleValidationErrors,
  checkDataAccess,
  getCurrentLocation
);

// Admin route for cleanup (could be restricted further)
router.delete('/cleanup', restrictTo('PARENT'), cleanupOldLocations);

export default router;