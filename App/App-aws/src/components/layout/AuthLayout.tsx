import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-md space-y-6 overflow-y-auto max-h-full">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-on-primary text-2xl font-themeFont font-bold">SS</span>
            </div>
          </div>
          <h1 className="text-2xl font-themeFont font-semibold text-gray-900">Safe Sphere</h1>
          {title && (
            <h2 className="mt-4 text-xl font-themeFont font-semibold text-gray-900">{title}</h2>
          )}
          {subtitle && (
            <p className="mt-2 text-base font-bodyFont text-muted">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="bg-surface rounded-xl border border-border-default p-6 space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center text-sm font-bodyFont text-muted">
          <p>&copy; 2024 Safe Sphere. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;