import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/solid';

interface PanicSuccessScreenProps {
  latitude: number;
  longitude: number;
  onComplete?: () => void;
}

const PanicSuccessScreen: React.FC<PanicSuccessScreenProps> = ({
  latitude,
  longitude,
  onComplete
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) {
            onComplete();
          } else {
            navigate('/child/dashboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, onComplete]);

  const handleReturnNow = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/child/dashboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-success/20 via-white to-success/10 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-4 animate-scaleIn">
            <CheckCircleIcon className="h-14 w-14 text-success animate-checkmark" />
          </div>
          <h1 className="text-2xl font-themeFont font-bold text-success mb-2">
            Alert Sent Successfully!
          </h1>
          <p className="text-sm font-bodyFont text-gray-600">
            Your parents have been notified
          </p>
        </div>

        {/* Essential Info */}
        <div className="bg-success/10 border border-success/30 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <MapPinIcon className="h-5 w-5 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bodyFont font-medium text-gray-700">Location Shared</div>
              <div className="text-xs font-mono text-gray-500 truncate">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-5 w-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bodyFont font-medium text-gray-700">Parents Notified</div>
              <div className="text-xs text-success font-semibold">Alert delivered</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-success flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bodyFont font-medium text-gray-700">Time</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Safety Reminder */}
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6">
          <p className="text-sm font-bodyFont text-gray-700 text-center">
            Stay safe and keep your phone on. Help is on the way.
          </p>
        </div>

        {/* Auto-return countdown */}
        <div className="text-center">
          <button
            onClick={handleReturnNow}
            className="w-full px-6 py-3 bg-primary text-white rounded-xl font-bodyFont font-semibold hover:bg-primary-hover transition-colors mb-3"
          >
            Return to Dashboard
          </button>
          <p className="text-xs font-bodyFont text-gray-500">
            Auto-returning in {countdown}s
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanicSuccessScreen;
