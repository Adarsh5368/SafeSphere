import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isChild } from '../utils/roles';

interface ChildRouteProps {
  children: React.ReactNode;
}

const ChildRoute: React.FC<ChildRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not a child - redirect to parent dashboard
  if (!isChild(user.userType)) {
    return <Navigate to="/parent/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ChildRoute;