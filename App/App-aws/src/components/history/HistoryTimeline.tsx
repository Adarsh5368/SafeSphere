import React from 'react';
import { formatLocationTimestamp } from '../../utils/formatDate';

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

interface HistoryTimelineProps {
  locations: LocationPoint[];
  loading: boolean;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ locations, loading }) => {
  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-muted';
    if (accuracy < 10) return 'text-success';
    if (accuracy < 50) return 'text-warning';
    return 'text-error';
  };

  const getAccuracyLabel = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 10) return 'High';
    if (accuracy < 50) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-background rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="bg-background rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-muted mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm font-bodyFont text-muted">No location history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {locations.map((location, index) => (
        <div
          key={location._id}
          className="bg-surface border border-border-default rounded-lg p-4 hover:border-primary/30 transition-colors"
        >
          <div className="grid grid-cols-[auto_1fr] gap-3">
            {/* Timeline Marker */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bodyFont font-bold ${
                index === 0 
                  ? 'bg-success text-white' 
                  : index === locations.length - 1 
                  ? 'bg-error text-white' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {index + 1}
              </div>
              {index < locations.length - 1 && (
                <div className="w-0.5 h-full bg-border-default mt-1"></div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-bodyFont font-semibold text-gray-900">
                  {formatLocationTimestamp(location.timestamp)}
                </span>
                <span className={`text-xs font-bodyFont ${getAccuracyColor(location.accuracy)}`}>
                  {getAccuracyLabel(location.accuracy)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-xs font-bodyFont text-muted truncate">
                    {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                  </span>
                </div>

                {location.speed !== undefined && location.speed > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-bodyFont text-muted">
                      {location.speed.toFixed(1)} km/h
                    </span>
                  </div>
                )}

                {location.accuracy && (
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-bodyFont text-muted">
                      ±{location.accuracy.toFixed(1)}m accuracy
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryTimeline;
