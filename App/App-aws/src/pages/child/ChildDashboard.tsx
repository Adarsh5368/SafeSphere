import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

const ChildDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locationSharing, setLocationSharing] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [geofenceCount, setGeofenceCount] = useState<number>(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentLocationRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const { latitude, longitude, accuracy, getCurrentPosition } = useGeolocation();

  // Fetch battery level
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        // Check if Battery Status API is supported
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          const updateBatteryLevel = () => {
            setBatteryLevel(Math.round(battery.level * 100));
          };
          
          // Set initial level
          updateBatteryLevel();
          
          // Listen for changes
          battery.addEventListener('levelchange', updateBatteryLevel);
          
          return () => {
            battery.removeEventListener('levelchange', updateBatteryLevel);
          };
        } else {
          // Fallback: Battery API not supported
          setBatteryLevel(null);
        }
      } catch (err) {
        console.error('Failed to get battery info:', err);
        setBatteryLevel(null);
      }
    };
    
    getBatteryInfo();
  }, []);

  // Fetch geofence count
  useEffect(() => {
    const fetchGeofences = async () => {
      if (!user?._id) {
        console.error('No user ID available');
        setGeofenceCount(0);
        return;
      }
      
      try {
        const response = await api.get(API_ENDPOINTS.CHILD_GEOFENCES(user._id));
        setGeofenceCount(response.data.results || 0);
      } catch (err) {
        console.error('Failed to fetch geofences:', err);
        setGeofenceCount(0);
      }
    };
    
    fetchGeofences();
  }, [user]);

  // Calculate distance between two coordinates (in meters)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Check if location should be sent based on time and distance
  const shouldSendLocation = useCallback((lat: number, lon: number): boolean => {
    const now = Date.now();
    const MIN_TIME_INTERVAL = 15000; // 15 seconds
    const MIN_DISTANCE = 10; // 10 meters

    // If no previous location, send it
    if (!lastSentLocationRef.current) {
      return true;
    }

    const timeDiff = now - lastSentLocationRef.current.timestamp;
    
    // Always send if 15 seconds have passed
    if (timeDiff >= MIN_TIME_INTERVAL) {
      return true;
    }

    // Check if moved significantly (at least 10 meters)
    const distance = calculateDistance(
      lastSentLocationRef.current.lat,
      lastSentLocationRef.current.lon,
      lat,
      lon
    );

    // Send if moved more than 10 meters, but respect minimum 5 second interval
    if (distance >= MIN_DISTANCE && timeDiff >= 5000) {
      return true;
    }

    return false;
  }, [calculateDistance]);

  // Start/stop location sharing with smart throttling
  useEffect(() => {
    let isSending = false;
    
    const sendLocationToServer = async () => {
      if (!locationSharing || isSending) {
        return;
      }

      if (!latitude || !longitude) {
        console.log('No location available yet');
        return;
      }

      // Check if we should send based on time and distance
      if (!shouldSendLocation(latitude, longitude)) {
        console.log('Location update throttled (not enough time/distance)');
        return;
      }

      isSending = true;
      
      try {
        console.log('Sending location to server:', { latitude, longitude, accuracy });
        const response = await api.post(API_ENDPOINTS.LOCATIONS, {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        });
        console.log('Location sent successfully:', response.data);
        
        // Update last sent location
        lastSentLocationRef.current = {
          lat: latitude,
          lon: longitude,
          timestamp: Date.now()
        };
        
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        console.error('Failed to send location:', err);
        setError('Failed to update location');
      } finally {
        isSending = false;
      }
    };

    if (locationSharing && latitude && longitude) {
      // Check if we should send location
      sendLocationToServer();
      
      // Set up interval to check location every 5 seconds
      // (actual sending will be throttled by shouldSendLocation)
      locationIntervalRef.current = setInterval(() => {
        getCurrentPosition(); // Refresh location
        sendLocationToServer();
      }, 5000); // Check every 5 seconds
    } else {
      // Clear interval when sharing is disabled
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [locationSharing, latitude, longitude, accuracy, getCurrentPosition, shouldSendLocation]);

  // Toggle location sharing
  const handleToggleLocationSharing = () => {
    setLocationSharing(!locationSharing);
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)} hr ago`;
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-surface border-b border-border-default px-6 py-4">
          <h1 className="text-2xl font-themeFont font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm font-bodyFont text-muted mt-1">
            Stay safe and connected with your family
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Last Location Update */}
              <div className="bg-surface rounded-xl border border-border-default p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bodyFont text-muted mb-1">Last Update</p>
                    <p className="text-lg font-themeFont font-bold text-gray-900">{formatLastUpdate()}</p>
                  </div>
                </div>
              </div>

              {/* Battery Status */}
              <div className="bg-surface rounded-xl border border-border-default p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    batteryLevel === null ? 'bg-gray-200' :
                    batteryLevel > 50 ? 'bg-success/10' :
                    batteryLevel > 20 ? 'bg-warning/10' : 'bg-error/10'
                  }`}>
                    <svg className={`h-5 w-5 ${
                      batteryLevel === null ? 'text-gray-400' :
                      batteryLevel > 50 ? 'text-success' :
                      batteryLevel > 20 ? 'text-warning' : 'text-error'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bodyFont text-muted mb-1">Battery</p>
                    <p className="text-lg font-themeFont font-bold text-gray-900">
                      {batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Geofences */}
              <div className="bg-surface rounded-xl border border-border-default p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bodyFont text-muted mb-1">Safe Zones</p>
                    <p className="text-lg font-themeFont font-bold text-gray-900">
                      {geofenceCount} Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency SOS */}
              <button
                onClick={() => navigate('/child/panic')}
                className="bg-error/10 hover:bg-error/20 border border-error/30 rounded-xl p-6 text-left transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-error rounded-xl flex items-center justify-center">
                    <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-themeFont font-bold text-gray-900 mb-1">Emergency SOS</h3>
                    <p className="text-sm font-bodyFont text-muted">Send immediate alert to parents</p>
                  </div>
                </div>
              </button>

              {/* Location Sharing Toggle */}
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-themeFont font-bold text-gray-900 mb-1">Location Sharing</h3>
                      <p className="text-sm font-bodyFont text-muted">Share location with family</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleToggleLocationSharing}
                  className={`w-full px-4 py-3 rounded-lg font-bodyFont font-medium transition-colors ${
                    locationSharing
                      ? 'bg-success text-white hover:bg-success/90'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${locationSharing ? 'bg-white' : 'bg-gray-500'}`}></div>
                    {locationSharing ? 'ON' : 'OFF'}
                  </div>
                </button>
                {error && (
                  <p className="text-xs font-bodyFont text-error mt-2 text-center">{error}</p>
                )}
              </div>
            </div>

            {/* Safety Tips Section */}
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-themeFont font-bold text-gray-900 mb-3">Safety Tips</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bodyFont text-gray-700">Stay within your safe zones</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bodyFont text-gray-700">Keep your GPS enabled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bodyFont text-gray-700">Tap SOS in emergencies</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChildDashboard;