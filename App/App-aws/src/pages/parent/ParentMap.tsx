import React, { useState, useEffect, useCallback } from 'react';
import { MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import { amplifyAPI } from '../../services/amplify-api';
import { useAuth } from '../../context/AuthContext';

interface Child {
  _id: string;
  name: string;
  email: string;
}

interface ChildLocation {
  userId: string;
  user?: {
    name: string;
  };
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  _id?: string;
}

const ParentMap: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [locations, setLocations] = useState<ChildLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async (childrenList?: Child[]) => {
    try {
      const childIds = (childrenList || children).map(c => c._id);
      if (childIds.length === 0) return;

      console.log('ParentMap: Fetching locations for children:', childIds);
      const locs = await amplifyAPI.getChildrenLocations(childIds);
      console.log('ParentMap: Locations response:', locs);
      
      // Map Amplify locations to app format
      const mappedLocs = locs.map(loc => ({
        userId: loc.userId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy || undefined,
        timestamp: loc.timestamp,
        _id: loc.id,
      }));
      console.log('ParentMap: Mapped locations:', mappedLocs);
      setLocations(mappedLocs);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  }, [children]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user?._id) {
        setError('User not found');
        return;
      }

      // Get user with children data
      const familyData = await amplifyAPI.getUserWithChildren(user._id);
      const childrenList = familyData?.children || [];
      
      // Map to expected format
      const mappedChildren = childrenList.map((child: any) => ({
        _id: child.id,
        name: child.name,
        email: child.email,
      }));
      
      setChildren(mappedChildren);
      
      if (mappedChildren.length > 0) {
        await fetchLocations(mappedChildren);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchLocations]);

  useEffect(() => {
    fetchData();
    
    // Refresh locations every 10 seconds
    const interval = setInterval(() => fetchLocations(), 10000);
    return () => clearInterval(interval);
  }, [fetchData, fetchLocations]);

  const getChildLocation = (childId: string) => {
    const location = locations.find(loc => loc.userId === childId);
    console.log('Getting location for child:', childId, 'found:', location);
    return location;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-128px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-base font-bodyFont text-muted">Loading map...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-surface border-b border-border-default px-6 py-4">
          <h1 className="text-2xl font-themeFont font-semibold text-gray-900 mb-1">Family Map</h1>
          <p className="text-sm font-bodyFont text-muted">View real-time locations of your family members</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex-shrink-0 mx-6 mt-4 bg-error/10 border border-error/30 rounded-xl p-4">
            <p className="text-sm font-bodyFont text-error">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-6">
            {/* Map Placeholder */}
            <div className="h-full bg-surface rounded-xl border border-border-default overflow-hidden">
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-accent/5">
                <MapPinIcon className="w-16 h-16 text-primary/40 mb-4" />
                <p className="text-lg font-bodyFont text-gray-700 mb-2">Interactive Map Coming Soon</p>
                <p className="text-sm font-bodyFont text-muted text-center max-w-md">
                  Real-time map view with Mapbox integration will be available soon. Use the sidebar to view current locations.
                </p>
              </div>
            </div>

            {/* Children List with Locations */}
            <div className="h-full flex flex-col bg-surface rounded-xl border border-border-default">
              <div className="flex-shrink-0 flex items-center gap-2 px-5 py-4 border-b border-border-default">
                <UserGroupIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-themeFont font-semibold text-gray-900">Children Locations</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-5">

            {children.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-sm font-bodyFont text-muted">No children added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {children.map(child => {
                  const location = getChildLocation(child._id);
                  return (
                    <div
                      key={child._id}
                      className="bg-background rounded-xl border border-border-default p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-themeFont font-bold text-primary">
                            {child.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bodyFont font-semibold text-gray-900 truncate">
                            {child.name}
                          </h3>
                          {location ? (
                            <>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPinIcon className="w-3 h-3 text-success" />
                                <span className="text-xs font-bodyFont text-success">Online</span>
                              </div>
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-bodyFont text-muted">
                                  <span className="font-mono">
                                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                  </span>
                                </div>
                                <div className="text-xs font-bodyFont text-muted">
                                  Updated: {formatTime(location.timestamp)}
                                </div>
                                {location.accuracy && (
                                  <div className="text-xs font-bodyFont text-muted">
                                    Accuracy: ±{location.accuracy.toFixed(0)}m
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-muted rounded-full"></div>
                              <span className="text-xs font-bodyFont text-muted">No location data</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentMap;