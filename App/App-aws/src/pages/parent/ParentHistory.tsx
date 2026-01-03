import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import DateFilter, { DateRangeType } from '../../components/history/DateFilter';
import ChildDropdown from '../../components/history/ChildDropdown';
import HistoryTimeline from '../../components/history/HistoryTimeline';
import HistoryMap from '../../components/history/HistoryMap';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';

interface Child {
  _id: string;
  name: string;
  email: string;
}

interface LocationPoint {
  _id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  speed?: number;
  accuracy?: number;
}

const ParentHistory: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  // Fetch children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.FAMILY);
        const childrenData = response.data.data.children || [];
        setChildren(childrenData);
        
        // Auto-select first child
        if (childrenData.length > 0) {
          setSelectedChildId(childrenData[0]._id);
        }
      } catch (err) {
        console.error('Error fetching children:', err);
        setError('Failed to load children');
      } finally {
        setChildrenLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Fetch location history
  const fetchLocationHistory = useCallback(async () => {
    if (!selectedChildId || !dateRange) return;

    setLoading(true);
    setError('');

    try {
      const fromISO = dateRange.from.toISOString();
      const toISO = dateRange.to.toISOString();
      
      const response = await api.get(
        `${API_ENDPOINTS.LOCATION_HISTORY(selectedChildId)}?from=${fromISO}&to=${toISO}`
      );
      
      const locationsData = response.data.data.locations || [];
      // Sort by timestamp ascending (oldest first) for proper path display
      const sortedLocations = locationsData.sort((a: LocationPoint, b: LocationPoint) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setLocations(sortedLocations);
    } catch (err) {
      console.error('Error fetching location history:', err);
      setError('Failed to load location history');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, dateRange]);

  // Fetch data when filters change
  useEffect(() => {
    fetchLocationHistory();
  }, [fetchLocationHistory]);

  // Initialize with "today" date range
  useEffect(() => {
    const now = new Date();
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    setDateRange({ from, to: now });
  }, []);

  const handleDateRangeChange = (type: DateRangeType, from?: Date, to?: Date) => {
    if (from && to) {
      setDateRange({ from, to });
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-surface border-b border-border-default px-6 py-4">
          <h1 className="text-2xl font-themeFont font-bold text-gray-900">Location History</h1>
          <p className="text-sm font-bodyFont text-muted mt-1">
            Track your child's movement patterns and location timeline
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 p-6">
            {/* Left Sidebar - Filters & Timeline */}
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Filters */}
              <div className="flex-shrink-0 space-y-4">
                <ChildDropdown
                  children={children}
                  selectedChildId={selectedChildId}
                  onChildChange={handleChildChange}
                  loading={childrenLoading}
                />

                <DateFilter onDateRangeChange={handleDateRangeChange} />

                {/* Stats Card */}
                {locations.length > 0 && (
                  <div className="bg-primary/10 rounded-xl border border-primary/30 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bodyFont text-muted mb-1">Total Points</p>
                        <p className="text-lg font-themeFont font-bold text-primary">
                          {locations.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bodyFont text-muted mb-1">Duration</p>
                        <p className="text-lg font-themeFont font-bold text-primary">
                          {(() => {
                            if (locations.length < 2) return '0h';
                            const start = new Date(locations[0].timestamp).getTime();
                            const end = new Date(locations[locations.length - 1].timestamp).getTime();
                            const hours = Math.floor((end - start) / (1000 * 60 * 60));
                            const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
                            return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <h3 className="text-sm font-themeFont font-semibold text-gray-900 mb-3 flex-shrink-0">
                    Location Timeline
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {error ? (
                      <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                        <p className="text-sm font-bodyFont text-error">{error}</p>
                      </div>
                    ) : (
                      <HistoryTimeline locations={locations} loading={loading} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Map */}
            <div className="h-full">
              <HistoryMap locations={locations} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentHistory;