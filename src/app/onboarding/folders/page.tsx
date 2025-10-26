/**
 * Folder Confirmation Page
 * /onboarding/folders?accountId=xxx
 *
 * Shows detected folders for user review and confirmation
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FolderConfirmation } from '@/components/onboarding/FolderConfirmation';

interface PageProps {
  searchParams: {
    accountId?: string;
  };
}

export default async function FolderConfirmationPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require authentication
  if (!user) {
    redirect('/auth/login?redirect=/onboarding/folders');
  }

  // Require accountId
  const { accountId } = searchParams;
  if (!accountId) {
    redirect('/dashboard?error=missing_account_id');
  }

  return <FolderConfirmation accountId={accountId} />;
}
