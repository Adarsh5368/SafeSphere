import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  StopIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';
import { Button } from '../ui';

interface Scenario {
  id: string;
  name: string;
  description: string;
  steps: number;
  duration: number;
  estimatedTime: string;
  features: {
    hasGeofenceAlert: boolean;
    hasPanicAlert: boolean;
  };
}

interface SimulatorStatus {
  isRunning: boolean;
  currentScenario: string | null;
  currentStep: number;
  totalSteps: number;
  progress: string;
  childId: string | null;
}

const SimulatorControl: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('emergency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadScenarios();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadScenarios = async () => {
    try {
      const response = await api.get('/simulator/scenarios');
      setScenarios(response.data.data.scenarios);
    } catch (err: unknown) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await api.get('/simulator/status');
      setStatus(response.data.data.simulator);
      setIsRunning(response.data.data.simulator.isRunning);
    } catch (err: unknown) {
      console.error('Failed to check status:', err);
    }
  };

  const startQuickDemo = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await api.post('/simulator/quick-demo', {
        scenarioName: selectedScenario
      });
      
      setSuccessMessage(`Demo started: ${response.data.data.scenario.name}`);
      await checkStatus();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start demo');
    } finally {
      setLoading(false);
    }
  };

  const stopSimulator = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await api.post('/simulator/stop');
      setSuccessMessage('Simulator stopped successfully');
      await checkStatus();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to stop simulator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-lg p-6 border border-border-default">
      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Scenario</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs font-medium text-gray-600">
            {isRunning ? 'Running' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Status Display */}
      {status && isRunning && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-primary">{status.currentScenario}</p>
            <span className="text-xs text-primary">{status.progress}</span>
          </div>
          <div className="w-full bg-accent/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${(status.currentStep / status.totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Scenario Selection */}
      {!isRunning && (
        <>
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedScenario === scenario.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border-default hover:border-primary/30 bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium text-sm ${
                          selectedScenario === scenario.id ? 'text-primary' : 'text-gray-900'
                        }`}>
                          {scenario.name}
                        </h4>
                        {selectedScenario === scenario.id && (
                          <CheckCircleIcon className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{scenario.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          {scenario.estimatedTime}
                        </span>
                        {scenario.features.hasGeofenceAlert && (
                          <span className="text-xs text-secondary">Geofence</span>
                        )}
                        {scenario.features.hasPanicAlert && (
                          <span className="text-xs text-error">Panic</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={startQuickDemo}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-on-primary py-2.5 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Start Simulation
              </>
            )}
          </Button>
        </>
      )}

      {/* Stop Button */}
      {isRunning && (
        <>
          <Button
            onClick={stopSimulator}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Stopping...
              </>
            ) : (
              <>
                <StopIcon className="h-4 w-4" />
                Stop Simulation
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default SimulatorControl;
