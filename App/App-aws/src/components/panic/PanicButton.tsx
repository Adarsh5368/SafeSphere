import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface PanicButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const PanicButton: React.FC<PanicButtonProps> = ({ onClick, disabled, isProcessing }) => {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className={`
          relative w-48 h-48 rounded-full bg-error text-white
          flex flex-col items-center justify-center
          shadow-2xl transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${!disabled && !isProcessing ? 'hover:scale-105 active:scale-95 animate-pulse-slow' : ''}
          ${isProcessing ? 'animate-shake' : ''}
        `}
        aria-label="Emergency SOS Button"
      >
        {/* Ripple effect */}
        {!disabled && !isProcessing && (
          <>
            <span className="absolute inset-0 rounded-full bg-error animate-ping opacity-30"></span>
            <span className="absolute inset-0 rounded-full bg-error animate-pulse opacity-20"></span>
          </>
        )}
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <ExclamationTriangleIcon className="h-16 w-16 mb-3 drop-shadow-lg" />
          <span className="text-3xl font-themeFont font-bold tracking-wider drop-shadow-lg">
            {isProcessing ? 'SENDING' : 'SOS'}
          </span>
          <span className="text-xs font-bodyFont mt-1 opacity-90">
            {isProcessing ? 'Please wait...' : 'Press for Help'}
          </span>
        </div>
      </button>
      
      <p className="mt-6 text-center font-bodyFont text-sm text-gray-600 max-w-xs">
        <span className="text-error font-semibold">⚠️ Emergency use only</span>
      </p>
    </div>
  );
};

export default PanicButton;
