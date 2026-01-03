import React, { useState } from 'react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TrustedContact {
  name: string;
  phone: string;
  email?: string;
}

interface TrustedContactFormProps {
  onSubmit: (contact: TrustedContact) => Promise<void>;
  initialData?: TrustedContact;
  onCancel?: () => void;
  isEditing?: boolean;
}

const TrustedContactForm: React.FC<TrustedContactFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<TrustedContact>(
    initialData || { name: '', phone: '', email: '' }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<TrustedContact>>({});

  const validatePhone = (phone: string): boolean => {
    // Basic phone validation: starts with + and has 7-15 digits
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TrustedContact> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone must start with + and country code (e.g., +1234567890)';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined
      });
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({ name: '', phone: '', email: '' });
      }
      setErrors({});
    } catch (err) {
      console.error('Failed to save contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TrustedContact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border-default p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <UserPlusIcon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-themeFont font-semibold text-gray-900">
            {isEditing ? 'Edit Contact' : 'Add Trusted Contact'}
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="Cancel"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-bodyFont font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., John Doe"
            className={`
              w-full px-4 py-2 border rounded-xl font-bodyFont text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.name ? 'border-error' : 'border-border-default'}
            `}
          />
          {errors.name && (
            <p className="mt-1 text-xs font-bodyFont text-error">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-bodyFont font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1234567890"
            className={`
              w-full px-4 py-2 border rounded-xl font-bodyFont text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.phone ? 'border-error' : 'border-border-default'}
            `}
          />
          {errors.phone && (
            <p className="mt-1 text-xs font-bodyFont text-error">{errors.phone}</p>
          )}
          <p className="mt-1 text-xs font-bodyFont text-muted">
            Must include country code (e.g., +1 for USA)
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-bodyFont font-medium text-gray-700 mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@example.com"
            className={`
              w-full px-4 py-2 border rounded-xl font-bodyFont text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              ${errors.email ? 'border-error' : 'border-border-default'}
            `}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-bodyFont text-error">{errors.email}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
          <p className="text-xs font-bodyFont text-primary">
            💡 <strong>Trusted contacts</strong> will be notified during emergency alerts (PANIC) triggered by your children.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bodyFont font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bodyFont font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Contact' : 'Add Contact'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TrustedContactForm;
