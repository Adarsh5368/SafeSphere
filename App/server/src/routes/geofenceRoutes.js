import express from 'express';
import {
  createGeofence,
  getGeofences,
  getGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofenceStates,
  toggleGeofence,
  getChildGeofences
} from '../controllers/geofenceController.js';
import { protect, restrictTo, checkParentChildRelation } from '../middleware/auth.js';
import {
  geofenceValidation,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Geofence CRUD (parents only)
router.post('/', restrictTo('PARENT'), geofenceValidation, createGeofence);
router.get('/', restrictTo('PARENT'), validatePagination(), handleValidationErrors, getGeofences);

router.route('/:geofenceId')
  .get(validateObjectId('geofenceId'), handleValidationErrors, getGeofence)
  .patch(restrictTo('PARENT'), validateObjectId('geofenceId'), handleValidationErrors, updateGeofence)
  .delete(restrictTo('PARENT'), validateObjectId('geofenceId'), handleValidationErrors, deleteGeofence);

// Toggle geofence active status
router.patch('/:geofenceId/toggle',
  restrictTo('PARENT'),
  validateObjectId('geofenceId'),
  handleValidationErrors,
  toggleGeofence
);

// Get geofence states for a child
router.get('/states/:childId',
  restrictTo('PARENT'),
  validateObjectId('childId'),
  handleValidationErrors,
  checkParentChildRelation,
  getGeofenceStates
);

// Get geofences for a specific child
router.get('/child/:childId',
  validateObjectId('childId'),
  handleValidationErrors,
  getChildGeofences
);

export default router;