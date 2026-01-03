import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isParent } from '../../utils/roles';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-surface border-b border-border-default z-30">
      <div className="px-6 md:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 lg:hidden">
              <button 
                className="p-2 rounded-xl text-muted hover:text-gray-900 hover:bg-gray-100"
                title="Open menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-on-primary text-base font-themeFont font-bold">SS</span>
              </div>
              <span className="text-xl font-themeFont font-semibold text-gray-900">Safe Sphere</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button 
              className="p-2 rounded-xl text-muted hover:text-gray-900 hover:bg-gray-100 relative"
              title="Notifications"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-4-4V9a6 6 0 00-12 0v4L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-0 right-0 block h-2 w-2 bg-error rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100"
              >
                <div className="h-9 w-9 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-themeFont font-semibold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bodyFont font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs font-bodyFont text-muted">
                    {isParent(user?.userType || 'CHILD') ? 'Parent' : 'Child'}
                  </p>
                </div>
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl border border-border-default shadow-sm">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-sm font-bodyFont text-gray-700 hover:bg-gray-100 rounded-xl mx-1">
                      Profile Settings
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm font-bodyFont text-gray-700 hover:bg-gray-100 rounded-xl mx-1">
                      Account Settings
                    </a>
                    <hr className="my-1 border-border-default" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-bodyFont text-gray-700 hover:bg-gray-100 rounded-xl mx-1"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;