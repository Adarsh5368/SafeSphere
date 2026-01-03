import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Route Guards
import PublicRoute from './PublicRoute';
import ParentRoute from './ParentRoute';
import ChildRoute from './ChildRoute';

// Auth Pages
import RoleLandingPage from '../pages/auth/RoleLandingPage';
import ParentLoginPage from '../pages/auth/ParentLoginPage';
import ChildLoginPage from '../pages/auth/ChildLoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Parent Pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentChildren from '../pages/parent/ParentChildren';
import LiveMap from '../pages/parent/LiveMap';
import ParentGeofences from '../pages/parent/ParentGeofences';
import ParentAlerts from '../pages/parent/ParentAlerts';
import ParentHistory from '../pages/parent/ParentHistory';
import ParentTrustedContacts from '../pages/parent/ParentTrustedContacts';
import ParentSimulator from '../pages/parent/ParentSimulator';

// Child Pages
import ChildDashboard from '../pages/child/ChildDashboard';
import PanicPage from '../pages/child/PanicPage';
import ChildLocation from '../pages/child/ChildLocation';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root - Role Selection Landing Page */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <RoleLandingPage />
              </PublicRoute>
            } 
          />

          {/* Role-Specific Auth Routes */}
          <Route 
            path="/auth/parent" 
            element={
              <PublicRoute>
                <ParentLoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/auth/child" 
            element={
              <PublicRoute>
                <ChildLoginPage />
              </PublicRoute>
            } 
          />

          {/* Legacy Routes (kept for backward compatibility) */}
          <Route 
            path="/login" 
            element={<Navigate to="/" replace />}
          />
          <Route 
            path="/register" 
            element={<Navigate to="/auth/parent" replace />}
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password/:token" 
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            } 
          />

          {/* Parent Routes */}
          <Route 
            path="/parent/dashboard" 
            element={
              <ParentRoute>
                <ParentDashboard />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/children" 
            element={
              <ParentRoute>
                <ParentChildren />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/map" 
            element={
              <ParentRoute>
                <LiveMap />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/geofences" 
            element={
              <ParentRoute>
                <ParentGeofences />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/alerts" 
            element={
              <ParentRoute>
                <ParentAlerts />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/history" 
            element={
              <ParentRoute>
                <ParentHistory />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/trusted-contacts" 
            element={
              <ParentRoute>
                <ParentTrustedContacts />
              </ParentRoute>
            } 
          />
          <Route 
            path="/parent/simulator" 
            element={
              <ParentRoute>
                <ParentSimulator />
              </ParentRoute>
            } 
          />

          {/* Child Routes */}
          <Route 
            path="/child/dashboard" 
            element={
              <ChildRoute>
                <ChildDashboard />
              </ChildRoute>
            } 
          />
          <Route 
            path="/child/panic" 
            element={
              <ChildRoute>
                <PanicPage />
              </ChildRoute>
            } 
          />
          <Route 
            path="/child/location" 
            element={
              <ChildRoute>
                <ChildLocation />
              </ChildRoute>
            } 
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;