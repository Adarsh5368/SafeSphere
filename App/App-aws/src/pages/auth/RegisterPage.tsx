import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input, Button, FormError } from '../../components/ui';

interface FormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { signup, error, isLoading, clearError } = useAuth();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const signupData = {
        email: formData.email,
        name: formData.name.trim(),
        password: formData.password,
        userType: 'PARENT' as const,
        phone: formData.phone,
      };

      await signup(signupData);
      // Navigation will be handled by the auth context and routing
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <AuthLayout 
      title="Create parent account"
      subtitle="Register to start protecting your family"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <FormError message={error} />}

        <Input
          id="name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange}
          error={validationErrors.name}
          icon={<UserIcon className="w-5 h-5" />}
          autoComplete="name"
          required
        />

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
          id="phone"
          name="phone"
          type="tel"
          label="Phone Number"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleInputChange}
          error={validationErrors.phone}
          icon={<PhoneIcon className="w-5 h-5" />}
          autoComplete="tel"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleInputChange}
          error={validationErrors.password}
          icon={<LockClosedIcon className="w-5 h-5" />}
          autoComplete="new-password"
          required
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={validationErrors.confirmPassword}
          icon={<LockClosedIcon className="w-5 h-5" />}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full"
        >
          Create Parent Account
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm font-bodyFont text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;