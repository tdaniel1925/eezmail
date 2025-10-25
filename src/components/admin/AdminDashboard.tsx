'use client';

/**
 * Admin Dashboard Component
 * Main UI for managing sandbox companies and users
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Plus,
  Search,
  Filter,
  Settings,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { type AdminUser } from '@/lib/auth/admin-auth';
import { toast } from 'sonner';
import { CreateSandboxCompanyModal } from './CreateSandboxCompanyModal';
import { SandboxCompanyCard } from './SandboxCompanyCard';

interface SandboxCompany {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'suspended' | 'archived';
  contactEmail?: string | null;
  contactName?: string | null;
  totalSmsUsed: number;
  totalAiTokensUsed: number;
  createdAt: Date;
}

interface AdminDashboardProps {
  user: AdminUser;
}

export function AdminDashboard({ user }: AdminDashboardProps): JSX.Element {
  const [companies, setCompanies] = useState<SandboxCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch sandbox companies
  const fetchCompanies = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/sandbox-companies?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load sandbox companies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [searchQuery, statusFilter]);

  const handleCompanyCreated = (): void => {
    setShowCreateModal(false);
    fetchCompanies();
    toast.success('Sandbox company created successfully');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage sandbox companies and users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Companies
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {companies.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {companies.filter((c) => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Suspended
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {companies.filter((c) => c.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
              <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Archived
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {companies.filter((c) => c.status === 'archived').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          New Company
        </button>
      </div>

      {/* Company List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Building2 className="mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            No sandbox companies yet
          </p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Create your first sandbox company to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Company
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <SandboxCompanyCard
              key={company.id}
              company={company}
              onUpdate={fetchCompanies}
            />
          ))}
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <CreateSandboxCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCompanyCreated}
        />
      )}
    </div>
  );
}

