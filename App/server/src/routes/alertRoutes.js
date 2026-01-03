import express from 'express';
import {
  triggerPanic,
  getAlerts,
  markAlertAsRead,
  markMultipleAlertsAsRead,
  markAllAlertsAsRead,
  getAlert,
  deleteAlert,
  getAlertStats,
  getRecentAlerts
} from '../controllers/alertController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  panicValidation,
  validateObjectId,
  validatePagination,
  handleValidationErrors
} from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Trigger panic alert (children only)
router.post('/panic', restrictTo('CHILD'), panicValidation, triggerPanic);

// Get alerts (parents only)
router.get('/', restrictTo('PARENT'), validatePagination(), handleValidationErrors, getAlerts);

// Get recent alerts for dashboard
router.get('/recent', restrictTo('PARENT'), getRecentAlerts);

// Get alert statistics
router.get('/stats', restrictTo('PARENT'), getAlertStats);

// Mark alerts as read
router.patch('/markAsRead', restrictTo('PARENT'), markMultipleAlertsAsRead);
router.patch('/markAllAsRead', restrictTo('PARENT'), markAllAlertsAsRead);

// Individual alert operations
router.route('/:alertId')
  .get(validateObjectId('alertId'), handleValidationErrors, getAlert)
  .patch(restrictTo('PARENT'), validateObjectId('alertId'), handleValidationErrors, markAlertAsRead)
  .delete(restrictTo('PARENT'), validateObjectId('alertId'), handleValidationErrors, deleteAlert);

export default router;