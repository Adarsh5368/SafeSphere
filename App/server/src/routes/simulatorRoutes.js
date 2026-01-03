import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  startSimulator,
  stopSimulator,
  getSimulatorStatus,
  getAvailableScenarios,
  quickDemo
} from '../controllers/simulatorController.js';

const router = express.Router();

// All simulator routes require authentication and parent role
router.use(protect);
router.use(restrictTo('PARENT'));

// Simulator control routes
router.post('/start', startSimulator);
router.post('/stop', stopSimulator);
router.post('/quick-demo', quickDemo);
router.get('/status', getSimulatorStatus);
router.get('/scenarios', getAvailableScenarios);

export default router;
