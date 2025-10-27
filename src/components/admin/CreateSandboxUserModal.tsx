'use client';

import { useState } from 'react';
import { X, Loader2, UserPlus, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateSandboxUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userData: {
    id: string;
    username: string;
    password: string;
  }) => void;
}

const ACCOUNT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise' },
];

const ROLES_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  individual: [{ value: 'user', label: 'User' }],
  team: [
    { value: 'team_user', label: 'Team User' },
    { value: 'team_admin', label: 'Team Admin' },
    { value: 'team_super_admin', label: 'Team Super Admin' },
  ],
  enterprise: [
    { value: 'enterprise_user', label: 'Enterprise User' },
    { value: 'enterprise_admin', label: 'Enterprise Admin' },
    { value: 'enterprise_super_admin', label: 'Enterprise Super Admin' },
  ],
};

export function CreateSandboxUserModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSandboxUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'credentials'>('form');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [preferredUsername, setPreferredUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState('individual');
  const [roleHierarchy, setRoleHierarchy] = useState('user');

  // Generated credentials
  const [generatedUser, setGeneratedUser] = useState<{
    id: string;
    username: string;
    password: string;
  } | null>(null);

  // UI state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAccountTypeChange = (type: string) => {
    setAccountType(type);
    // Auto-select first role for the type
    const roles = ROLES_BY_TYPE[type];
    if (roles && roles.length > 0) {
      setRoleHierarchy(roles[0].value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/sandbox-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          preferredUsername: preferredUsername || undefined,
          fullName: fullName || undefined,
          accountType,
          roleHierarchy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create sandbox user');
      }

      setGeneratedUser(data.user);
      setStep('credentials');
      onSuccess?.(data.user);
    } catch (err: any) {
      console.error('Error creating sandbox user:', err);
      setError(err.message || 'Failed to create sandbox user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setStep('form');
    setEmail('');
    setPreferredUsername('');
    setFullName('');
    setAccountType('individual');
    setRoleHierarchy('user');
    setGeneratedUser(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {step === 'form'
                  ? 'Create Sandbox User'
                  : 'User Created Successfully'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step === 'form'
                  ? 'Auto-generated credentials'
                  : 'Save these credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Email <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Used for notifications only
                </p>
              </div>

              {/* Full Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Full Name <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </div>

              {/* Preferred Username (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Preferred Username{' '}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={preferredUsername}
                  onChange={(e) => setPreferredUsername(e.target.value)}
                  placeholder="johndoe"
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Auto-generated if not provided
                </p>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={roleHierarchy}
                  onChange={(e) => setRoleHierarchy(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  {ROLES_BY_TYPE[accountType]?.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Sandbox User
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Sandbox user created successfully! Save these credentials -
                  they won't be shown again.
                </p>
              </div>

              {/* Generated Credentials */}
              {generatedUser && (
                <div className="space-y-3">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Username
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedUser.username}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(generatedUser.username, 'username')
                        }
                        className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {copiedField === 'username' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Temporary Password
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedUser.password}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedUser.password, 'password')
                        }
                        className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      User should change this on first login
                    </p>
                  </div>

                  {/* User ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      User ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedUser.id}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white font-mono text-xs"
                      />
                      <button
                        onClick={() => copyToClipboard(generatedUser.id, 'id')}
                        className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {copiedField === 'id' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
