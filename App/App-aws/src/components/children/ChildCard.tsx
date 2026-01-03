import React, { useState } from 'react';
import {
  UserIcon,
  CalendarIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Child {
  _id: string;
  name: string;
  email: string;
  age?: number;
  userType: string;
  createdAt: string;
  isActive: boolean;
  lastLogin?: string;
}

interface ChildCardProps {
  child: Child;
  onDeactivate: (childId: string) => Promise<void>;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onDeactivate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await onDeactivate(child._id);
      setShowConfirmDialog(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to deactivate child:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (isActive: boolean, lastLogin?: string) => {
    if (!isActive) return 'bg-gray-500';
    
    if (lastLogin) {
      const loginDate = new Date(lastLogin);
      const now = new Date();
      const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) return 'bg-green-500'; // Online recently
      if (diffHours < 24) return 'bg-yellow-500'; // Active today
      return 'bg-orange-500'; // Inactive
    }
    
    return 'bg-gray-500'; // Never logged in
  };

  const getStatusText = (isActive: boolean, lastLogin?: string) => {
    if (!isActive) return 'Inactive';
    
    if (lastLogin) {
      const loginDate = new Date(lastLogin);
      const now = new Date();
      const diffHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 1) return 'Online recently';
      if (diffHours < 24) return 'Active today';
      if (diffHours < 168) return `${Math.floor(diffHours / 24)} days ago`;
      return 'Inactive';
    }
    
    return 'Never logged in';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
        {/* Menu Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Child menu options"
            title="More options"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  // TODO: Navigate to child details
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4" />
                View Details
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  // TODO: Navigate to child location
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <MapPinIcon className="h-4 w-4" />
                View Location
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowConfirmDialog(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Deactivate Account
              </button>
            </div>
          )}
        </div>

        {/* Child Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {getInitials(child.name)}
              </span>
            </div>
            {/* Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(child.isActive, child.lastLogin)}`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{child.name}</h3>
            <p className="text-sm text-gray-500">{getStatusText(child.isActive, child.lastLogin)}</p>
          </div>
        </div>

        {/* Child Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate font-mono text-xs">{child.email}</span>
          </div>
          
          {child.age && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="h-4 w-4 flex-shrink-0" />
              <span>{child.age} years old</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <span>Added {formatDate(child.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2">
          <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            View Location
          </button>
          <button className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Send Message
          </button>
        </div>

        {/* Inactive Overlay */}
        {!child.isActive && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-xl flex items-center justify-center">
            <div className="text-center p-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">Account Deactivated</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Deactivation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deactivate Child Account</h3>
                <p className="text-sm text-gray-500">This action can be reversed later</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to deactivate <strong>{child.name}</strong>'s account? 
              They will no longer be able to log in or send location updates until reactivated.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChildCard;