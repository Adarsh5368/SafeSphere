import React, { useState } from 'react';
import { cn } from '../../utils/helpers';

interface ChildUser {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ChildLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  user: ChildUser;
}

interface MapMarkerProps {
  child: ChildUser;
  location: ChildLocation;
  isSelected: boolean;
  isOnline: boolean;
  geofenceStatus: 'safe' | 'breached' | 'unknown';
  onClick: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({
  child,
  location,
  isSelected,
  isOnline,
  geofenceStatus,
  onClick
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format last updated time
  const formatLastUpdated = () => {
    const now = new Date();
    const lastUpdate = new Date(location.timestamp);
    const diffInMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  // Get marker colors based on status
  const getMarkerColors = () => {
    if (geofenceStatus === 'breached') {
      return {
        bg: 'bg-red-500',
        ring: 'ring-red-400',
        pulse: 'bg-red-400'
      };
    }
    
    if (isOnline) {
      return {
        bg: 'bg-green-500',
        ring: 'ring-green-400',
        pulse: 'bg-green-400'
      };
    }
    
    return {
      bg: 'bg-gray-400',
      ring: 'ring-gray-300',
      pulse: 'bg-gray-300'
    };
  };

  // Get status text
  const getStatusText = () => {
    if (geofenceStatus === 'breached') return 'ALERT';
    return isOnline ? 'LIVE' : 'OFFLINE';
  };

  // Get status color
  const getStatusColor = () => {
    if (geofenceStatus === 'breached') return 'text-red-600 bg-red-50';
    return isOnline ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';
  };

  const colors = getMarkerColors();

  return (
    <div 
      className="relative cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      {/* Pulsing Ring for Online Status */}
      {isOnline && (
        <div className={cn(
          "absolute inset-0 rounded-full animate-ping",
          colors.pulse
        )} style={{
          width: '32px',
          height: '32px',
          top: '-8px',
          left: '-8px'
        }} />
      )}

      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full ring-4 ring-blue-400 ring-opacity-60" style={{
          width: '40px',
          height: '40px',
          top: '-12px',
          left: '-12px'
        }} />
      )}

      {/* Main Marker */}
      <div className={cn(
        "w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all transform hover:scale-110",
        colors.bg,
        isSelected && "scale-125"
      )}>
        {/* Child Initial */}
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">
            {child.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Marker Stem */}
      <div className={cn(
        "absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0",
        "border-l-2 border-r-2 border-t-4 border-transparent",
        colors.bg.replace('bg-', 'border-t-')
      )} />

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            
            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{child.name}</h4>
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  getStatusColor()
                )}>
                  {getStatusText()}
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Last updated:</span>
                  <span className="font-medium">{formatLastUpdated()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="font-mono">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                </div>
                
                {location.accuracy && (
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">±{Math.round(location.accuracy)}m</span>
                  </div>
                )}

                {geofenceStatus === 'breached' && (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-red-700 font-medium">Geofence Alert</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapMarker;