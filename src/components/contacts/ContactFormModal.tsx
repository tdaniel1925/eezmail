'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { Contact } from '@/db/schema';

interface ContactFormModalProps {
  contact?: Contact | null; // If provided, we're editing
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<void>;
}

export interface ContactFormData {
  // Basic Info
  firstName: string;
  lastName: string;
  displayName: string;
  nickname: string;

  // Work Info
  company: string;
  jobTitle: string;
  department: string;

  // Contact Methods
  emails: Array<{
    email: string;
    type: 'work' | 'personal' | 'other';
    isPrimary: boolean;
  }>;
  phones: Array<{
    phone: string;
    type: 'mobile' | 'work' | 'home' | 'other';
    isPrimary: boolean;
  }>;

  // Other
  birthday: string;
  notes: string;
  avatarUrl: string;
  isFavorite: boolean;
  tags: string[]; // Array of tag IDs
}

export function ContactFormModal({
  contact,
  isOpen,
  onClose,
  onSave,
}: ContactFormModalProps): JSX.Element | null {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState(contact?.firstName || '');
  const [lastName, setLastName] = useState(contact?.lastName || '');
  const [displayName, setDisplayName] = useState(contact?.displayName || '');
  const [nickname, setNickname] = useState(contact?.nickname || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle || '');
  const [department, setDepartment] = useState(contact?.department || '');
  const [birthday, setBirthday] = useState(
    contact?.birthday
      ? new Date(contact.birthday).toISOString().split('T')[0]
      : ''
  );
  const [notes, setNotes] = useState(contact?.notes || '');
  const [avatarUrl, setAvatarUrl] = useState(contact?.avatarUrl || '');
  const [isFavorite, setIsFavorite] = useState(contact?.isFavorite || false);

  const [emails, setEmails] = useState<
    Array<{
      email: string;
      type: 'work' | 'personal' | 'other';
      isPrimary: boolean;
    }>
  >([{ email: '', type: 'work', isPrimary: true }]);

  const [phones, setPhones] = useState<
    Array<{
      phone: string;
      type: 'mobile' | 'work' | 'home' | 'other';
      isPrimary: boolean;
    }>
  >([{ phone: '', type: 'mobile', isPrimary: true }]);

  if (!isOpen) return null;

  const handleAddEmail = () => {
    setEmails([...emails, { email: '', type: 'work', isPrimary: false }]);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const newEmails = [...emails];
    if (field === 'isPrimary' && value === true) {
      // Only one email can be primary
      newEmails.forEach((e, i) => {
        e.isPrimary = i === index;
      });
    } else {
      (newEmails[index] as any)[field] = value;
    }
    setEmails(newEmails);
  };

  const handleAddPhone = () => {
    setPhones([...phones, { phone: '', type: 'mobile', isPrimary: false }]);
  };

  const handleRemovePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const handlePhoneChange = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const newPhones = [...phones];
    if (field === 'isPrimary' && value === true) {
      // Only one phone can be primary
      newPhones.forEach((p, i) => {
        p.isPrimary = i === index;
      });
    } else {
      (newPhones[index] as any)[field] = value;
    }
    setPhones(newPhones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !firstName &&
      !lastName &&
      !displayName &&
      emails.every((e) => !e.email)
    ) {
      toast.error('Please provide at least a name or email address');
      return;
    }

    // Filter out empty emails and phones
    const validEmails = emails.filter((e) => e.email.trim());
    const validPhones = phones.filter((p) => p.phone.trim());

    if (validEmails.length === 0 && !firstName && !lastName && !displayName) {
      toast.error('Please provide at least one piece of contact information');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        firstName,
        lastName,
        displayName,
        nickname,
        company,
        jobTitle,
        department,
        emails: validEmails,
        phones: validPhones,
        birthday,
        notes,
        avatarUrl,
        isFavorite,
        tags: [],
      });

      // Toast notification handled by parent component
      // Removed duplicate toast to prevent double notifications
      onClose();
    } catch (error) {
      // Only show error toast here (parent won't know about this error)
      toast.error('Failed to save contact');
      console.error('Error saving contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Johnny"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Work Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Software Engineer"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Engineering"
                />
              </div>
            </div>
          </div>

          {/* Email Addresses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Email Addresses
              </h3>
              <button
                type="button"
                onClick={handleAddEmail}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={14} />
                Add Email
              </button>
            </div>
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email.email}
                    onChange={(e) =>
                      handleEmailChange(index, 'email', e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  <select
                    value={email.type}
                    onChange={(e) =>
                      handleEmailChange(index, 'type', e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={email.isPrimary}
                      onChange={(e) =>
                        handleEmailChange(index, 'isPrimary', e.target.checked)
                      }
                      className="rounded"
                    />
                    Primary
                  </label>
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phone Numbers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Phone Numbers
              </h3>
              <button
                type="button"
                onClick={handleAddPhone}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus size={14} />
                Add Phone
              </button>
            </div>
            <div className="space-y-3">
              {phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="tel"
                    value={phone.phone}
                    onChange={(e) =>
                      handlePhoneChange(index, 'phone', e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                  <select
                    value={phone.type}
                    onChange={(e) =>
                      handlePhoneChange(index, 'type', e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={phone.isPrimary}
                      onChange={(e) =>
                        handlePhoneChange(index, 'isPrimary', e.target.checked)
                      }
                      className="rounded"
                    />
                    Primary
                  </label>
                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Other Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Birthday
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Additional notes about this contact..."
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="rounded"
                  />
                  Mark as Favorite
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {isSubmitting
              ? 'Saving...'
              : contact
                ? 'Update Contact'
                : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
