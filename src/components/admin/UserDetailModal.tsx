'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Mail, Calendar, TrendingUp, Ban, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { getUserDetail, updateUserTier, disableUser, enableUser, deleteUser } from '@/lib/admin/users';
import type { UserDetail } from '@/lib/admin/users';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailModal({ userId, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setIsLoading(true);
    const result = await getUserDetail(userId);
    if (result.success && result.user) {
      setUser(result.user);
    } else {
      toast.error(result.error || 'Failed to load user');
      onClose();
    }
    setIsLoading(false);
  };

  const handleChangeTier = async (tier: string) => {
    if (!confirm(`Change user tier to ${tier}?`)) return;
    
    setActionLoading(true);
    const result = await updateUserTier(userId, tier);
    if (result.success) {
      toast.success('Tier updated successfully');
      loadUser();
    } else {
      toast.error(result.error || 'Failed to update tier');
    }
    setActionLoading(false);
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable this user?')) return;
    
    setActionLoading(true);
    const result = await disableUser(userId);
    if (result.success) {
      toast.success('User disabled successfully');
      loadUser();
    } else {
      toast.error(result.error || 'Failed to disable user');
    }
    setActionLoading(false);
  };

  const handleEnable = async () => {
    setActionLoading(true);
    const result = await enableUser(userId);
    if (result.success) {
      toast.success('User enabled successfully');
      loadUser();
    } else {
      toast.error(result.error || 'Failed to enable user');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ PERMANENT ACTION: Delete this user and all their data? This cannot be undone!')) return;
    if (!confirm('Type DELETE to confirm')) return;
    
    setActionLoading(true);
    const result = await deleteUser(userId);
    if (result.success) {
      toast.success('User deleted successfully');
      onClose();
    } else {
      toast.error(result.error || 'Failed to delete user');
    }
    setActionLoading(false);
  };

  if (isLoading || !user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Tier & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Subscription Tier
                </label>
                <select
                  value={user.tier}
                  onChange={(e) => handleChangeTier(e.target.value)}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary disabled:opacity-50"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Status
                </label>
                <span className={cn('inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium', 
                  user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                )}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Usage This Month
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">RAG Searches</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.usage.ragSearches}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Queries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.usage.aiQueries}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emails Stored</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.usage.emailsStored}</p>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">User ID</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{user.id.slice(0, 16)}...</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Joined</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Active</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {user.lastActive ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true }) : 'Never'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {user.status === 'active' ? (
                <button
                  onClick={handleDisable}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                >
                  <Ban size={16} />
                  Disable User
                </button>
              ) : (
                <button
                  onClick={handleEnable}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                >
                  Enable User
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

