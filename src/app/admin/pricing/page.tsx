import { getPricingTiers } from '@/lib/admin/pricing-actions';
import { DynamicPricingManager } from '@/components/admin/DynamicPricingManager';

// Force dynamic rendering for admin pages that require auth
export const dynamic = 'force-dynamic';

export default async function AdminPricingPage() {
  const result = await getPricingTiers();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pricing Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Create and manage subscription tiers, pricing, and features
          dynamically
        </p>
      </div>

      {/* Dynamic Pricing Manager */}
      {result.success && result.tiers && (
        <DynamicPricingManager initialTiers={result.tiers} />
      )}

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{result.error}</p>
        </div>
      )}
    </div>
  );
}
