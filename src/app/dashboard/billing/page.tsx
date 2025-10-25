import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BillingPageClient from '@/components/billing/BillingPageClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-600">
            Manage your balance and view transaction history
          </p>
        </div>

        <BillingPageClient />
      </div>
    </div>
  );
}

