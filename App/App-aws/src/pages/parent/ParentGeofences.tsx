import React, { useState, useEffect } from 'react';
import { PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import GeofenceCard from '../../components/geofence/GeofenceCard';
import GeofenceFormModal from '../../components/geofence/GeofenceFormModal';
import GeofenceDeleteDialog from '../../components/geofence/GeofenceDeleteDialog';
import GeofenceSkeleton from '../../components/geofence/GeofenceSkeleton';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import type { GeofenceFormData } from '../../components/geofence/GeofenceFormModal';

interface Child {
  _id: string;
  name: string;
  email: string;
}

interface Geofence {
  _id: string;
  name: string;
  childId?: {
    _id: string;
    name: string;
  } | null;
  centerLat: number;
  centerLon: number;
  radius: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  isActive: boolean;
  createdAt: string;
}

const ParentGeofences: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [deletingGeofence, setDeletingGeofence] = useState<Geofence | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [geofencesRes, childrenRes] = await Promise.all([
        api.get(API_ENDPOINTS.GEOFENCES),
        api.get(API_ENDPOINTS.FAMILY)
      ]);
      
      setGeofences(geofencesRes.data.data.geofences || []);
      setChildren(childrenRes.data.data.children || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load geofences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFormModal = (geofence?: Geofence) => {
    if (geofence) {
      setEditingGeofence(geofence);
    } else {
      setEditingGeofence(null);
    }
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingGeofence(null);
  };

  const handleFormSubmit = async (formData: GeofenceFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name,
        childId: formData.assignedTo,
        centerLat: formData.centerLat,
        centerLon: formData.centerLon,
        radius: formData.radius,
        notifyOnEntry: formData.notifyOnEntry,
        notifyOnExit: formData.notifyOnExit
      };

      if (editingGeofence) {
        // Update existing geofence
        await api.patch(API_ENDPOINTS.GEOFENCE_BY_ID(editingGeofence._id), payload);
        setSuccessMessage('Safe zone updated successfully');
      } else {
        // Create new geofence
        await api.post(API_ENDPOINTS.GEOFENCES, payload);
        setSuccessMessage('Safe zone created successfully');
      }

      handleCloseFormModal();
      await fetchData();
    } catch (err: any) {
      console.error('Error saving geofence:', err);
      setError(err.response?.data?.message || 'Failed to save safe zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (geofence: Geofence) => {
    setDeletingGeofence(geofence);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingGeofence(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingGeofence) return;

    try {
      setIsDeleting(true);
      setError(null);

      await api.delete(API_ENDPOINTS.GEOFENCE_BY_ID(deletingGeofence._id));
      
      setSuccessMessage('Safe zone deleted successfully');
      handleCloseDeleteDialog();
      await fetchData();
    } catch (err: any) {
      console.error('Error deleting geofence:', err);
      setError(err.response?.data?.message || 'Failed to delete safe zone');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-themeFont font-bold text-text-primary mb-2">
            Safe Zones
          </h1>
          <p className="text-text-secondary font-bodyFont">
            Create and manage geofences to monitor when your children enter or leave specific locations
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Geofence Button */}
        <button
          onClick={() => handleOpenFormModal()}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bodyFont font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Add Safe Zone
        </button>

        {/* Geofences Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <GeofenceSkeleton key={index} />
            ))}
          </div>
        ) : geofences.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border-default p-12 text-center">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPinIcon className="w-10 h-10 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-themeFont font-semibold text-text-primary mb-2">
              No Safe Zones Yet
            </h3>
            <p className="text-text-secondary font-bodyFont mb-6 max-w-md mx-auto">
              Create your first safe zone to receive notifications when your children enter or leave important locations like home, school, or friends' houses.
            </p>
            <button
              onClick={() => handleOpenFormModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bodyFont font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Create Safe Zone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {geofences.map((geofence) => (
              <GeofenceCard
                key={geofence._id}
                geofence={geofence}
                onEdit={() => handleOpenFormModal(geofence)}
                onDelete={() => handleOpenDeleteDialog(geofence)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <GeofenceFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          onSubmit={handleFormSubmit}
          children={children}
          editingGeofence={editingGeofence}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Delete Dialog */}
      {isDeleteDialogOpen && deletingGeofence && (
        <GeofenceDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          geofence={deletingGeofence}
          isDeleting={isDeleting}
        />
      )}
    </MainLayout>
  );
};

export default ParentGeofences;