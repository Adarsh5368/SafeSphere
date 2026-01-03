import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import locationRoutes from './locationRoutes.js';
import geofenceRoutes from './geofenceRoutes.js';
import alertRoutes from './alertRoutes.js';
import simulatorRoutes from './simulatorRoutes.js';
import config from '../config/config.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareNest API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/geofences', geofenceRoutes);
router.use('/alerts', alertRoutes);
router.use('/simulator', simulatorRoutes);

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CareNest API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/signup': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/me': 'Get current user',
        'PATCH /api/auth/updateMe': 'Update current user',
        'PATCH /api/auth/updateMyPassword': 'Update password',
        'POST /api/auth/createChild': 'Create child user (parent only)',
        'PATCH /api/auth/deactivateChild/:childId': 'Deactivate child (parent only)',
        'POST /api/auth/joinFamily': 'Join family (child only)'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PATCH /api/users/profile': 'Update user profile',
        'GET /api/users/dashboard': 'Get dashboard data',
        'GET /api/users/family': 'Get family members',
        'PATCH /api/users/trustedContacts': 'Update trusted contacts (parent only)',
        'GET /api/users/search': 'Search users',
        'GET /api/users/activity/:userId': 'Get user activity summary'
      },
      locations: {
        'POST /api/locations': 'Record location (child only)',
        'POST /api/locations/children': 'Get children locations (parent only)',
        'GET /api/locations/history/:userId': 'Get location history',
        'GET /api/locations/current/:userId': 'Get current location'
      },
      geofences: {
        'POST /api/geofences': 'Create geofence (parent only)',
        'GET /api/geofences': 'Get geofences (parent only)',
        'GET /api/geofences/:geofenceId': 'Get geofence details',
        'PATCH /api/geofences/:geofenceId': 'Update geofence (parent only)',
        'DELETE /api/geofences/:geofenceId': 'Delete geofence (parent only)',
        'GET /api/geofences/states/:childId': 'Get geofence states (parent only)',
        'GET /api/geofences/child/:childId': 'Get child geofences'
      },
      alerts: {
        'POST /api/alerts/panic': 'Trigger panic alert (child only)',
        'GET /api/alerts': 'Get alerts (parent only)',
        'GET /api/alerts/recent': 'Get recent alerts (parent only)',
        'GET /api/alerts/stats': 'Get alert statistics (parent only)',
        'PATCH /api/alerts/markAsRead': 'Mark multiple alerts as read (parent only)',
        'PATCH /api/alerts/markAllAsRead': 'Mark all alerts as read (parent only)',
        'GET /api/alerts/:alertId': 'Get alert details',
        'PATCH /api/alerts/:alertId': 'Mark alert as read (parent only)',
        'DELETE /api/alerts/:alertId': 'Delete alert (parent only)'
      }
    }
  });
});

// 404 handler for API routes
router.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

export default router;