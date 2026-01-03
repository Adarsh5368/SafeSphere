import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PanicButton from '../../components/panic/PanicButton';
import PanicConfirmationModal from '../../components/panic/PanicConfirmationModal';
import LocationStatusPanel from '../../components/panic/LocationStatusPanel';
import PanicSuccessScreen from '../../components/panic/PanicSuccessScreen';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

const PanicPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, accuracy, error, isLoading } = useGeolocation();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Security: Ensure only CHILD users can access this page
  useEffect(() => {
    if (user && user.userType !== 'CHILD') {
      navigate('/');
    }
  }, [user, navigate]);

  // Trigger vibration if supported
  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]); // Vibrate pattern: 200ms, pause 100ms, 200ms
    }
  };

  const handlePanicButtonClick = () => {
    if (!latitude || !longitude) {
      setApiError('Location is required to send emergency alert. Please wait for GPS signal.');
      return;
    }
    
    triggerVibration();
    setShowConfirmModal(true);
  };

  const handleConfirmPanic = async () => {
    if (!latitude || !longitude) {
      setApiError('Location data unavailable. Cannot send alert.');
      return;
    }

    setIsProcessing(true);
    setApiError(null);

    try {
      await api.post(API_ENDPOINTS.PANIC_ALERT, {
        latitude,
        longitude,
        message: 'Emergency SOS Alert - Immediate assistance required'
      });

      // Success - show success screen
      triggerVibration();
      setShowConfirmModal(false);
      setShowSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send emergency alert';
      
      // Check for rate limit
      if (err.response?.status === 429) {
        setApiError('⏱️ Too many alerts sent recently. Please wait a moment before trying again.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setApiError('🔒 Authentication error. Please log in again.');
      } else {
        setApiError(`❌ ${errorMessage}`);
      }
      
      console.error('Panic alert error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPanic = () => {
    setShowConfirmModal(false);
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    navigate('/child/dashboard');
  };

  if (!user || user.userType !== 'CHILD') {
    return null; // Will redirect via useEffect
  }

  if (showSuccess && latitude && longitude) {
    return (
      <PanicSuccessScreen
        latitude={latitude}
        longitude={longitude}
        onComplete={handleSuccessComplete}
      />
    );
  }

  return (
    <MainLayout>
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-error/5 via-white to-error/10">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center px-6 py-4 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-2 px-4 py-2 bg-error/10 rounded-lg">
            <ShieldExclamationIcon className="h-5 w-5 text-error" />
            <span className="text-base font-bodyFont font-semibold text-error">Emergency SOS System</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Page Title */}
            <div className="flex-shrink-0 text-center mb-4">
              <p className="text-base font-bodyFont text-gray-600">
                Press the button below to instantly alert your parents with your location
              </p>
            </div>

            {/* API Error Alert */}
            {apiError && (
              <div className="flex-shrink-0 mb-4 bg-error/10 border border-error/30 rounded-xl p-4 animate-shake">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bodyFont text-error font-medium">{apiError}</p>
                  </div>
                  <button
                    onClick={() => setApiError(null)}
                    className="text-error hover:text-red-700 text-sm font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 grid lg:grid-cols-[1fr_400px] gap-6 overflow-hidden">
              {/* Left Column - Panic Button & Location */}
              <div className="space-y-4 flex flex-col justify-center">
                {/* Location Status */}
                <LocationStatusPanel
                  latitude={latitude}
                  longitude={longitude}
                  accuracy={accuracy}
                  isLoading={isLoading}
                  error={error}
                />

                {/* Panic Button */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
                  <PanicButton
                    onClick={handlePanicButtonClick}
                    disabled={!latitude || !longitude || isLoading || !!error}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>

              {/* Right Column - Information */}
              <div className="space-y-4">
                {/* When to Use */}
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-5">
                  <h3 className="font-bodyFont font-semibold text-primary text-base mb-3 flex items-center gap-2">
                    <ShieldExclamationIcon className="h-5 w-5" />
                    When to Use
                  </h3>
                  <ul className="text-sm font-bodyFont text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>You feel unsafe or threatened</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>You're lost or need help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>Medical emergency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>Need immediate assistance</span>
                    </li>
                  </ul>
                </div>

                {/* What Happens */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bodyFont font-semibold text-gray-900 mb-3 text-base">
                    📱 What Happens
                  </h3>
                  <ul className="text-sm font-bodyFont text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      <span>Parents get instant notification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      <span>Your GPS location is sent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      <span>Trusted contacts are alerted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">4.</span>
                      <span>Alert is logged in system</span>
                    </li>
                  </ul>
                </div>

                {/* Important Note */}
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                  <p className="text-xs font-bodyFont text-gray-700">
                    <strong className="text-warning">⚠️ Important:</strong> For life-threatening emergencies, call 911 immediately. This SOS alerts your family network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <PanicConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmPanic}
        onCancel={handleCancelPanic}
        isProcessing={isProcessing}
      />
    </MainLayout>
  );
};

export default PanicPage;
