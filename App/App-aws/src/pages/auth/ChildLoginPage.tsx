import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface ChildLoginFormData {
  email: string;
  password: string;
  familyCode: string;
}

const ChildLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmitting = React.useRef(false);

  const [formData, setFormData] = useState<ChildLoginFormData>({
    email: '',
    password: '',
    familyCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting.current || isLoading) return;
    
    setError('');

    // Validation
    if (!formData.familyCode || formData.familyCode.length < 6 || formData.familyCode.length > 12) {
      setError('Family code must be between 6 and 12 characters');
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);

    try {
      await login(formData.email, formData.password, formData.familyCode);
      navigate('/child/dashboard');
    } catch (err: unknown) {
      setError((err as any).response?.data?.message || 'Login failed. Please check your credentials and family code.');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-muted hover:text-gray-900 font-bodyFont mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to role selection
        </button>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border-default shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-themeFont font-bold text-gray-900 mb-2">
              Child Portal
            </h1>
            <p className="text-base font-bodyFont text-muted">
              Sign in to your account
            </p>
          </div>

          {/* Info Box */}
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-lg flex gap-3">
            <InformationCircleIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm font-bodyFont text-gray-700">
              <p className="font-medium mb-1">Need an account?</p>
              <p className="text-muted">Child accounts are created by parents. Ask your parent to add you to their family.</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm font-bodyFont text-danger">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email and Family Code - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="child@example.com"
                  helperText="Provided by your parent"
                />
                <Input
                  type="text"
                  label="Family Code"
                  value={formData.familyCode}
                  onChange={(e) => setFormData({ ...formData, familyCode: e.target.value })}
                  required
                  placeholder="ABC123XYZ"
                  helperText="6-12 characters"
                  maxLength={12}
                />
              </div>

              {/* Password - Full Width */}
              <Input
                type="password"
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="12-character password"
                helperText="The password provided by your parent (12 characters)"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm font-bodyFont text-muted">
            By continuing, you agree to our{' '}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChildLoginPage;
