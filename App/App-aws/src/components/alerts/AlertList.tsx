import React from 'react';
import AlertListItem from './AlertListItem';
import { BellSlashIcon } from '@heroicons/react/24/outline';

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

interface AlertListProps {
  alerts: Alert[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
  loading?: boolean;
}

const AlertList: React.FC<AlertListProps> = ({ 
  alerts, 
  selectedAlertId, 
  onSelectAlert,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface border border-border-default rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-surface border border-border-default rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
          <BellSlashIcon className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-themeFont font-semibold text-gray-900 mb-2">
          No alerts yet
        </h3>
        <p className="text-sm font-bodyFont text-muted max-w-sm mx-auto">
          You're all clear! 🎉 When your children trigger alerts or enter/exit geofences, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertListItem
          key={alert._id}
          alert={alert}
          isSelected={selectedAlertId === alert._id}
          onClick={() => onSelectAlert(alert._id)}
        />
      ))}
    </div>
  );
};

export default AlertList;
