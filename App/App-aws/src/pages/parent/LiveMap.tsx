import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import MainLayout from '../../components/layout/MainLayout';
import ChildTrackerPanel from '../../components/map/ChildTrackerPanel';
import 'leaflet/dist/leaflet.css';


delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for children
const createChildIcon = (isOnline: boolean, childName: string) => {
  const color = isOnline ? '#10b981' : '#6b7280'; // green for online, gray for offline
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 6.9 12.5 28.5 12.5 28.5S25 19.4 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <text x="12.5" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">${childName.charAt(0).toUpperCase()}</text>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-child-marker',
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });
};

interface ChildLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  user: {
    _id: string;
    name: string;
    isActive: boolean;
  };
}

interface Geofence {
  _id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  isActive: boolean;
  childrenStates?: Array<{
    userId: string;
    isInside: boolean;
    lastUpdate: string;
  }>;
}

interface FamilyMember {
  _id: string;
  name: string;
  email: string;
  userType: string;
  isActive: boolean;
  lastLogin: string;
}

const LiveMap: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childrenLocations, setChildrenLocations] = useState<ChildLocation[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(10);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when tracking

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.FAMILY);
      // Handle both possible response structures
      const familyData = response.data.data?.familyMembers || response.data.data || [];
      const children = familyData.filter((member: FamilyMember) => member.userType === 'CHILD');
      setFamilyMembers(children);
      return children;
    } catch (err) {
      console.error('Failed to fetch family members:', err);
      return [];
    }
  };

  // Fetch children locations
  const fetchChildrenLocations = async (children: FamilyMember[]) => {
    try {
      const childIds = children.map(child => child._id);
      if (childIds.length === 0) return [];

      const response = await api.post(API_ENDPOINTS.CHILDREN_LOCATIONS, {
        childIds
      });
      
      // Handle different response structures
      const locations = response.data.data?.locations || response.data.data || [];
      const locationsArray = Array.isArray(locations) ? locations : [];
      setChildrenLocations(locationsArray);
      setLastUpdate(new Date());
      
      // Auto-fit map to show all children on first load
      if (locations.length > 0 && isLoading) {
        fitMapToChildren(locations);
      }
      
      return locations;
    } catch (err) {
      console.error('Failed to fetch children locations:', err);
      return [];
    }
  };

  // Fetch geofences
  const fetchGeofences = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.GEOFENCES);
      const geofencesData = response.data.data?.geofences || response.data.data || [];
      const geofencesArray = Array.isArray(geofencesData) ? geofencesData : [];
      const activeGeofences = geofencesArray.filter((geofence: Geofence) => geofence.isActive);
      setGeofences(activeGeofences);
      return activeGeofences;
    } catch (err) {
      console.error('Failed to fetch geofences:', err);
      return [];
    }
  };

  // Fit map to show all children
  const fitMapToChildren = (locations: ChildLocation[]) => {
    if (locations.length === 0) return;
    
    if (locations.length === 1) {
      const location = locations[0];
      setMapCenter([location.latitude, location.longitude]);
      setMapZoom(15);
    } else {
      // Calculate bounds for multiple children
      const lats = locations.map(loc => loc.latitude);
      const lngs = locations.map(loc => loc.longitude);
      
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      setMapCenter([centerLat, centerLng]);
      setMapZoom(12);
    }
  };

  // Track specific child
  const trackChild = async (childId: string) => {
    setSelectedChild(childId);
    
    try {
      // Get current location for the specific child
      const response = await api.get(API_ENDPOINTS.CURRENT_LOCATION(childId));
      const location = response.data.data;
      
      if (location && location.latitude && location.longitude) {
        setMapCenter([location.latitude, location.longitude]);
        setMapZoom(16);
        setMapKey(prev => prev + 1); // Force map to re-center
      } else {
        // Fallback to existing location data
        const existingLocation = childrenLocations.find(loc => loc.userId === childId);
        if (existingLocation) {
          setMapCenter([existingLocation.latitude, existingLocation.longitude]);
          setMapZoom(16);
          setMapKey(prev => prev + 1); // Force map to re-center
        }
      }
    } catch (err) {
      // Fallback to existing location data
      const existingLocation = childrenLocations.find(loc => loc.userId === childId);
      if (existingLocation) {
        setMapCenter([existingLocation.latitude, existingLocation.longitude]);
        setMapZoom(16);
        setMapKey(prev => prev + 1); // Force map to re-center
      }
    }
  };

  // Load all map data
  const loadMapData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [children] = await Promise.all([
        fetchFamilyMembers(),
        fetchGeofences()
      ]);
      
      if (children.length > 0) {
        await fetchChildrenLocations(children);
      }
    } catch (err) {
      setError('Failed to load map data. Please try again.');
      console.error('Map data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    loadMapData();

    // Set up interval for real-time updates every 10 seconds
    const interval = setInterval(async () => {
      if (familyMembers.length > 0) {
        await fetchChildrenLocations(familyMembers);
      }
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh locations when family members change
  useEffect(() => {
    const updateLocations = async () => {
      if (familyMembers.length === 0) return;
      
      try {
        const childIds = familyMembers.map(child => child._id);
        const response = await api.post(API_ENDPOINTS.CHILDREN_LOCATIONS, {
          childIds
        });
        
        // Handle different response structures
        const locations = response.data.data?.locations || response.data.data || [];
        const locationsArray = Array.isArray(locations) ? locations : [];
        setChildrenLocations(locationsArray);
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Failed to fetch children locations:', err);
      }
    };
    
    updateLocations();
  }, [familyMembers]);

  // Check if child is online (within last 2 minutes)
  const isChildOnline = (timestamp: string) => {
    const lastUpdateTime = new Date(timestamp).getTime();
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    return lastUpdateTime > twoMinutesAgo;
  };

  // Format last seen time
  const formatLastSeen = (timestamp: string) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return lastSeen.toLocaleDateString();
  };

  // Time since last update
  const getTimeSinceUpdate = () => {
    const diffInSeconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  if (error) {
    return (
      <MainLayout>
        <div className="h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Map</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadMapData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Live Map</h1>
              <p className="text-sm text-gray-600">
                Real-time tracking • Last updated {getTimeSinceUpdate()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Updates</span>
              </div>
              <button
                onClick={loadMapData}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Side Panel */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <ChildTrackerPanel
              familyMembers={familyMembers}
              childrenLocations={childrenLocations}
              selectedChild={selectedChild}
              onTrackChild={trackChild}
              onRefresh={() => fetchChildrenLocations(familyMembers)}
              isLoading={isLoading}
            />
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="w-full h-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                key={mapKey}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Child Location Markers */}
                {childrenLocations.map((location) => (
                  <Marker
                    key={location.userId}
                    position={[location.latitude, location.longitude]}
                    icon={createChildIcon(isChildOnline(location.timestamp), location.user.name)}
                    eventHandlers={{
                      click: () => trackChild(location.userId)
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{location.user.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            isChildOnline(location.timestamp) 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-gray-600 bg-gray-50'
                          }`}>
                            {isChildOnline(location.timestamp) ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Coordinates:</span>
                            <span className="font-mono">
                              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Last updated:</span>
                            <span className="font-medium">{formatLastSeen(location.timestamp)}</span>
                          </div>
                          
                          {location.accuracy && (
                            <div className="flex justify-between">
                              <span>Accuracy:</span>
                              <span className="font-medium">±{Math.round(location.accuracy)}m</span>
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => trackChild(location.userId)}
                          className="mt-2 w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Track {location.user.name}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Geofence Circles */}
                {geofences.map((geofence) => (
                  <Circle
                    key={geofence._id}
                    center={[geofence.centerLat, geofence.centerLon]}
                    radius={geofence.radius}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-medium text-gray-900 mb-1">{geofence.name}</h4>
                        <p className="text-xs text-gray-600">
                          Radius: {Math.round(geofence.radius)}m
                        </p>
                        <p className="text-xs text-gray-600">
                          Center: {geofence.centerLat.toFixed(4)}, {geofence.centerLon.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            )}

            {/* Map Controls */}
            {!isLoading && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2 z-10">
                <button
                  onClick={() => fitMapToChildren(childrenLocations)}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Fit all children"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            )}

            {/* Location Legend */}
            {!isLoading && (
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-10">
                <h4 className="text-sm font-medium text-gray-900">Legend</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Child Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">Child Offline</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-blue-500 rounded-full bg-blue-100"></div>
                    <span className="text-xs text-gray-600">Geofence Area</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LiveMap;