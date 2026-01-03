import React from 'react';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';
import { USER_TYPES, type UserType } from '../../utils/constants';

interface RoleSelectorProps {
  selectedRole: UserType | null;
  onRoleSelect: (role: UserType) => void;
  className?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  selectedRole, 
  onRoleSelect, 
  className 
}) => {
  const roles = [
    {
      type: USER_TYPES.PARENT,
      title: 'Parent',
      description: 'Monitor and protect your family',
      icon: UserGroupIcon,
      features: ['Track children\'s locations', 'Set up geofences', 'Receive alerts', 'View history']
    },
    {
      type: USER_TYPES.CHILD,
      title: 'Child',
      description: 'Stay connected with your family',
      icon: UserIcon,
      features: ['Share location safely', 'Send panic alerts', 'Check in with family', 'View geofences']
    }
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.type;
        
        return (
          <button
            key={role.type}
            onClick={() => onRoleSelect(role.type)}
            className={cn(
              'text-left p-6 rounded-lg border-2 transition-all duration-200',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              isSelected 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-center space-x-3 mb-3">
              <Icon className={cn(
                'w-8 h-8',
                isSelected ? 'text-blue-600' : 'text-gray-600'
              )} />
              <h3 className={cn(
                'text-lg font-semibold',
                isSelected ? 'text-blue-900' : 'text-gray-900'
              )}>
                {role.title}
              </h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {role.description}
            </p>
            
            <ul className="space-y-1">
              {role.features.map((feature, index) => (
                <li key={index} className="text-xs text-gray-500 flex items-center">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full mr-2',
                    isSelected ? 'bg-blue-500' : 'bg-gray-400'
                  )} />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;