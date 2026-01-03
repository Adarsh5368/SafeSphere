import React, { useState } from 'react';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import {
  XMarkIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: () => void;
}

interface ChildCredentials {
  email: string;
  password: string;
}

const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose, onChildAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [childCredentials, setChildCredentials] = useState<ChildCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'email' | 'password' | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name.trim()
      };

      // Only add age if provided and valid
      if (formData.age && !isNaN(parseInt(formData.age))) {
        payload.age = parseInt(formData.age);
      }

      const response = await api.post(API_ENDPOINTS.CREATE_CHILD, payload);
      
      setChildCredentials(response.data.data.credentials);
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create child account');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', age: '' });
    setError(null);
    setStep('form');
    setChildCredentials(null);
    setShowPassword(false);
    setCopied(null);
    onClose();
  };

  const handleFinish = () => {
    onChildAdded();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-2xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlusIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-themeFont font-semibold text-gray-900">
                {step === 'form' ? 'Add New Child' : 'Child Added Successfully!'}
              </h2>
              <p className="text-xs font-bodyFont text-muted">
                {step === 'form' 
                  ? 'Create a new account for your child' 
                  : 'Save these login credentials'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close modal"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {step === 'form' ? (
          // Form Step
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-error text-sm font-bodyFont">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div>
                <label htmlFor="name" className="block text-sm font-bodyFont font-medium text-gray-700 mb-1.5">
                  Child's Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg text-sm font-bodyFont focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter child's full name"
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-bodyFont font-medium text-gray-700 mb-1.5">
                  Age (Optional)
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="1"
                  max="17"
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg text-sm font-bodyFont focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter age (1-17)"
                />
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 mb-5">
              <h4 className="text-primary font-bodyFont font-medium text-xs mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                What happens next?
              </h4>
              <ul className="text-primary/80 font-bodyFont text-xs space-y-1 pl-6">
                <li>• Unique login credentials will be generated</li>
                <li>• Child can log in with provided email & password</li>
                <li>• Location tracking will be automatically enabled</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-bodyFont font-medium text-sm hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bodyFont font-medium text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        ) : (
          // Success Step
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="mx-auto w-14 h-14 bg-success/20 rounded-full flex items-center justify-center mb-3">
                <CheckIcon className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-lg font-themeFont font-semibold text-gray-900 mb-1.5">Account Created!</h3>
              <p className="text-sm font-bodyFont text-muted">
                Share these credentials with {formData.name}
              </p>
            </div>

            {childCredentials && (
              <div className="space-y-3.5 mb-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bodyFont font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={childCredentials.email}
                      readOnly
                      aria-label="Generated email address"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-border-default rounded-lg text-sm font-mono text-gray-700"
                    />
                    <button
                      onClick={() => copyToClipboard(childCredentials.email, 'email')}
                      className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      title="Copy email"
                    >
                      {copied === 'email' ? (
                        <CheckIcon className="h-4 w-4 text-success" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bodyFont font-medium text-gray-700 mb-1.5">
                    Temporary Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={childCredentials.password}
                      readOnly
                      aria-label="Generated password"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-border-default rounded-lg text-sm font-mono text-gray-700"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(childCredentials.password, 'password')}
                      className="p-2 text-muted hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                      title="Copy password"
                    >
                      {copied === 'password' ? (
                        <CheckIcon className="h-4 w-4 text-success" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3.5 mb-5">
              <h4 className="text-warning font-bodyFont font-medium text-xs mb-1.5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Important
              </h4>
              <ul className="text-gray-600 font-bodyFont text-xs space-y-1 pl-6">
                <li>• Save credentials - won't be shown again</li>
                <li>• Child should change password after first login</li>
                <li>• Email is auto-generated and unique</li>
              </ul>
            </div>

            <button
              onClick={handleFinish}
              className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bodyFont font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddChildModal;