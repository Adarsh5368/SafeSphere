import React from 'react';
import { 
  UserIcon,
  MapPinIcon,
  ClockIcon,
  SignalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';

interface FamilyMember {
  _id: string;
  name: string;
  email: string;
  userType: string;
  isActive: boolean;
  lastLogin: string;
}

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

interface ChildTrackerPanelProps {
  familyMembers: FamilyMember[];
  childrenLocations: ChildLocation[];
  selectedChild: string | null;
  onTrackChild: (childId: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const ChildTrackerPanel: React.FC<ChildTrackerPanelProps> = ({
  familyMembers,
  childrenLocations,
  selectedChild,
  onTrackChild,
  onRefresh,
  isLoading = false
}) => {
  // Check if child is online (within last 2 minutes)
  const isChildOnline = (childId: string) => {
    const location = childrenLocations.find(loc => loc.userId === childId);
    if (!location) return false;
    
    const lastUpdateTime = new Date(location.timestamp).getTime();
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    return lastUpdateTime > twoMinutesAgo;
  };

  // Get child location
  const getChildLocation = (childId: string) => {
    return childrenLocations.find(loc => loc.userId === childId);
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

  // Get location accuracy text
  const getAccuracyText = (accuracy?: number) => {
    if (!accuracy) return 'Unknown accuracy';
    if (accuracy <= 10) return 'High accuracy';
    if (accuracy <= 50) return 'Good accuracy';
    return 'Low accuracy';
  };

  // Get location coordinates text
  const getCoordinatesText = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Children Tracker</h2>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isLoading 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
            title="Refresh locations"
          >
            <ArrowPathIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {familyMembers.length} children • {childrenLocations.filter(loc => isChildOnline(loc.userId)).length} online
        </p>
      </div>

      {/* Children List */}
      <div className="flex-1 overflow-y-auto">
        {familyMembers.length === 0 ? (
          <div className="p-6 text-center">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No children added</h3>
            <p className="text-xs text-gray-600">Add children to start tracking</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {familyMembers.map((child) => {
              const location = getChildLocation(child._id);
              const online = isChildOnline(child._id);
              const isSelected = selectedChild === child._id;

              return (
                <div
                  key={child._id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    isSelected 
                      ? "bg-blue-50 border-blue-200 shadow-sm" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => onTrackChild(child._id)}
                >
                  {/* Child Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        online ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{child.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            online ? "bg-green-500" : "bg-gray-400"
                          )} />
                          <span className="text-xs text-gray-600">
                            {online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Track Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackChild(child._id);
                      }}
                      className={cn(
                        "px-3 py-1 text-xs rounded-md transition-colors",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {isSelected ? "Tracking" : "Track"}
                    </button>
                  </div>

                  {/* Location Info */}
                  {location ? (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-600">
                            {getCoordinatesText(location.latitude, location.longitude)}
                          </p>
                          {location.accuracy && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getAccuracyText(location.accuracy)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">
                          {formatLastSeen(location.timestamp)}
                        </span>
                      </div>

                      {/* Signal Strength */}
                      <div className="flex items-center space-x-2">
                        <SignalIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600">
                          {online ? "Strong signal" : "No signal"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="text-xs">No location data</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      {familyMembers.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {childrenLocations.filter(loc => isChildOnline(loc.userId)).length}
              </div>
              <div className="text-xs text-gray-600">Online</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">
                {familyMembers.length - childrenLocations.filter(loc => isChildOnline(loc.userId)).length}
              </div>
              <div className="text-xs text-gray-600">Offline</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Updating locations...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildTrackerPanel;