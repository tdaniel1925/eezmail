'use client';

import { useState } from 'react';
import { User, Lock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  updateAccountSettings,
  changePassword,
  deleteAccount,
} from '@/lib/settings/actions';
import type { User as UserType } from '@/db/schema';

interface AccountSettingsProps {
  user: UserType;
}

export function AccountSettings({ user }: AccountSettingsProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || '',
    email: user.email,
    avatarUrl: user.avatarUrl || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setMessage(null);

    const result = await updateAccountSettings(profileData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error });
      if (result.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(result.errors).forEach(([key, value]) => {
          fieldErrors[key] = value[0];
        });
        setErrors(fieldErrors);
      }
    }

    setIsSubmitting(false);
  };

  const handlePasswordSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setErrors({});
    setMessage(null);

    const result = await changePassword(passwordData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setMessage({ type: 'error', text: result.error });
      if (result.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(result.errors).forEach(([key, value]) => {
          fieldErrors[key] = value[0];
        });
        setErrors(fieldErrors);
      }
    }

    setIsSubmitting(false);
  };

  const handleDeleteAccount = async (): Promise<void> => {
    setIsSubmitting(true);
    const result = await deleteAccount();

    if (result.success) {
      window.location.href = '/';
    } else {
      setMessage({ type: 'error', text: result.error });
      setShowDeleteModal(false);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Manage your profile information and account preferences
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
              : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <User className="h-5 w-5 text-gray-700 dark:text-white/70" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={profileData.fullName}
            onChange={(e) =>
              setProfileData({ ...profileData, fullName: e.target.value })
            }
            error={errors.fullName}
            placeholder="John Doe"
          />

          <Input
            label="Email Address"
            type="email"
            value={profileData.email}
            onChange={(e) =>
              setProfileData({ ...profileData, email: e.target.value })
            }
            error={errors.email}
            placeholder="john@example.com"
            helperText="This is your login email"
          />

          <Input
            label="Avatar URL (optional)"
            type="url"
            value={profileData.avatarUrl}
            onChange={(e) =>
              setProfileData({ ...profileData, avatarUrl: e.target.value })
            }
            error={errors.avatarUrl}
            placeholder="https://example.com/avatar.jpg"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setProfileData({
                  fullName: user.fullName || '',
                  email: user.email,
                  avatarUrl: user.avatarUrl || '',
                });
                setErrors({});
              }}
            >
              Reset
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-gray-700 dark:text-white/70" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Password
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          Change your password to keep your account secure
        </p>

        <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
          Change Password
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Danger Zone
          </h3>
        </div>

        <p className="text-sm text-red-800 dark:text-red-200 mb-4">
          Once you delete your account, there is no going back. This action
          cannot be undone and will permanently delete all your data.
        </p>

        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setErrors({});
        }}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value,
              })
            }
            error={errors.currentPassword}
          />

          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            error={errors.newPassword}
            helperText="Must be at least 8 characters"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              })
            }
            error={errors.confirmPassword}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordSubmit}
              isLoading={isSubmitting}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        description="This action cannot be undone"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-white/80">
            Are you absolutely sure you want to delete your account? All of your
            data will be permanently removed. This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              isLoading={isSubmitting}
            >
              Yes, Delete My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


