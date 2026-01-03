import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatDate';

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

interface AlertListItemProps {
  alert: Alert;
  isSelected: boolean;
  onClick: () => void;
}

const AlertListItem: React.FC<AlertListItemProps> = ({ alert, isSelected, onClick }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'PANIC':
        return <ExclamationTriangleIcon className="h-6 w-6 text-error" />;
      case 'GEOFENCE_ENTRY':
        return <ArrowRightOnRectangleIcon className="h-6 w-6 text-primary" />;
      case 'GEOFENCE_EXIT':
        return <ArrowLeftOnRectangleIcon className="h-6 w-6 text-warning" />;
      default:
        return <MapPinIcon className="h-6 w-6 text-muted" />;
    }
  };

  const getAlertBadgeColor = () => {
    switch (alert.type) {
      case 'PANIC':
        return 'bg-error/10 text-error border-error/30';
      case 'GEOFENCE_ENTRY':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'GEOFENCE_EXIT':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getAlertTypeLabel = () => {
    switch (alert.type) {
      case 'PANIC':
        return 'Emergency Alert';
      case 'GEOFENCE_ENTRY':
        return 'Entered Zone';
      case 'GEOFENCE_EXIT':
        return 'Exited Zone';
      case 'LOW_BATTERY':
        return 'Low Battery';
      case 'LOCATION_LOST':
        return 'Location Lost';
      default:
        return alert.type;
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
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(timestamp);
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-200
        ${isSelected 
          ? 'bg-primary/5 border-primary shadow-sm' 
          : 'bg-surface border-border-default hover:bg-gray-50 hover:border-gray-300'
        }
        ${!alert.isRead ? 'border-l-4' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-2 rounded-xl 
          ${alert.type === 'PANIC' ? 'bg-error/10' : 'bg-primary/10'}
        `}>
          {getAlertIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`
                px-2 py-1 rounded-lg text-xs font-bodyFont font-semibold border
                ${getAlertBadgeColor()}
              `}>
                {getAlertTypeLabel()}
              </span>
              {!alert.isRead && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted font-bodyFont flex-shrink-0">
              <ClockIcon className="h-3 w-3" />
              {getRelativeTime(alert.timestamp)}
            </div>
          </div>

          {/* Child Name */}
          <p className={`text-sm font-bodyFont mb-1 ${!alert.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {alert.user.name}
          </p>

          {/* Message */}
          <p className="text-sm font-bodyFont text-muted line-clamp-2">
            {alert.message}
          </p>

          {/* Geofence name if applicable */}
          {alert.geofence && (
            <p className="text-xs font-bodyFont text-primary mt-1">
              📍 {alert.geofence.name}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default AlertListItem;
