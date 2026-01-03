import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  MapPinIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Child {
  _id: string;
  name: string;
}

interface Geofence {
  _id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  childId?: {
    _id: string;
    name: string;
  } | null;
}

interface GeofenceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GeofenceFormData) => Promise<void>;
  children: Child[];
  editingGeofence?: Geofence | null;
  isSubmitting?: boolean;
}

export interface GeofenceFormData {
  name: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  assignedTo?: string;
}

const GeofenceFormModal: React.FC<GeofenceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  children,
  editingGeofence,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<GeofenceFormData>({
    name: '',
    centerLat: 28.6139, // Default: New Delhi
    centerLon: 77.2090,
    radius: 500,
    notifyOnEntry: true,
    notifyOnExit: true,
    assignedTo: undefined
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (editingGeofence) {
      setFormData({
        name: editingGeofence.name,
        centerLat: editingGeofence.centerLat,
        centerLon: editingGeofence.centerLon,
        radius: editingGeofence.radius,
        notifyOnEntry: editingGeofence.notifyOnEntry,
        notifyOnExit: editingGeofence.notifyOnExit,
        assignedTo: editingGeofence.childId?._id
      });
    } else {
      // Reset form for new geofence
      setFormData({
        name: '',
        centerLat: 28.6139,
        centerLon: 77.2090,
        radius: 500,
        notifyOnEntry: true,
        notifyOnExit: true,
        assignedTo: undefined
      });
    }
    setError(null);
  }, [editingGeofence, isOpen]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current).setView([formData.centerLat, formData.centerLon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    const marker = L.marker([formData.centerLat, formData.centerLon], { draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setFormData(prev => ({ ...prev, centerLat: pos.lat, centerLon: pos.lng }));
      if (circleRef.current) {
        circleRef.current.setLatLng([pos.lat, pos.lng]);
      }
    });

    // Add circle
    const circle = L.circle([formData.centerLat, formData.centerLon], {
      radius: formData.radius,
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      color: '#3b82f6',
      weight: 2,
    }).addTo(map);

    // Allow map click to change location
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setFormData(prev => ({ ...prev, centerLat: lat, centerLon: lng }));
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update map when form data changes
  useEffect(() => {
    if (markerRef.current && circleRef.current) {
      markerRef.current.setLatLng([formData.centerLat, formData.centerLon]);
      circleRef.current.setLatLng([formData.centerLat, formData.centerLon]);
      circleRef.current.setRadius(formData.radius);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([formData.centerLat, formData.centerLon]);
      }
    }
  }, [formData.centerLat, formData.centerLon, formData.radius]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'radius' || name === 'centerLat' || name === 'centerLon') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'assignedTo') {
      setFormData(prev => ({ ...prev, [name]: value || undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Geofence name is required');
      return;
    }

    if (formData.radius < 100 || formData.radius > 5000) {
      setError('Radius must be between 100m and 5000m');
      return;
    }

    if (formData.centerLat < -90 || formData.centerLat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (formData.centerLon < -180 || formData.centerLon > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      centerLat: 0,
      centerLon: 0,
      radius: 500,
      notifyOnEntry: true,
      notifyOnExit: true,
      assignedTo: undefined
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default sticky top-0 bg-surface z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MapPinIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-themeFont font-semibold text-gray-900">
                {editingGeofence ? 'Edit Safe Zone' : 'Create Safe Zone'}
              </h2>
              <p className="text-sm font-bodyFont text-muted">
                {editingGeofence ? 'Update geofence settings' : 'Define a new safe zone for your children'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Close modal"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <p className="text-error text-sm font-bodyFont">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Geofence Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bodyFont font-medium text-gray-900 mb-2">
                Safe Zone Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Home, School, Park"
                className="w-full px-4 py-2.5 border border-border-default rounded-xl text-sm font-bodyFont focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Child Selector */}
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-bodyFont font-medium text-gray-900 mb-2">
                Assign to Child (Optional)
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-border-default rounded-xl text-sm font-bodyFont focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
              >
                <option value="">All Children</option>
                {children.map(child => (
                  <option key={child._id} value={child._id}>
                    {child.name}
                  </option>
                ))}
              </select>
              <p className="text-xs font-bodyFont text-muted mt-1">
                Leave unassigned to monitor all children in this zone
              </p>
            </div>

            {/* Interactive Map */}
            <div>
              <label className="block text-sm font-bodyFont font-medium text-gray-900 mb-2">
                Select Location & Radius *
              </label>
              <div className="bg-background rounded-xl border border-border-default overflow-hidden">
                <div ref={mapRef} className="w-full h-96"></div>
                <div className="p-3 bg-gray-50 border-t border-border-default">
                  <div className="flex items-center justify-between text-xs font-bodyFont">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-primary" />
                      <span className="text-muted">📍 Click map to place marker or drag to move</span>
                    </div>
                    <span className="text-gray-700 font-mono">
                      {formData.centerLat.toFixed(5)}, {formData.centerLon.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <label htmlFor="radius" className="block text-sm font-bodyFont font-medium text-gray-900 mb-2">
                Radius: {formData.radius >= 1000 
                  ? `${(formData.radius / 1000).toFixed(1)} km` 
                  : `${formData.radius} m`}
              </label>
              <input
                type="range"
                id="radius"
                name="radius"
                value={formData.radius}
                onChange={handleInputChange}
                min="100"
                max="5000"
                step="50"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs font-bodyFont text-muted mt-1">
                <span>100m</span>
                <span>5km</span>
              </div>
              <p className="text-xs font-bodyFont text-muted mt-2">
                💡 Adjust the slider to change the safe zone radius on the map
              </p>
            </div>

            {/* Notification Toggles */}
            <div className="bg-background rounded-xl border border-border-default p-4">
              <h4 className="text-sm font-bodyFont font-semibold text-gray-900 mb-3">
                Alert Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bodyFont font-medium text-gray-900">Entry Notifications</p>
                      <p className="text-xs font-bodyFont text-muted">Alert when child enters this zone</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="notifyOnEntry"
                    name="notifyOnEntry"
                    checked={formData.notifyOnEntry}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-5 w-5 text-error" />
                    </div>
                    <div>
                      <p className="text-sm font-bodyFont font-medium text-gray-900">Exit Notifications</p>
                      <p className="text-xs font-bodyFont text-muted">Alert when child leaves this zone</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="notifyOnExit"
                    name="notifyOnExit"
                    checked={formData.notifyOnExit}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border-default">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-bodyFont font-medium hover:bg-gray-200 transition-colors"
              disabled={loading || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bodyFont font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {editingGeofence ? 'Update Safe Zone' : 'Create Safe Zone'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeofenceFormModal;
