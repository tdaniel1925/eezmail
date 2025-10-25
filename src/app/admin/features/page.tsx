import { FeaturesManager } from '@/components/admin/FeaturesManager';

// Force dynamic rendering for admin pages that require auth
export const dynamic = 'force-dynamic';

export default async function AdminFeaturesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Feature Flags
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage feature rollout and A/B testing
        </p>
      </div>

      <FeaturesManager />
    </div>
  );
}
