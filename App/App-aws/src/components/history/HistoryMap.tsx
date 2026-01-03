import React, { useState, useEffect, useRef } from 'react';
import { ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPoint {
  _id: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

interface HistoryMapProps {
  locations: LocationPoint[];
  loading: boolean;
}

const HistoryMap: React.FC<HistoryMapProps> = ({ locations, loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<HTMLDivElement>(null);
  const modalMapInstanceRef = useRef<L.Map | null>(null);

  // Calculate distance between two coordinates (in meters)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Initialize main map
  useEffect(() => {
    if (!mapRef.current || locations.length === 0 || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView(
      [locations[0].coordinates.latitude, locations[0].coordinates.longitude],
      13
    );

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers and path
    addMarkersAndPath(map, locations);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  // Initialize modal map
  useEffect(() => {
    if (!isModalOpen || !modalMapRef.current || locations.length === 0) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (modalMapRef.current && !modalMapInstanceRef.current) {
        const map = L.map(modalMapRef.current).setView(
          [locations[0].coordinates.latitude, locations[0].coordinates.longitude],
          13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        modalMapInstanceRef.current = map;
        addMarkersAndPath(map, locations);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (modalMapInstanceRef.current) {
        modalMapInstanceRef.current.remove();
        modalMapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, locations]);

  const addMarkersAndPath = (map: L.Map, locs: LocationPoint[]) => {
    if (locs.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Filter locations to only include those with significant movement
    const significantLocations: LocationPoint[] = [locs[0]]; // Always include first
    for (let i = 1; i < locs.length; i++) {
      const prev = significantLocations[significantLocations.length - 1];
      const curr = locs[i];
      const distance = calculateDistance(
        prev.coordinates.latitude,
        prev.coordinates.longitude,
        curr.coordinates.latitude,
        curr.coordinates.longitude
      );
      // Only add if moved more than 5 meters
      if (distance > 5) {
        significantLocations.push(curr);
      }
    }
    // Always include last if not already added
    if (significantLocations[significantLocations.length - 1]._id !== locs[locs.length - 1]._id) {
      significantLocations.push(locs[locs.length - 1]);
    }

    // Create path only if there's movement
    if (significantLocations.length > 1) {
      const pathCoords = significantLocations.map(loc => [
        loc.coordinates.latitude,
        loc.coordinates.longitude,
      ] as [number, number]);

      L.polyline(pathCoords, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(map);

      pathCoords.forEach(coord => bounds.extend(coord));
    }

    // Add start marker (green)
    const startIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="width: 16px; height: 16px; background-color: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const startMarker = L.marker(
      [locs[0].coordinates.latitude, locs[0].coordinates.longitude],
      { icon: startIcon }
    ).addTo(map);
    startMarker.bindPopup(`<b>Start</b><br>${new Date(locs[0].timestamp).toLocaleString()}`);
    bounds.extend([locs[0].coordinates.latitude, locs[0].coordinates.longitude]);

    // Add end marker (red) only if different from start
    if (locs.length > 1) {
      const lastLoc = locs[locs.length - 1];
      const endIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="width: 16px; height: 16px; background-color: #ef4444; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const endMarker = L.marker(
        [lastLoc.coordinates.latitude, lastLoc.coordinates.longitude],
        { icon: endIcon }
      ).addTo(map);
      endMarker.bindPopup(`<b>End</b><br>${new Date(lastLoc.timestamp).toLocaleString()}`);
      bounds.extend([lastLoc.coordinates.latitude, lastLoc.coordinates.longitude]);
    }

    // Fit map to bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background rounded-xl border border-border-default">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-3"></div>
          <p className="text-sm font-bodyFont text-muted">Loading map...</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background rounded-xl border border-border-default">
        <div className="text-center p-8">
          <svg
            className="mx-auto h-16 w-16 text-muted mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm font-bodyFont font-medium text-gray-900 mb-1">No Path Data</p>
          <p className="text-xs font-bodyFont text-muted">Select a date range to view location history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface rounded-xl border border-border-default overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="flex-shrink-0 bg-background border-b border-border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-themeFont font-semibold text-gray-900">Movement Path</h3>
            <p className="text-xs font-bodyFont text-muted">{locations.length} location points</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-xs font-bodyFont text-muted">Start</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <span className="text-xs font-bodyFont text-muted">End</span>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Enlarge map"
            >
              <ArrowsPointingOutIcon className="w-5 h-5 text-gray-600 group-hover:text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map */}
      <div ref={mapRef} className="flex-1 w-full"></div>

      {/* Enlarged Map Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-themeFont font-semibold text-gray-900">Movement Path - Enlarged View</h3>
                <p className="text-sm font-bodyFont text-muted mt-1">{locations.length} location points</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="text-xs font-bodyFont text-muted">Start</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <span className="text-xs font-bodyFont text-muted">End</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Leaflet Map */}
            <div ref={modalMapRef} className="flex-1 w-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryMap;
