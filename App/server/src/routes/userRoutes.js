import express from 'express';
import {
  getProfile,
  updateProfile,
  getFamilyMembers,
  getDashboard,
  searchUsers,
  updateTrustedContacts,
  getActivitySummary,
  deleteAccount
} from '../controllers/userController.js';
import { protect, restrictTo, checkDataAccess } from '../middleware/auth.js';
import {
  validateObjectId,
  validatePagination,
  handleValidationErrors
} from '../utils/validators.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Profile management
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Dashboard
router.get('/dashboard', getDashboard);

// Family management
router.get('/family', getFamilyMembers);
router.patch('/trustedContacts', restrictTo('PARENT'), updateTrustedContacts);

// User search
router.get('/search', validatePagination(), handleValidationErrors, searchUsers);

// Activity summary
router.get('/activity/:userId',
  validateObjectId('userId'),
  handleValidationErrors,
  checkDataAccess,
  getActivitySummary
);

// Account deletion
router.delete('/account', deleteAccount);

export default router;