import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';

interface FormErrorProps {
  message: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message, className }) => {
  if (!message) return null;

  return (
    <div className={cn(
      'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2',
      className
    )}>
      <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default FormError;