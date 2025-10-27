'use client';

/**
 * Create Sandbox Company Modal
 * Simplified - Uses system credentials from .env.local
 */

import { useState, FormEvent, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

interface CreateSandboxCompanyModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface FormData {
  name: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  contactEmail?: string;
}

export function CreateSandboxCompanyModal({
  onClose,
  onSuccess,
  onError,
}: CreateSandboxCompanyModalProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  // Validate form
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Company name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Company name must be less than 100 characters';
    }

    if (
      formData.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    ) {
      newErrors.contactEmail = 'Invalid email address';
    }

    return newErrors;
  };

  // Validate on change
  useEffect(() => {
    const newErrors = validateForm();
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      contactEmail: true,
    });

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/sandbox-companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create sandbox company');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating sandbox company:', error);
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to create sandbox company'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (fieldName: string): void => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <h2
            id="modal-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Create Sandbox Company
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto px-6 py-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Company Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  required
                  placeholder="Acme Corporation"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                    errors.name && touched.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                  }`}
                  aria-invalid={errors.name && touched.name ? 'true' : 'false'}
                  aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                />
                {errors.name && touched.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description of the company and testing purpose..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    onBlur={() => handleBlur('contactEmail')}
                    placeholder="john@acme.com"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                      errors.contactEmail && touched.contactEmail
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                    }`}
                    aria-invalid={
                      errors.contactEmail && touched.contactEmail ? 'true' : 'false'
                    }
                    aria-describedby={
                      errors.contactEmail && touched.contactEmail
                        ? 'contactEmail-error'
                        : undefined
                    }
                  />
                  {errors.contactEmail && touched.contactEmail && (
                    <p
                      id="contactEmail-error"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.contactEmail}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* System Credentials Info */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                    🔑 System Credentials (Automatic)
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Sandbox companies automatically use the Twilio and OpenAI
                    credentials from your{' '}
                    <code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-800">
                      .env.local
                    </code>{' '}
                    file. All sandbox users share these credentials.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li>• TWILIO_ACCOUNT_SID - SMS services</li>
                    <li>• TWILIO_AUTH_TOKEN - SMS authentication</li>
                    <li>• TWILIO_PHONE_NUMBER - Outbound SMS</li>
                    <li>• OPENAI_API_KEY - AI features</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Admin Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Internal notes about this sandbox company..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
