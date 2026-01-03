import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input, Button, FormError } from '../../components/ui';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    familyCode: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { login, error, isLoading, clearError } = useAuth();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.familyCode && !/^[A-Za-z0-9]{6,12}$/.test(formData.familyCode)) {
      errors.familyCode = 'Family code must be 6-12 alphanumeric characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      await login(formData.email, formData.password, formData.familyCode || undefined);
      // Navigation will be handled by the auth context and routing
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your Safe Sphere account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <FormError message={error} />}

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange}
          error={validationErrors.email}
          icon={<EnvelopeIcon className="w-5 h-5" />}
          autoComplete="email"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange}
          error={validationErrors.password}
          icon={<LockClosedIcon className="w-5 h-5" />}
          autoComplete="current-password"
          required
        />

        <Input
          id="familyCode"
          name="familyCode"
          type="text"
          label="Family Code (Child only)"
          placeholder="Enter family code if you're a child"
          value={formData.familyCode}
          onChange={handleInputChange}
          error={validationErrors.familyCode}
          autoComplete="off"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-border-default rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm font-bodyFont text-gray-700">
              Remember me
            </label>
          </div>

          <Link 
            to="/forgot-password" 
            className="text-sm font-bodyFont font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm font-bodyFont text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;