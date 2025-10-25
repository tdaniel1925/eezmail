import { getDiscountCodes } from '@/lib/admin/discount-actions';
import { DiscountManager } from '@/components/admin/DiscountManager';

export default async function AdminPromotionsPage() {
  const result = await getDiscountCodes();

  return (
    <div className="space-y-8">
      {/* Discount Manager */}
      {result.success && result.codes && (
        <DiscountManager initialCodes={result.codes} />
      )}

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{result.error}</p>
        </div>
      )}
    </div>
  );
}
