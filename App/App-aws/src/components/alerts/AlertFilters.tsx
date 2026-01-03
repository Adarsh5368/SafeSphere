import React from 'react';
import { 
  ExclamationTriangleIcon, 
  MapPinIcon, 
  FunnelIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export type AlertFilterType = 'all' | 'panic' | 'geofence' | 'unread';

interface AlertFiltersProps {
  activeFilter: AlertFilterType;
  onFilterChange: (filter: AlertFilterType) => void;
  counts: {
    all: number;
    panic: number;
    geofence: number;
    unread: number;
  };
}

const AlertFilters: React.FC<AlertFiltersProps> = ({ activeFilter, onFilterChange, counts }) => {
  const filters = [
    { 
      id: 'all' as AlertFilterType, 
      label: 'All Alerts', 
      icon: FunnelIcon, 
      count: counts.all,
      color: 'text-gray-600'
    },
    { 
      id: 'panic' as AlertFilterType, 
      label: 'Panic', 
      icon: ExclamationTriangleIcon, 
      count: counts.panic,
      color: 'text-error'
    },
    { 
      id: 'geofence' as AlertFilterType, 
      label: 'Geofence', 
      icon: MapPinIcon, 
      count: counts.geofence,
      color: 'text-primary'
    },
    { 
      id: 'unread' as AlertFilterType, 
      label: 'Unread', 
      icon: CheckCircleIcon, 
      count: counts.unread,
      color: 'text-accent'
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-bodyFont font-medium text-sm
              transition-all duration-200
              ${isActive 
                ? 'bg-primary text-white shadow-sm' 
                : 'bg-surface border border-border-default text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : filter.color}`} />
            <span>{filter.label}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-semibold
              ${isActive 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default AlertFilters;
