import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MembersPageClient from '@/components/organizations/MembersPageClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MembersPage({
  params,
}: {
  params: { orgId: string };
}) {
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
        {/* Back Button */}
        <Link href={`/dashboard/organizations/${params.orgId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organization
          </Button>
        </Link>

        <MembersPageClient />
      </div>
    </div>
  );
}

