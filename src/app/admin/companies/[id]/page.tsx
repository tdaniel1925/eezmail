import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin/auth';
import { SandboxCompanyDetail } from '@/components/admin/SandboxCompanyDetail';

export default async function SandboxCompanyPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        }
      >
        <SandboxCompanyDetail companyId={params.id} />
      </Suspense>
    </div>
  );
}
