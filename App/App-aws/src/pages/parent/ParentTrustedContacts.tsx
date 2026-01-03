import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import TrustedContactForm from '../../components/settings/TrustedContactForm';
import TrustedContactsList from '../../components/settings/TrustedContactsList';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TrustedContact {
  name: string;
  phone: string;
  email?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  trustedContacts?: TrustedContact[];
}

const ParentTrustedContacts: React.FC = () => {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<{ contact: TrustedContact; index: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user profile with trusted contacts
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.USER_PROFILE);
      const profile: UserProfile = response.data.data.user;
      setContacts(profile.trustedContacts || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load trusted contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update trusted contacts on backend
  const updateContacts = async (updatedContacts: TrustedContact[]) => {
    setError(null);
    setSuccess(null);

    try {
      await api.patch(API_ENDPOINTS.TRUSTED_CONTACTS, {
        trustedContacts: updatedContacts
      });
      
      setContacts(updatedContacts);
      setSuccess('Trusted contacts updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update trusted contacts');
      throw err;
    }
  };

  const handleAddContact = async (contact: TrustedContact) => {
    const updatedContacts = [...contacts, contact];
    await updateContacts(updatedContacts);
    setIsModalOpen(false);
  };

  const handleUpdateContact = async (contact: TrustedContact) => {
    if (editingContact === null) return;
    
    const updatedContacts = [...contacts];
    updatedContacts[editingContact.index] = contact;
    await updateContacts(updatedContacts);
    setEditingContact(null);
    setIsModalOpen(false);
  };

  const handleRemoveContact = async (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    await updateContacts(updatedContacts);
  };

  const handleEditContact = (contact: TrustedContact, index: number) => {
    setEditingContact({ contact, index });
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setIsModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-surface rounded-xl border border-border-default p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldCheckIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-themeFont font-semibold text-gray-900">
                Trusted Contacts
              </h1>
              <p className="text-sm font-bodyFont text-muted">
                Manage your emergency circle - they'll be notified during panic alerts
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 animate-slideUp">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bodyFont text-success font-medium">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-success hover:text-green-700"
                title="Dismiss"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 animate-shake">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bodyFont font-semibold text-error mb-1">Error</h3>
                <p className="text-sm font-bodyFont text-gray-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-error hover:text-red-700"
                title="Dismiss error"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <h3 className="font-bodyFont font-semibold text-primary mb-2 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5" />
            What are Trusted Contacts?
          </h3>
          <ul className="text-sm font-bodyFont text-gray-700 space-y-1 ml-7 list-disc">
            <li>They receive instant notifications when your child triggers a <strong>PANIC alert</strong></li>
            <li>They get the child's <strong>exact GPS location</strong> during emergencies</li>
            <li>Recommended: Add family members, close friends, or neighbors</li>
            <li>All contacts are verified and stored securely</li>
          </ul>
        </div>

        {/* Contacts List */}
        <div className="bg-surface rounded-xl border border-border-default p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-themeFont font-semibold text-gray-900">
                Your Trusted Contacts
              </h3>
              <p className="text-xs font-bodyFont text-muted mt-1">
                {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} in your emergency circle
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bodyFont font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>

          <TrustedContactsList
            contacts={contacts}
            onEdit={handleEditContact}
            onRemove={handleRemoveContact}
            loading={loading}
          />

          {contacts.length > 0 && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl">
              <p className="text-xs font-bodyFont text-warning">
                ⚠️ <strong>Note:</strong> Changes are saved immediately. Make sure all contact information is accurate.
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={handleCancelEdit}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-themeFont font-bold text-gray-900">
                    {editingContact ? 'Edit Trusted Contact' : 'Add Trusted Contact'}
                  </h2>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Close"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <TrustedContactForm
                  onSubmit={editingContact ? handleUpdateContact : handleAddContact}
                  initialData={editingContact?.contact}
                  onCancel={handleCancelEdit}
                  isEditing={!!editingContact}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default ParentTrustedContacts;
