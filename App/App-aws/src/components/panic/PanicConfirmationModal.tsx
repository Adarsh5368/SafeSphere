import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline';

interface PanicConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const PanicConfirmationModal: React.FC<PanicConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-surface rounded-xl max-w-md w-full shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default bg-error/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error/20 rounded-xl animate-pulse">
              <ExclamationTriangleIcon className="h-8 w-8 text-error" />
            </div>
            <div>
              <h2 className="text-xl font-themeFont font-bold text-error">
                Emergency Alert Confirmation
              </h2>
              <p className="text-sm font-bodyFont text-gray-700">
                This action cannot be undone
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6 text-muted" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-xl">
            <h3 className="font-bodyFont font-semibold text-gray-900 mb-2">
              ⚠️ Are you sure you want to send emergency alert?
            </h3>
            <p className="text-sm text-gray-700 font-bodyFont">
              This will immediately notify:
            </p>
          </div>

          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2 text-sm font-bodyFont text-gray-700">
              <CheckIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Your parents with your <strong>exact GPS location</strong></span>
            </li>
            <li className="flex items-start gap-2 text-sm font-bodyFont text-gray-700">
              <CheckIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>All trusted emergency contacts</span>
            </li>
            <li className="flex items-start gap-2 text-sm font-bodyFont text-gray-700">
              <CheckIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span>Create a <strong>high-priority alert</strong> in the system</span>
            </li>
          </ul>

          <div className="bg-error/5 border border-error/30 rounded-xl p-4">
            <p className="text-error font-bodyFont text-sm font-medium text-center">
              🚨 Only press "Send Alert" if you are in a real emergency situation
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl font-bodyFont font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-error text-white rounded-xl font-bodyFont font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              '✓ Yes - Send Alert'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PanicConfirmationModal;
