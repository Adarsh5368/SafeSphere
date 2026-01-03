import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  MapPinIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatDate';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Alert {
  _id: string;
  type: 'PANIC' | 'GEOFENCE_ENTRY' | 'GEOFENCE_EXIT' | 'LOW_BATTERY' | 'LOCATION_LOST';
  message: string;
  timestamp: string;
  isRead: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  geofence?: {
    _id: string;
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AlertDetailsProps {
  alert: Alert | null;
  onMarkAsRead?: (alertId: string) => void;
  onClose?: () => void;
}

const AlertDetails: React.FC<AlertDetailsProps> = ({ 
  alert, 
  onMarkAsRead,
  onClose
}) => {
  const [marking, setMarking] = useState(false);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Initialize Leaflet map when alert has location
  useEffect(() => {
    if (!alert?.location || !mapRef.current) return;

    const { latitude, longitude } = alert.location;

    // Create map
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create custom icon based on alert type
    const markerColor = alert.type === 'PANIC' ? '#ef4444' : '#3b82f6';
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px;
        height: 24px;
        background-color: ${markerColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add marker
    L.marker([latitude, longitude], { icon: markerIcon })
      .addTo(map)
      .bindPopup(alert.user.name);

    // Add circle for geofence if present
    if (alert.geofence) {
      const circleColor = alert.type === 'GEOFENCE_EXIT' ? '#f59e0b' : '#3b82f6';
      L.circle([latitude, longitude], {
        radius: 100,
        fillColor: circleColor,
        fillOpacity: 0.15,
        color: circleColor,
        weight: 2,
        opacity: 0.6,
      }).addTo(map);
    }

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [alert]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'PANIC':
        return <ExclamationTriangleIcon className="h-8 w-8 text-error" />;
      case 'GEOFENCE_ENTRY':
        return <ArrowRightOnRectangleIcon className="h-8 w-8 text-primary" />;
      case 'GEOFENCE_EXIT':
        return <ArrowLeftOnRectangleIcon className="h-8 w-8 text-warning" />;
      default:
        return <MapPinIcon className="h-8 w-8 text-muted" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'PANIC':
        return { bg: 'bg-error/10', border: 'border-error/30', text: 'text-error', badge: 'bg-error/20' };
      case 'GEOFENCE_ENTRY':
        return { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', badge: 'bg-primary/20' };
      case 'GEOFENCE_EXIT':
        return { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', badge: 'bg-warning/20' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-200' };
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'PANIC':
        return 'Emergency Alert';
      case 'GEOFENCE_ENTRY':
        return 'Entered Safe Zone';
      case 'GEOFENCE_EXIT':
        return 'Exited Safe Zone';
      case 'LOW_BATTERY':
        return 'Low Battery Warning';
      case 'LOCATION_LOST':
        return 'Location Lost';
      default:
        return type;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(timestamp);
  };

  const handleMarkAsRead = async () => {
    if (!alert || alert.isRead || !onMarkAsRead) return;
    
    setMarking(true);
    try {
      await onMarkAsRead(alert._id);
    } finally {
      setMarking(false);
    }
  };

  if (!alert) return null;

  const colors = getAlertColor(alert.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`border-b border-border-default p-5 ${colors.bg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`flex-shrink-0 p-2.5 bg-white rounded-xl shadow-sm`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-themeFont font-bold text-gray-900 mb-1">
                  {getAlertTypeLabel(alert.type)}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm font-bodyFont text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">{alert.user.name}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1.5 text-sm font-bodyFont text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{getRelativeTime(alert.timestamp)}</span>
                  </div>
                  {!alert.isRead && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center gap-1 text-xs font-bodyFont text-primary font-semibold">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute h-2 w-2 rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Unread
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-xl transition-colors flex-shrink-0"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Message */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm font-bodyFont text-gray-900 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {/* Geofence Info */}
          {alert.geofence && (
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 rounded-xl border border-primary/20">
              <MapPinIcon className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-bodyFont text-gray-500">Safe Zone</p>
                <p className="text-sm font-bodyFont font-semibold text-gray-900">
                  {alert.geofence.name}
                </p>
              </div>
            </div>
          )}

          {/* Location Map */}
          {alert.location && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bodyFont font-semibold text-gray-700">Location</h3>
                <p className="text-xs font-mono text-gray-500">
                  {alert.location.latitude.toFixed(5)}, {alert.location.longitude.toFixed(5)}
                </p>
              </div>
              <div 
                ref={mapRef}
                className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border-default p-5 bg-gray-50">
          <div className="flex gap-3">
            {!alert.isRead && onMarkAsRead ? (
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-bodyFont font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                {marking ? 'Marking...' : 'Mark as Read'}
              </button>
            ) : (
              <div className="flex-1 px-4 py-2.5 bg-success/10 text-success rounded-xl font-bodyFont font-medium text-center border border-success/30 flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                Already Read
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bodyFont font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetails;
