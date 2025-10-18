import { PromotionsManager } from '@/components/admin/PromotionsManager';

export default async function AdminPromotionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Promotion Codes
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Create and manage promotional discount codes
        </p>
      </div>

      <PromotionsManager />
    </div>
  );
}

