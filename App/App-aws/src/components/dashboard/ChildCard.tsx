import React from 'react';
import { MapPinIcon, ClockIcon, SignalIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';

interface ChildLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

interface ChildCardProps {
  child: {
    _id: string;
    name: string;
    email: string;
    age?: number;
    isActive: boolean;
    lastLogin: string;
  };
  location?: ChildLocation;
  isOnline: boolean;
  className?: string;
}

const ChildCard: React.FC<ChildCardProps> = ({
  child,
  location,
  isOnline,
  className
}) => {
  const getStatusColor = () => {
    if (!isOnline) return 'text-muted';
    return location ? 'text-success' : 'text-warning';
  };

  const getStatusText = () => {
    if (!isOnline) return 'OFFLINE';
    return location ? 'LIVE' : 'NO LOCATION';
  };

  const getLocationText = () => {
    if (!location) return 'No recent location';
    const timestamp = new Date(location.timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className={cn(
      'bg-surface rounded-lg border border-border-default p-3 hover:border-primary transition-colors',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-themeFont font-semibold text-gray-900 truncate">{child.name}</h3>
          {child.age && (
            <p className="text-xs font-bodyFont text-muted">Age {child.age}</p>
          )}
        </div>
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          isOnline ? 'bg-success' : 'bg-muted'
        )} />
      </div>

      {/* Compact Status */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-3 h-3" />
          <span>{location ? getLocationText() : 'No data'}</span>
        </div>
        <span className={cn('font-medium', getStatusColor())}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};

export default ChildCard;