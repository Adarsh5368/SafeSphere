import React from 'react';

const MapSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-100 relative overflow-hidden">
      {/* Background pattern to simulate map tiles */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-8 grid-rows-6 h-full">
          {Array.from({ length: 48 }).map((_, index) => (
            <div 
              key={index} 
              className={`border border-gray-200 bg-gray-50 animate-pulse delay-${(index % 8) * 100}`}
            />
          ))}
        </div>
      </div>

      {/* Loading Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
        <div className="text-center">
          {/* Map Icon */}
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v13" />
            </svg>
          </div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Loading Spinner */}
          <div className="mt-6">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading map...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Skeleton Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-2 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-2 w-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-2 w-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Animated Location Pins */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Skeleton markers scattered around */}
        <div className="absolute top-1/4 left-1/3">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute top-1/2 right-1/4">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-1/3 left-1/2">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div className="h-full bg-blue-600 animate-pulse w-3/5"></div>
      </div>
    </div>
  );
};

export default MapSkeletonLoader;