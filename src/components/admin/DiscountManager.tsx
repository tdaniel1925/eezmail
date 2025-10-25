'use client';

import { useState } from 'react';
import { DiscountCode } from '@/db/schema';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createDiscountCode,
  updateDiscountCode,
  deactivateDiscountCode,
  deleteDiscountCode,
} from '@/lib/admin/discount-actions';

interface DiscountManagerProps {
  initialCodes: DiscountCode[];
}

export function DiscountManager({ initialCodes }: DiscountManagerProps) {
  const [codes, setCodes] = useState(initialCodes);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refreshCodes = () => {
    window.location.reload();
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this discount code?')) return;

    try {
      const result = await deactivateDiscountCode(id);
      if (result.success) {
        toast.success('Discount code deactivated');
        refreshCodes();
      } else {
        toast.error(result.error || 'Failed to deactivate');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete discount code "${code}"? This cannot be undone.`))
      return;

    try {
      const result = await deleteDiscountCode(id);
      if (result.success) {
        toast.success('Discount code deleted');
        refreshCodes();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discount Codes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage promotional discount codes
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Discount Code
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <CreateDiscountModal
          onClose={() => setIsCreating(false)}
          onSuccess={refreshCodes}
        />
      )}

      {/* Discount Codes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {codes.map((code) => (
                <DiscountRow
                  key={code.id}
                  code={code}
                  onDeactivate={() => handleDeactivate(code.id)}
                  onDelete={() => handleDelete(code.id, code.code)}
                />
              ))}
              {codes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No discount codes yet. Create one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DiscountRow({
  code,
  onDeactivate,
  onDelete,
}: {
  code: DiscountCode;
  onDeactivate: () => void;
  onDelete: () => void;
}) {
  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
  const isActive = code.isActive && !isExpired;
  const usagePercentage = code.maxRedemptions
    ? (code.currentRedemptions / code.maxRedemptions) * 100
    : 0;

  return (
    <tr className={!isActive ? 'opacity-50' : ''}>
      <td className="px-6 py-4">
        <div>
          <div className="font-mono font-bold text-gray-900 dark:text-white">
            {code.code}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {code.name}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {code.discountType === 'percentage'
            ? `${code.discountValue}% off`
            : `$${code.discountValue} off`}
        </div>
        {code.appliesTo !== 'all' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {code.appliesTo}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {code.currentRedemptions}
          {code.maxRedemptions ? ` / ${code.maxRedemptions}` : ' uses'}
        </div>
        {code.maxRedemptions && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        {code.expiresAt ? (
          <div className="text-sm text-gray-900 dark:text-white">
            {new Date(code.expiresAt).toLocaleDateString()}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">Never</div>
        )}
      </td>
      <td className="px-6 py-4">
        {isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
            <Check className="h-3 w-3" />
            Active
          </span>
        ) : isExpired ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
            <AlertCircle className="h-3 w-3" />
            Expired
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
            <X className="h-3 w-3" />
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isActive && (
            <button
              onClick={onDeactivate}
              className="p-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
              title="Deactivate"
            >
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateDiscountModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '10',
    maxRedemptions: '',
    maxRedemptionsPerUser: '1',
    expiresAt: '',
    createStripeCoupon: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createDiscountCode({
        code: formData.code.toUpperCase().replace(/\s+/g, ''),
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxRedemptions: formData.maxRedemptions
          ? parseInt(formData.maxRedemptions)
          : undefined,
        maxRedemptionsPerUser: parseInt(formData.maxRedemptionsPerUser),
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt)
          : undefined,
        createStripeCoupon: formData.createStripeCoupon,
      });

      if (result.success) {
        toast.success('Discount code created successfully');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create discount code');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Create Discount Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
              placeholder="SUMMER2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="Summer Sale 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              rows={2}
              placeholder="Summer promotion - 20% off all plans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {formData.discountType === 'percentage'
                  ? 'Percentage'
                  : 'Amount ($)'}{' '}
                *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                max={formData.discountType === 'percentage' ? '100' : undefined}
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Total Uses
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxRedemptions}
                onChange={(e) =>
                  setFormData({ ...formData, maxRedemptions: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Per User *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxRedemptionsPerUser}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxRedemptionsPerUser: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData({ ...formData, expiresAt: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.createStripeCoupon}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    createStripeCoupon: e.target.checked,
                  })
                }
                className="rounded"
              />
              <span className="text-sm">Also create in Stripe</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              This will automatically create a matching coupon in your Stripe
              account
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Discount Code'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
