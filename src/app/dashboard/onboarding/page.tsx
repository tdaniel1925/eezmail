import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOnboardingProgress } from '@/lib/onboarding/actions';
import { OnboardingDashboard } from '@/components/onboarding/OnboardingDashboard';

export const metadata = {
  title: 'Getting Started | easeMail',
  description: 'Learn how to use easeMail effectively',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const progress = await getOnboardingProgress(user.id);

  return <OnboardingDashboard progress={progress} userId={user.id} />;
}



