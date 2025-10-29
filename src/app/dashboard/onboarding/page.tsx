import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOnboardingProgress } from '@/lib/onboarding/actions';
import { SimpleChecklist } from '@/components/onboarding/SimpleChecklist';

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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to easeMail 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get started in 3 simple steps
          </p>
        </div>

        {/* Simple Checklist */}
        <SimpleChecklist progress={progress} userId={user.id} />

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Need help?
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Click on any step above to complete it. All steps are optional
            except connecting your email account. You can dismiss this checklist
            anytime and access it later from the sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}
