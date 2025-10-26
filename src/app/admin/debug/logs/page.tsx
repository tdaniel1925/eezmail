/**
 * Debug Tools - Log Search Interface
 * Search and filter application logs
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LogSearchForm } from '@/components/admin/debug/LogSearchForm';
import { LogResults } from '@/components/admin/debug/LogResults';
import { Search } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    query?: string;
    level?: string;
    service?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function LogSearchPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-3">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Log Search</h1>
            <p className="text-sm text-gray-500">
              Search and analyze application logs
            </p>
          </div>
        </div>

        {/* Search Form */}
        <LogSearchForm initialParams={params} />

        {/* Results */}
        <Suspense fallback={<div>Loading results...</div>}>
          <LogResults params={params} />
        </Suspense>
      </div>
    </div>
  );
}
