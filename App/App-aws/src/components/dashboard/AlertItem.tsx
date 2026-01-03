import React from 'react';
import { 
  ExclamationTriangleIcon, 
  MapPinIcon, 
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';
import { ALERT_TYPES, type AlertType } from '../../utils/constants';

interface AlertItemProps {
  alert: {
    _id: string;
    type: AlertType;
    message?: string;
    timestamp: string;
    isRead: boolean;
    location?: {
      latitude: number;
      longitude: number;
    };
    userId: {
      _id: string;
      name: string;
    };
  };
  onClick?: () => void;
  className?: string;
}

const AlertItem: React.FC<AlertItemProps> = ({
  alert,
  onClick,
  className
}) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case ALERT_TYPES.PANIC:
        return <ExclamationTriangleIcon className="w-5 h-5 text-error" />;
      case ALERT_TYPES.GEOFENCE_ENTRY:
      case ALERT_TYPES.GEOFENCE_EXIT:
        return <MapPinIcon className="w-5 h-5 text-primary" />;
      case ALERT_TYPES.LOW_BATTERY:
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning" />;
      case ALERT_TYPES.LOCATION_LOST:
        return <MapPinIcon className="w-5 h-5 text-muted" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-muted" />;
    }
  };

  const getAlertTitle = () => {
    switch (alert.type) {
      case ALERT_TYPES.PANIC:
        return 'Panic Alert';
      case ALERT_TYPES.GEOFENCE_ENTRY:
        return 'Geofence Entry';
      case ALERT_TYPES.GEOFENCE_EXIT:
        return 'Geofence Exit';
      case ALERT_TYPES.LOW_BATTERY:
        return 'Low Battery';
      case ALERT_TYPES.LOCATION_LOST:
        return 'Location Lost';
      default:
        return 'Alert';
    }
  };

  const getAlertDescription = () => {
    if (alert.message) return alert.message;
    
    switch (alert.type) {
      case ALERT_TYPES.PANIC:
        return `${alert.userId.name} triggered a panic alert`;
      case ALERT_TYPES.GEOFENCE_ENTRY:
        return `${alert.userId.name} entered a geofence area`;
      case ALERT_TYPES.GEOFENCE_EXIT:
        return `${alert.userId.name} left a geofence area`;
      case ALERT_TYPES.LOW_BATTERY:
        return `${alert.userId.name}'s device has low battery`;
      case ALERT_TYPES.LOCATION_LOST:
        return `Lost location tracking for ${alert.userId.name}`;
      default:
        return `Alert from ${alert.userId.name}`;
    }
  };

  const getSeverityColor = () => {
    switch (alert.type) {
      case ALERT_TYPES.PANIC:
        return 'border-l-error bg-error/5';
      case ALERT_TYPES.GEOFENCE_ENTRY:
      case ALERT_TYPES.GEOFENCE_EXIT:
        return 'border-l-primary bg-primary/5';
      case ALERT_TYPES.LOW_BATTERY:
        return 'border-l-warning bg-warning/5';
      case ALERT_TYPES.LOCATION_LOST:
        return 'border-l-muted bg-gray-50';
      default:
        return 'border-l-border-default bg-gray-50';
    }
  };

  const formatTime = () => {
    const timestamp = new Date(alert.timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div 
      className={cn(
        'border-l-4 p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm',
        getSeverityColor(),
        !alert.isRead && 'font-medium',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Alert Icon */}
        <div className="flex-shrink-0">
          {getAlertIcon()}
        </div>

        {/* Alert Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <h4 className={cn(
              'text-sm font-bodyFont font-semibold truncate',
              alert.isRead ? 'text-gray-700' : 'text-gray-900'
            )}>
              {getAlertTitle()}
            </h4>
            {!alert.isRead && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs font-bodyFont text-muted mt-1">
            <ClockIcon className="w-3 h-3" />
            <span>{formatTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertItem;