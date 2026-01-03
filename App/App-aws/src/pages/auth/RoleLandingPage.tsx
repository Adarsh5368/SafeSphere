import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';

const RoleLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'parent' | 'child') => {
    navigate(`/auth/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-themeFont font-bold text-gray-900 mb-4">
            Welcome to Safe Sphere
          </h1>
          <p className="text-lg md:text-xl font-bodyFont text-muted">
            Keep your family safe and connected
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Parent Card */}
          <button
            onClick={() => handleRoleSelect('parent')}
            className="group bg-surface rounded-2xl border-2 border-border-default hover:border-primary p-8 md:p-10 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 group-hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors">
                <UserGroupIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-themeFont font-bold text-gray-900 mb-3">
                  I'm a Parent
                </h2>
                <p className="text-base font-bodyFont text-muted">
                  Monitor and protect your children's safety
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-primary font-bodyFont font-medium group-hover:gap-3 transition-all">
                  Continue as Parent
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {/* Child Card */}
          <button
            onClick={() => handleRoleSelect('child')}
            className="group bg-surface rounded-2xl border-2 border-border-default hover:border-accent p-8 md:p-10 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-accent/10 group-hover:bg-accent/20 rounded-full flex items-center justify-center transition-colors">
                <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-themeFont font-bold text-gray-900 mb-3">
                  I'm a Child
                </h2>
                <p className="text-base font-bodyFont text-muted">
                  Stay connected with your family
                </p>
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-accent font-bodyFont font-medium group-hover:gap-3 transition-all">
                  Continue as Child
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm font-bodyFont text-muted">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleLandingPage;
