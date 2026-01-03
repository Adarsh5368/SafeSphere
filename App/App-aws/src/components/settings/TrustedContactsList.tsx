import React, { useState } from 'react';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface TrustedContact {
  name: string;
  phone: string;
  email?: string;
}

interface TrustedContactsListProps {
  contacts: TrustedContact[];
  onEdit?: (contact: TrustedContact, index: number) => void;
  onRemove: (index: number) => Promise<void>;
  loading?: boolean;
}

const TrustedContactsList: React.FC<TrustedContactsListProps> = ({
  contacts,
  onEdit,
  onRemove,
  loading = false
}) => {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  const handleRemove = async (index: number) => {
    setRemovingIndex(index);
    try {
      await onRemove(index);
      setShowConfirm(null);
    } catch (err) {
      console.error('Failed to remove contact:', err);
    } finally {
      setRemovingIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border-default rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-surface border border-border-default rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/10 rounded-full mb-4">
          <UserGroupIcon className="h-8 w-8 text-warning" />
        </div>
        <h3 className="text-lg font-themeFont font-semibold text-gray-900 mb-2">
          No Trusted Contacts Yet
        </h3>
        <p className="text-sm font-bodyFont text-muted max-w-md mx-auto">
          Add at least one trusted contact for safety. They'll be notified during emergency situations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact, index) => (
        <div key={index} className="bg-surface border border-border-default rounded-xl p-4 hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-7 w-7 text-primary" />
            </div>

            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bodyFont font-semibold text-gray-900 mb-2">
                {contact.name}
              </h4>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bodyFont text-gray-700">
                  <PhoneIcon className="h-4 w-4 text-muted flex-shrink-0" />
                  <span className="truncate">{contact.phone}</span>
                </div>
                
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm font-bodyFont text-gray-700">
                    <EnvelopeIcon className="h-4 w-4 text-muted flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => onEdit(contact, index)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  title="Edit contact"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowConfirm(index)}
                className="p-2 text-error hover:bg-error/10 rounded-xl transition-colors"
                title="Remove contact"
                disabled={removingIndex === index}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Confirm Delete */}
          {showConfirm === index && (
            <div className="mt-4 p-3 bg-error/5 border border-error/30 rounded-xl">
              <p className="text-sm font-bodyFont text-gray-900 mb-3">
                Remove <strong>{contact.name}</strong> from trusted contacts?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bodyFont font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  disabled={removingIndex === index}
                  className="flex-1 px-3 py-1.5 bg-error text-white rounded-lg text-sm font-bodyFont font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {removingIndex === index ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrustedContactsList;
