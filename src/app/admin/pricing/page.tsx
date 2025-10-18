import { PricingManager } from '@/components/admin/PricingManager';

export default async function AdminPricingPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pricing Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage subscription tiers and pricing
        </p>
      </div>

      {/* Pricing Manager */}
      <PricingManager />
    </div>
  );
}

