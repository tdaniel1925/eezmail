'use client';

/**
 * Sandbox Company Detail Component
 * Comprehensive view with user assignment, usage tracking, and management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  Activity,
  Settings,
  UserPlus,
  Loader2,
  Mail,
  Phone,
  Clock,
  BarChart,
  Shield,
  Key,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SandboxCompany {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'suspended' | 'archived';
  contactEmail?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  unlimitedSms: boolean;
  unlimitedAi: boolean;
  unlimitedStorage: boolean;
  totalSmsUsed: number;
  totalAiTokensUsed: number;
  totalStorageUsed: number;
  twilioAccountSid?: string | null;
  twilioPhoneNumber?: string | null;
  openaiApiKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SandboxUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  createdAt: Date;
}

interface SandboxCompanyDetailProps {
  companyId: string;
}

export function SandboxCompanyDetail({
  companyId,
}: SandboxCompanyDetailProps): JSX.Element {
  const router = useRouter();
  const [company, setCompany] = useState<SandboxCompany | null>(null);
  const [users, setUsers] = useState<SandboxUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SandboxUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'usage' | 'settings'
  >('overview');

  const [editData, setEditData] = useState({
    name: '',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  useEffect(() => {
    fetchCompanyData();
    fetchUsers();
    fetchAvailableUsers();
  }, [companyId]);

  const fetchCompanyData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/sandbox-companies/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      const data = await response.json();
      setCompany(data.company);
      setEditData({
        name: data.company.name,
        description: data.company.description || '',
        contactName: data.company.contactName || '',
        contactEmail: data.company.contactEmail || '',
        contactPhone: data.company.contactPhone || '',
        notes: data.company.notes || '',
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await fetch(
        `/api/admin/sandbox-companies/${companyId}/users`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAvailableUsers = async (): Promise<void> => {
    try {
      const response = await fetch(
        `/api/admin/users?role=sandbox_user&unassigned=true`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `/api/admin/sandbox-companies/${companyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) throw new Error('Failed to update company');

      toast.success('Company updated successfully');
      setIsEditing(false);
      fetchCompanyData();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignUser = async (): Promise<void> => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/sandbox-companies/${companyId}/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUserId }),
        }
      );

      if (!response.ok) throw new Error('Failed to assign user');

      toast.success('User assigned successfully');
      setShowAddUser(false);
      setSelectedUserId('');
      fetchUsers();
      fetchAvailableUsers();
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user');
    }
  };

  const handleRemoveUser = async (userId: string): Promise<void> => {
    if (!confirm('Remove this user from the sandbox company?')) return;

    try {
      const response = await fetch(
        `/api/admin/sandbox-companies/${companyId}/users/${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove user');

      toast.success('User removed successfully');
      fetchUsers();
      fetchAvailableUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {company.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sandbox Company Management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              company.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : company.status === 'suspended'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {company.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'usage', label: 'Usage', icon: BarChart },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Company Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          name: company.name,
                          description: company.description || '',
                          contactName: company.contactName || '',
                          contactEmail: company.contactEmail || '',
                          contactPhone: company.contactPhone || '',
                          notes: company.notes || '',
                        });
                      }}
                      className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Name
                      </p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </p>
                    </div>
                    {company.description && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Description
                        </p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {company.description}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created {formatDistanceToNow(new Date(company.createdAt))}{' '}
                    ago
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h3>
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={editData.contactName}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            contactName: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={editData.contactEmail}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            contactEmail: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editData.contactPhone}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            contactPhone: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {company.contactName && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {company.contactName}
                        </span>
                      </div>
                    )}
                    {company.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a
                          href={`mailto:${company.contactEmail}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {company.contactEmail}
                        </a>
                      </div>
                    )}
                    {company.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`tel:${company.contactPhone}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {company.contactPhone}
                        </a>
                      </div>
                    )}
                    {!company.contactName &&
                      !company.contactEmail &&
                      !company.contactPhone && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No contact information provided
                        </p>
                      )}
                  </>
                )}
              </div>
            </div>

            {/* Credentials Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Service Credentials
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Twilio SMS
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      company.twilioAccountSid
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {company.twilioAccountSid ? 'Configured' : 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      OpenAI API
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      company.openaiApiKey
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {company.openaiApiKey ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SMS Sent
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {company.totalSmsUsed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI Tokens
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {company.totalAiTokensUsed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Storage
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(company.totalStorageUsed / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assigned Users ({users.length})
              </h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                Assign User
              </button>
            </div>

            {showAddUser && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h4 className="mb-3 font-medium text-gray-900 dark:text-white">
                  Add User to Sandbox
                </h4>
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignUser}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddUser(false);
                      setSelectedUserId('');
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              {users.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    No users assigned yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.fullName || user.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Added {formatDistanceToNow(new Date(user.createdAt))}{' '}
                          ago
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      SMS Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {company.totalSmsUsed.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Unlimited
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI Tokens
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {company.totalAiTokensUsed.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Unlimited
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Storage
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(company.totalStorageUsed / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Unlimited
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This sandbox company has unlimited access
                to all services. Usage is tracked for monitoring purposes only.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Company Settings
              </h3>
              <div className="space-y-4">
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Internal Notes
                    </label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      rows={4}
                      placeholder="Add internal notes about this sandbox company..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
                {!isEditing && company.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Internal Notes
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {company.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Danger Zone
              </h3>
              <div className="space-y-3">
                <button className="w-full rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  Suspend Company
                </button>
                <button className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  Delete Company
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
