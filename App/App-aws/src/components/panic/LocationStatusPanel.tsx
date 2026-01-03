import React from 'react';
import { 
  MapPinIcon, 
  SignalIcon, 
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface LocationStatusPanelProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
}

const LocationStatusPanel: React.FC<LocationStatusPanelProps> = ({
  latitude,
  longitude,
  accuracy,
  isLoading,
  error
}) => {
  const getAccuracyStatus = (acc: number | null) => {
    if (!acc) return { text: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-100' };
    if (acc < 10) return { text: 'Excellent', color: 'text-success', bg: 'bg-success/10' };
    if (acc < 30) return { text: 'Good', color: 'text-primary', bg: 'bg-primary/10' };
    if (acc < 100) return { text: 'Fair', color: 'text-warning', bg: 'bg-warning/10' };
    return { text: 'Poor', color: 'text-error', bg: 'bg-error/10' };
  };

  const accuracyStatus = getAccuracyStatus(accuracy);

  if (error) {
    return (
      <div className="bg-error/10 border border-error/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <ExclamationCircleIcon className="h-6 w-6 text-error flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-bodyFont font-semibold text-error mb-1">Location Error</h3>
            <p className="text-sm font-bodyFont text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <MapPinIcon className="h-6 w-6 text-primary animate-pulse" />
          <div className="flex-1">
            <h3 className="text-base font-bodyFont font-semibold text-primary mb-1">Finding Location...</h3>
            <p className="text-sm font-bodyFont text-gray-600">Acquiring GPS coordinates</p>
          </div>
        </div>
      </div>
    );
  }

  if (latitude !== null && longitude !== null) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircleIcon className="h-6 w-6 text-success" />
          <h3 className="text-base font-bodyFont font-semibold text-gray-900">Location Ready</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPinIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-bodyFont font-medium text-gray-600 uppercase">GPS</span>
            </div>
            <div className="font-mono text-xs text-gray-900">
              {latitude?.toFixed(4)}°, {longitude?.toFixed(4)}°
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <SignalIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-bodyFont font-medium text-gray-600 uppercase">Accuracy</span>
            </div>
            <span className={`text-xs font-bodyFont font-semibold ${accuracyStatus.color}`}>
              {accuracyStatus.text} {accuracy && `(±${accuracy.toFixed(0)}m)`}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ClockIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-bodyFont font-medium text-gray-600 uppercase">Time</span>
            </div>
            <div className="text-xs font-bodyFont text-gray-900">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <MapPinIcon className="h-6 w-6 text-gray-400" />
        <div>
          <h3 className="text-base font-bodyFont font-semibold text-gray-700">Waiting for GPS...</h3>
          <p className="text-sm font-bodyFont text-gray-600">Location not available</p>
        </div>
      </div>
    </div>
  );
};

export default LocationStatusPanel;
