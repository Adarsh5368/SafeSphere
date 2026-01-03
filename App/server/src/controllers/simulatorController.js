import User from '../models/User.js';
import Location from '../models/Location.js';
import Alert from '../models/Alert.js';
import Geofence from '../models/Geofence.js';
import notificationService from '../services/emailService.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

// Simulator state management
const simulatorState = {
  isRunning: false,
  currentScenario: null,
  demoChildId: null,
  currentStep: 0,
  locationHistory: [],
  timeoutId: null
};

// Demo scenarios with Bangalore coordinates
const demoScenarios = {
  normalDay: {
    name: 'Normal Day at Home',
    description: 'Child stays within safe zone, normal activities',
    duration: 30000,
    steps: [
      { lat: 12.9716, lng: 77.5946, address: 'Home - Living Room', wait: 5000 },
      { lat: 12.9717, lng: 77.5947, address: 'Home - Kitchen', wait: 5000 },
      { lat: 12.9716, lng: 77.5946, address: 'Home - Bedroom', wait: 5000 },
      { lat: 12.9715, lng: 77.5945, address: 'Home - Garden', wait: 5000 }
    ]
  },
  
  leavingSafeZone: {
    name: 'Leaving Safe Zone',
    description: 'Child gradually moves outside geofence boundary',
    duration: 50000,
    steps: [
      { lat: 12.9716, lng: 77.5946, address: 'Home - Starting Point', wait: 4000 },
      { lat: 12.9720, lng: 77.5950, address: 'Near Home Gate', wait: 4000 },
      { lat: 12.9725, lng: 77.5955, address: 'Walking on Street', wait: 4000 },
      { lat: 12.9735, lng: 77.5965, address: 'Outside Safe Zone', wait: 5000, triggerGeofence: true },
      { lat: 12.9740, lng: 77.5970, address: 'Park - 800m from home', wait: 5000 },
      { lat: 12.9735, lng: 77.5965, address: 'Walking back', wait: 4000 },
      { lat: 12.9720, lng: 77.5950, address: 'Near home', wait: 4000 },
      { lat: 12.9716, lng: 77.5946, address: 'Back home safely', wait: 4000, triggerGeofenceEntry: true }
    ]
  },
  
  emergency: {
    name: 'Emergency Alert',
    description: 'Child triggers panic button',
    duration: 25000,
    steps: [
      { lat: 12.9716, lng: 77.5946, address: 'Home - Normal activity', wait: 6000 },
      { lat: 12.9716, lng: 77.5946, address: 'Home - Feeling unwell', wait: 5000, triggerPanic: true },
      { lat: 12.9716, lng: 77.5946, address: 'Home - Help requested', wait: 8000 }
    ]
  },
  
  marketTrip: {
    name: 'Trip to Market',
    description: 'Planned trip outside safe zone',
    duration: 70000,
    steps: [
      { lat: 12.9716, lng: 77.5946, address: 'Home', wait: 4000 },
      { lat: 12.9720, lng: 77.5950, address: 'Walking to bus stop', wait: 4000 },
      { lat: 12.9750, lng: 77.5980, address: 'Bus Stop', wait: 6000, triggerGeofence: true },
      { lat: 12.9800, lng: 77.6050, address: 'Market Street', wait: 6000 },
      { lat: 12.9805, lng: 77.6055, address: 'Grocery Store', wait: 10000 },
      { lat: 12.9800, lng: 77.6050, address: 'Leaving market', wait: 4000 },
      { lat: 12.9750, lng: 77.5980, address: 'Bus stop return', wait: 6000 },
      { lat: 12.9720, lng: 77.5950, address: 'Near home', wait: 4000 },
      { lat: 12.9716, lng: 77.5946, address: 'Home - Safe return', wait: 4000, triggerGeofenceEntry: true }
    ]
  },
  
  wandering: {
    name: 'Wandering Pattern',
    description: 'Child appears confused, moving erratically',
    duration: 55000,
    steps: [
      { lat: 12.9716, lng: 77.5946, address: 'Home', wait: 4000 },
      { lat: 12.9720, lng: 77.5950, address: 'Left home', wait: 3000, triggerGeofence: true },
      { lat: 12.9718, lng: 77.5952, address: 'Wandering - unclear direction', wait: 3000 },
      { lat: 12.9722, lng: 77.5948, address: 'Wandering - changed direction', wait: 3000 },
      { lat: 12.9719, lng: 77.5955, address: 'Wandering - appears lost', wait: 4000 },
      { lat: 12.9725, lng: 77.5960, address: 'Still wandering', wait: 4000 },
      { lat: 12.9723, lng: 77.5958, address: 'Circling around', wait: 4000 },
      { lat: 12.9730, lng: 77.5965, address: 'Far from home', wait: 6000, triggerPanic: true }
    ]
  }
};

// Quick demo - Creates demo child and starts simulation
export const quickDemo = catchAsync(async (req, res, next) => {
  const { scenarioName = 'emergency' } = req.body;
  const parentId = req.user._id;

  if (simulatorState.isRunning) {
    return next(new AppError('Simulator is already running. Stop it first.', 400));
  }

  // Get scenario
  const scenario = demoScenarios[scenarioName];
  if (!scenario) {
    return next(new AppError('Invalid scenario', 400));
  }

  try {
    // Find or create demo child
    let demoChild = await User.findOne({ 
      email: `demo.child.${parentId}@carenest.com`,
      parentId: parentId
    });

    if (!demoChild) {
      // Create demo child
      const hashedPassword = await bcrypt.hash('Demo@123', 12);
      demoChild = await User.create({
        name: 'Demo Child',
        email: `demo.child.${parentId}@carenest.com`,
        password: hashedPassword,
        userType: 'CHILD',
        parentId: parentId,
        phone: '+919876543210',
        age: 12,
        isActive: true
      });

      // Add demo child to parent's childIds
      await User.findByIdAndUpdate(parentId, {
        $addToSet: { childIds: demoChild._id }
      });

      // Create a demo geofence around "home"
      await Geofence.create({
        parentId: parentId,
        childId: demoChild._id,
        name: 'Home Safe Zone',
        centerLat: 12.9716,
        centerLon: 77.5946,
        radius: 500, // 500 meters
        isActive: true,
        notifyOnEntry: true,
        notifyOnExit: true
      });
    }

    // Always ensure trusted contacts are set with correct phone numbers
    const parent = await User.findById(parentId);
    await User.findByIdAndUpdate(parentId, {
      trustedContacts: [
        { name: 'Brother', phone: '+919650326704', email: 'brother@example.com' },
        { name: 'Sister', phone: '+917011328468', email: 'sister@example.com' }
      ]
    });

    // Update demo child to be active and online
    await User.findByIdAndUpdate(demoChild._id, {
      lastLogin: new Date(),
      isActive: true
    });

    // Initialize simulator state
    simulatorState.isRunning = true;
    simulatorState.currentScenario = scenario;
    simulatorState.demoChildId = demoChild._id;
    simulatorState.currentStep = 0;
    simulatorState.locationHistory = [];

    // Start simulation
    runSimulation(demoChild, parentId, req.app);

    res.status(200).json({
      status: 'success',
      message: 'Quick demo started successfully',
      data: {
        demoChild: {
          id: demoChild._id,
          name: demoChild.name,
          email: demoChild.email
        },
        scenario: {
          name: scenario.name,
          description: scenario.description,
          steps: scenario.steps.length,
          estimatedDuration: `${Math.round(scenario.duration / 1000)}s`
        }
      }
    });
  } catch (error) {
    simulatorState.isRunning = false;
    return next(new AppError('Failed to start quick demo', 500));
  }
});

// Start simulator with existing child
export const startSimulator = catchAsync(async (req, res, next) => {
  const { childId, scenarioName } = req.body;

  if (simulatorState.isRunning) {
    return next(new AppError('Simulator is already running. Stop it first.', 400));
  }

  // Verify child exists and belongs to parent
  const child = await User.findById(childId);
  if (!child || child.userType !== 'CHILD') {
    return next(new AppError('Child not found', 404));
  }

  if (child.parentId.toString() !== req.user._id.toString()) {
    return next(new AppError('This child does not belong to you', 403));
  }

  // Get scenario
  const scenario = demoScenarios[scenarioName];
  if (!scenario) {
    return next(new AppError('Invalid scenario', 400));
  }

  // Initialize simulator state
  simulatorState.isRunning = true;
  simulatorState.currentScenario = scenario;
  simulatorState.demoChildId = child._id;
  simulatorState.currentStep = 0;
  simulatorState.locationHistory = [];

  // Start simulation
  runSimulation(child, req.user._id, req.app);

  res.status(200).json({
    status: 'success',
    message: `Simulator started: ${scenario.name}`,
    data: {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        steps: scenario.steps.length,
        estimatedDuration: `${Math.round(scenario.duration / 1000)}s`
      }
    }
  });
});

// Run simulation
async function runSimulation(child, parentId, app) {
  const scenario = simulatorState.currentScenario;
  const steps = scenario.steps;

  async function executeStep(stepIndex) {
    if (!simulatorState.isRunning || stepIndex >= steps.length) {
      simulatorState.isRunning = false;
      simulatorState.currentScenario = null;
      
      // Broadcast completion via WebSocket
      const io = app.get('io');
      if (io) {
        io.to(`user:${parentId}`).emit('simulator-completed', {
          message: 'Simulation completed',
          timestamp: new Date()
        });
      }
      return;
    }

    const step = steps[stepIndex];
    simulatorState.currentStep = stepIndex + 1;

    try {
      // Update demo child to appear online
      await User.findByIdAndUpdate(simulatorState.demoChildId, {
        lastLogin: new Date(),
        isActive: true
      });

      // Create location update
      const location = await Location.create({
        userId: simulatorState.demoChildId,
        latitude: step.lat,
        longitude: step.lng,
        accuracy: 10,
        speed: stepIndex > 0 ? 1.5 : 0,
        timestamp: new Date()
      });

      simulatorState.locationHistory.push(location);

      // Broadcast location update via WebSocket
      const io = app.get('io');
      if (io) {
        io.to(`user:${parentId}`).emit('location-update', {
          userId: child._id,
          userName: child.name,
          latitude: step.lat,
          longitude: step.lng,
          address: step.address,
          timestamp: new Date()
        });

        io.to(`user:${parentId}`).emit('simulator-progress', {
          currentStep: stepIndex + 1,
          totalSteps: steps.length,
          address: step.address
        });
      }

      // Trigger geofence exit alert if specified
      if (step.triggerGeofence) {
        await triggerGeofenceAlert(child, parentId, location, 'exit', app);
      }

      // Trigger geofence entry alert if specified
      if (step.triggerGeofenceEntry) {
        await triggerGeofenceAlert(child, parentId, location, 'entry', app);
      }

      // Trigger panic alert if specified
      if (step.triggerPanic) {
        await triggerPanicAlert(child, parentId, location, app);
      }

      // Schedule next step
      simulatorState.timeoutId = setTimeout(() => executeStep(stepIndex + 1), step.wait);

    } catch (error) {
      simulatorState.isRunning = false;
      simulatorState.currentScenario = null;
    }
  }

  // Start first step
  executeStep(0);
}

// Helper: Trigger geofence alert
async function triggerGeofenceAlert(child, parentId, location, type, app) {
  try {
    // Find the home geofence
    const geofence = await Geofence.findOne({
      parentId: parentId,
      childId: child._id,
      isActive: true
    });

    if (!geofence) {
      return;
    }

    const alertType = type === 'exit' ? 'GEOFENCE_EXIT' : 'GEOFENCE_ENTRY';
    const message = type === 'exit' 
      ? `${child.name} left ${geofence.name}`
      : `${child.name} entered ${geofence.name}`;

    // Create alert
    const alert = await Alert.create({
      userId: child._id,
      parentId: parentId,
      type: alertType,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      geofenceId: geofence._id,
      geofenceName: geofence.name,
      message: message,
      timestamp: new Date()
    });

    await alert.populate('userId', 'name email');

    // Broadcast via WebSocket
    const io = app.get('io');
    if (io) {
      io.to(`user:${parentId}`).emit('alert-received', {
        _id: alert._id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        userId: child._id,
        userName: child.name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    }

    // Send notifications
    const parent = await User.findById(parentId);
    if (parent && parent.trustedContacts) {
      for (const contact of parent.trustedContacts) {
        if (contact.phone) {
          try {
            await notificationService.sendSMS(
              contact.phone,
              `Safe Sphere: ${child.name} has ${type === 'exit' ? 'left' : 'entered'} ${geofence.name}. Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}. Time: ${new Date().toLocaleString()}`
            );
          } catch (error) {
            // SMS sending failed silently
          }
        }
      }
    }

    alert.notificationSent = true;
    await alert.save();

  } catch (error) {
    // Error handling
  }
}

// Helper: Trigger panic alert
async function triggerPanicAlert(child, parentId, location, app) {
  try {
    // Create panic alert
    const alert = await Alert.create({
      userId: child._id,
      parentId: parentId,
      type: 'PANIC',
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      message: `EMERGENCY! ${child.name} triggered a panic alert!`,
      timestamp: new Date()
    });

    await alert.populate('userId', 'name email');

    // Broadcast via WebSocket
    const io = app.get('io');
    if (io) {
      io.to(`user:${parentId}`).emit('alert-received', {
        _id: alert._id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        userId: child._id,
        userName: child.name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });
    }

    // Send SMS to trusted contacts
    const parent = await User.findById(parentId);
    if (parent && parent.trustedContacts) {
      const smsMessage = `URGENT ALERT - Safe Sphere
${child.name} has triggered an emergency alert and may need immediate assistance.

Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Time: ${new Date().toLocaleString()}

Please check on ${child.name} as soon as possible. If you cannot reach them, consider contacting local authorities.`;

      for (const contact of parent.trustedContacts) {
        if (contact.phone) {
          try {
            await notificationService.sendSMS(contact.phone, smsMessage);
          } catch (error) {
            // SMS sending failed silently
          }
        }
      }
    }

    alert.notificationSent = true;
    await alert.save();

  } catch (error) {
    // Error handling
  }
}

// Stop simulator
export const stopSimulator = catchAsync(async (req, res, next) => {
  if (!simulatorState.isRunning) {
    return next(new AppError('Simulator is not running', 400));
  }

  // Clear timeout
  if (simulatorState.timeoutId) {
    clearTimeout(simulatorState.timeoutId);
  }

  const summary = {
    scenario: simulatorState.currentScenario?.name,
    stepsCompleted: simulatorState.currentStep,
    totalSteps: simulatorState.currentScenario?.steps.length,
    locationsCreated: simulatorState.locationHistory.length
  };

  // Reset state
  simulatorState.isRunning = false;
  simulatorState.currentScenario = null;
  simulatorState.demoChildId = null;
  simulatorState.currentStep = 0;
  simulatorState.locationHistory = [];
  simulatorState.timeoutId = null;

  res.status(200).json({
    status: 'success',
    message: 'Simulator stopped',
    data: { summary }
  });
});

// Get simulator status
export const getSimulatorStatus = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      simulator: {
        isRunning: simulatorState.isRunning,
        currentScenario: simulatorState.currentScenario?.name || null,
        currentStep: simulatorState.currentStep,
        totalSteps: simulatorState.currentScenario?.steps.length || 0,
        progress: simulatorState.currentScenario 
          ? `${simulatorState.currentStep}/${simulatorState.currentScenario.steps.length}`
          : 'Not running',
        childId: simulatorState.demoChildId
      }
    }
  });
});

// Get available scenarios
export const getAvailableScenarios = catchAsync(async (req, res, next) => {
  const scenarios = Object.entries(demoScenarios).map(([key, scenario]) => ({
    id: key,
    name: scenario.name,
    description: scenario.description,
    steps: scenario.steps.length,
    duration: scenario.duration,
    estimatedTime: `${Math.round(scenario.duration / 1000)}s`,
    features: {
      hasGeofenceAlert: scenario.steps.some(s => s.triggerGeofence || s.triggerGeofenceEntry),
      hasPanicAlert: scenario.steps.some(s => s.triggerPanic)
    }
  }));

  res.status(200).json({
    status: 'success',
    data: { scenarios }
  });
});
