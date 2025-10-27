'use client';

/**
 * Sandbox Company Card Component
 * Displays individual sandbox company with actions
 */

import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Users,
  Activity,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Ban,
  Play,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

interface SandboxCompanyCardProps {
  company: SandboxCompany;
  onUpdate: () => void;
  onDelete: () => void;
  onError: (message: string) => void;
}

export function SandboxCompanyCard({
  company,
  onUpdate,
  onDelete,
  onError,
}: SandboxCompanyCardProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const handleStatusChange = async (newStatus: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/sandbox-companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      onError(
        error instanceof Error ? error.message : 'Failed to update company status'
      );
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/sandbox-companies/${company.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete company');
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting company:', error);
      onError(
        error instanceof Error ? error.message : 'Failed to delete company'
      );
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showMenu]);

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Status Badge */}
      <div className="mb-4 flex items-start justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(company.status)}`}
        >
          {company.status}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Open menu"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              role="menu"
            >
              <Link
                href={`/admin/companies/${company.id}`}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                role="menuitem"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
              {company.status === 'active' ? (
                <button
                  onClick={() => handleStatusChange('suspended')}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                  role="menuitem"
                >
                  <Ban className="h-4 w-4" />
                  {isLoading ? 'Suspending...' : 'Suspend'}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  role="menuitem"
                >
                  <Play className="h-4 w-4" />
                  {isLoading ? 'Activating...' : 'Activate'}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                role="menuitem"
              >
                <Trash2 className="h-4 w-4" />
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {company.name}
        </h3>
        {company.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {company.description}
          </p>
        )}
      </div>

      {/* Contact */}
      {company.contactName && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium">{company.contactName}</p>
          {company.contactEmail && <p>{company.contactEmail}</p>}
        </div>
      )}

      {/* Usage Stats */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">SMS Used</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {company.totalSmsUsed.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">AI Tokens</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {company.totalAiTokensUsed.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Created {formatDistanceToNow(new Date(company.createdAt))} ago
        </span>
        <Link
          href={`/admin/companies/${company.id}`}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
