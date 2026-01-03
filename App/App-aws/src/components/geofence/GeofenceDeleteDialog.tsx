import React from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Geofence {
  _id: string;
  name: string;
  assignedTo?: {
    _id: string;
    name: string;
  };
}

interface GeofenceDeleteDialogProps {
  isOpen: boolean;
  geofence: Geofence | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

const GeofenceDeleteDialog: React.FC<GeofenceDeleteDialogProps> = ({
  isOpen,
  geofence,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  if (!isOpen || !geofence) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-error" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-themeFont font-semibold text-gray-900 mb-1">
              Delete Safe Zone
            </h3>
            <p className="text-sm font-bodyFont text-muted">
              This action cannot be undone
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isDeleting}
            title="Close"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm font-bodyFont text-gray-700 mb-3">
            Are you sure you want to remove <strong className="text-gray-900">"{geofence.name}"</strong>?
          </p>
          <div className="bg-error/5 border border-error/20 rounded-lg p-3">
            <ul className="text-xs font-bodyFont text-gray-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-error mt-0.5">•</span>
                <span>All monitoring for this zone will stop immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-error mt-0.5">•</span>
                <span>Historical alerts will be preserved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-error mt-0.5">•</span>
                <span>
                  {geofence.assignedTo 
                    ? `${geofence.assignedTo.name} will no longer be tracked in this zone`
                    : 'All children will no longer be tracked in this zone'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-bodyFont font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-error text-white rounded-xl font-bodyFont font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                Delete Safe Zone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeofenceDeleteDialog;
