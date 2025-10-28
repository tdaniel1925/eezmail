'use client';

import { useState } from 'react';
import { PricingTier, TierFeature } from '@/db/schema';
import {
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  upsertTierFeature,
  deleteTierFeature,
} from '@/lib/admin/pricing-actions';

interface DynamicPricingManagerProps {
  initialTiers: (PricingTier & { features: TierFeature[] })[];
}

export function DynamicPricingManager({
  initialTiers,
}: DynamicPricingManagerProps) {
  const [tiers, setTiers] = useState(initialTiers);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const refreshTiers = () => {
    // Reload the page to fetch updated data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pricing Tiers
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage subscription plans dynamically
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New Tier
        </button>
      </div>

      {/* Create New Tier Modal */}
      {isCreating && (
        <CreateTierModal
          onClose={() => setIsCreating(false)}
          onSuccess={refreshTiers}
        />
      )}

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isEditing={editingTier === tier.id}
            onEdit={() => setEditingTier(tier.id)}
            onCancelEdit={() => setEditingTier(null)}
            onSuccess={refreshTiers}
          />
        ))}
      </div>
    </div>
  );
}

function TierCard({
  tier,
  isEditing,
  onEdit,
  onCancelEdit,
  onSuccess,
}: {
  tier: PricingTier & { features: TierFeature[] };
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: tier.name,
    description: tier.description || '',
    price: tier.price || '0',
    isActive: tier.isActive,
    isHighlighted: tier.isHighlighted,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async () => {
    try {
      const result = await updatePricingTier(tier.id, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        isActive: formData.isActive,
        isHighlighted: formData.isHighlighted,
      });

      if (result.success) {
        toast.success('Pricing tier updated successfully');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to update tier');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the "${tier.name}" tier? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePricingTier(tier.id);

      if (result.success) {
        toast.success('Pricing tier deleted');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to delete tier');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 shadow-sm relative ${
        tier.isHighlighted
          ? 'border-primary'
          : 'border-gray-200 dark:border-gray-700'
      } ${!tier.isActive ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        {isEditing ? (
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-lg font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full"
          />
        ) : (
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {tier.name}
          </h3>
        )}
        {!isEditing && (
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="text-2xl font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full"
            />
            <span className="text-gray-500">/mo</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ${tier.price || '0'}
            </span>
            <span className="text-gray-500 dark:text-gray-400">/mo</span>
          </div>
        )}
        {isEditing ? (
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full mt-2"
            rows={2}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tier.description}
          </p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
          Key Features
        </p>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {tier.features.slice(0, 4).map((feature) => (
            <li key={feature.id} className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="truncate">
                {feature.featureName}:{' '}
                {feature.featureValue === -1
                  ? 'Unlimited'
                  : feature.featureValue}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Status Toggles */}
      {isEditing && (
        <div className="space-y-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isHighlighted}
              onChange={(e) =>
                setFormData({ ...formData, isHighlighted: e.target.checked })
              }
              className="rounded"
            />
            Highlighted (Popular)
          </label>
        </div>
      )}

      {/* Stripe Info */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        {tier.stripePriceId ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            Stripe: {tier.stripePriceId}
          </p>
        ) : (
          <p className="text-xs text-orange-600 dark:text-orange-400">
            ⚠️ Not synced with Stripe
          </p>
        )}
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleUpdate}
            className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Save Changes
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-4 right-4 flex gap-2">
        {tier.isHighlighted && (
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
            <Sparkles className="h-3 w-3 inline" />
          </span>
        )}
        {!tier.isActive && (
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded">
            INACTIVE
          </span>
        )}
      </div>
    </div>
  );
}

function CreateTierModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '0',
    interval: 'month',
    isHighlighted: false,
    sortOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createPricingTier({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        interval: formData.interval,
        isHighlighted: formData.isHighlighted,
        sortOrder: formData.sortOrder,
      });

      if (result.success) {
        toast.success('Pricing tier created successfully');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create tier');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Create New Pricing Tier
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
            <label className="block text-sm font-medium mb-1">Tier Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="e.g., Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Slug (URL-safe)
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="e.g., pro"
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
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Interval</label>
              <select
                value={formData.interval}
                onChange={(e) =>
                  setFormData({ ...formData, interval: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isHighlighted}
                onChange={(e) =>
                  setFormData({ ...formData, isHighlighted: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Mark as Popular/Highlighted</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Tier'}
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




