import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import AlertFilters, { AlertFilterType } from '../../components/alerts/AlertFilters';
import AlertList from '../../components/alerts/AlertList';
import AlertDetails from '../../components/alerts/AlertDetails';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { 
  BellIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

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

const ParentAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [activeFilter, setActiveFilter] = useState<AlertFilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.ALERTS);
      setAlerts(response.data.data.alerts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Filter alerts based on active filter
  useEffect(() => {
    let filtered = [...alerts];

    switch (activeFilter) {
      case 'panic':
        filtered = filtered.filter(alert => alert.type === 'PANIC');
        break;
      case 'geofence':
        filtered = filtered.filter(alert => 
          alert.type === 'GEOFENCE_ENTRY' || alert.type === 'GEOFENCE_EXIT'
        );
        break;
      case 'unread':
        filtered = filtered.filter(alert => !alert.isRead);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setFilteredAlerts(filtered);
  }, [alerts, activeFilter]);

  // Load selected alert details
  useEffect(() => {
    if (selectedAlertId) {
      const alert = alerts.find(a => a._id === selectedAlertId);
      setSelectedAlert(alert || null);
    } else {
      setSelectedAlert(null);
    }
  }, [selectedAlertId, alerts]);

  // Calculate filter counts
  const filterCounts = {
    all: alerts.length,
    panic: alerts.filter(a => a.type === 'PANIC').length,
    geofence: alerts.filter(a => a.type === 'GEOFENCE_ENTRY' || a.type === 'GEOFENCE_EXIT').length,
    unread: alerts.filter(a => !a.isRead).length,
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlertId(alertId);
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await api.patch(`${API_ENDPOINTS.ALERTS}/${alertId}`);
      
      // Update local state
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert._id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (err: any) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await api.patch(API_ENDPOINTS.MARK_ALL_AS_READ);
      
      // Update all alerts to read
      setAlerts(prevAlerts =>
        prevAlerts.map(alert => ({ ...alert, isRead: true }))
      );
    } catch (err: any) {
      setError('Failed to mark all alerts as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedAlertId(null);
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-surface rounded-xl border border-border-default p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <BellIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-themeFont font-semibold text-gray-900">Alerts Center</h1>
                <p className="text-sm font-bodyFont text-muted">
                  {filterCounts.unread > 0 
                    ? `${filterCounts.unread} unread alert${filterCounts.unread > 1 ? 's' : ''}` 
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            {filterCounts.unread > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bodyFont font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                {markingAllAsRead ? 'Marking...' : 'Mark All as Read'}
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 animate-shake">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bodyFont font-semibold text-error mb-1">Error</h3>
                <p className="text-sm font-bodyFont text-gray-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-error hover:text-red-700"
                title="Dismiss error"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-surface rounded-xl border border-border-default p-4">
          <AlertFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={filterCounts}
          />
        </div>

        {/* Alerts List */}
        <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
          <AlertList
            alerts={filteredAlerts}
            selectedAlertId={selectedAlertId}
            onSelectAlert={handleSelectAlert}
            loading={loading}
          />
        </div>

        {/* Alert Details Modal */}
        {selectedAlert && (
          <AlertDetails
            alert={selectedAlert}
            onMarkAsRead={handleMarkAsRead}
            onClose={handleCloseDetails}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ParentAlerts;