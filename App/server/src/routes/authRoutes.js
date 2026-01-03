import express from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  updateMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  createChildUser,
  deactivateChild,
  joinFamily
} from '../controllers/authController.js';
import { protect, restrictTo, checkParentChildRelation } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
  validateObjectId
} from '../utils/validators.js';

const router = express.Router();

// Public routes
router.post('/signup', registerValidation, signup);
router.post('/login', loginValidation, login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.post('/logout', logout);

// Protected routes (require authentication)
router.use(protect);

// Token verification route
router.post('/verify', getMe); // Reuse getMe for token verification

// Current user routes
router.get('/me', getMe);
router.patch('/updateMe', updateMe);
router.patch('/updateMyPassword', updatePassword);

// Parent-only routes
router.post('/createChild', restrictTo('PARENT'), createChildUser);
router.patch('/deactivateChild/:childId', 
  restrictTo('PARENT'),
  validateObjectId('childId'),
  handleValidationErrors,
  checkParentChildRelation,
  deactivateChild
);

// Child-only routes
router.post('/joinFamily', restrictTo('CHILD'), joinFamily);

export default router;