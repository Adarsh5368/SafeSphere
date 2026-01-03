import React from 'react';
import { formatDate } from '../../utils/formatDate';
import {
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  BellSlashIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

interface Geofence {
  _id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  isActive: boolean;
  childId?: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface GeofenceCardProps {
  geofence: Geofence;
  onEdit: (geofence: Geofence) => void;
  onDelete: (geofence: Geofence) => void;
}

const GeofenceCard: React.FC<GeofenceCardProps> = ({ geofence, onEdit, onDelete }) => {
  return (
    <div className="bg-surface rounded-xl border border-border-default p-5 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <MapPinIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-themeFont font-semibold text-gray-900 truncate mb-1">
              {geofence.name}
            </h3>
            <div className="flex items-center gap-2">
              {geofence.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-bodyFont font-medium rounded-full">
                  <CheckBadgeIcon className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/10 text-muted text-xs font-bodyFont font-medium rounded-full">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-4">
        {/* Assigned Child */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bodyFont text-muted">Assigned to:</span>
          <span className="font-bodyFont font-medium text-gray-900">
            {geofence.childId ? geofence.childId.name : 'All Children'}
          </span>
        </div>

        {/* Radius */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bodyFont text-muted">Radius:</span>
          <span className="font-bodyFont font-medium text-gray-900">
            {geofence.radius >= 1000 
              ? `${(geofence.radius / 1000).toFixed(1)} km`
              : `${geofence.radius} m`}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-bodyFont text-muted">Location:</span>
          <span className="font-bodyFont font-medium text-gray-700 text-xs font-mono">
            {geofence.centerLat.toFixed(4)}, {geofence.centerLon.toFixed(4)}
          </span>
        </div>

        {/* Notifications */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-default">
          <div className="flex items-center gap-1.5">
            {geofence.notifyOnEntry ? (
              <>
                <BellIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-bodyFont text-gray-700">Entry alerts</span>
              </>
            ) : (
              <>
                <BellSlashIcon className="h-4 w-4 text-muted" />
                <span className="text-xs font-bodyFont text-muted">No entry alerts</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {geofence.notifyOnExit ? (
              <>
                <BellIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-bodyFont text-gray-700">Exit alerts</span>
              </>
            ) : (
              <>
                <BellSlashIcon className="h-4 w-4 text-muted" />
                <span className="text-xs font-bodyFont text-muted">No exit alerts</span>
              </>
            )}
          </div>
        </div>

        {/* Created Date */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-border-default">
          <span className="font-bodyFont text-muted">Created:</span>
          <span className="font-bodyFont text-gray-700 text-xs">
            {formatDate(geofence.createdAt, 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onEdit(geofence)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg font-bodyFont font-medium text-sm hover:bg-primary/20 transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(geofence)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-error/10 text-error rounded-lg font-bodyFont font-medium text-sm hover:bg-error/20 transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default GeofenceCard;
