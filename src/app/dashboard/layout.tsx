import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import dynamic from 'next/dynamic';
import { AutoSyncStarter } from '@/components/sync/AutoSyncStarter';
import { SidebarWrapper } from '@/components/sidebar/SidebarWrapper';
import { SidebarDataLoader } from '@/components/sidebar/SidebarDataLoader';
import { KeyboardShortcutsProvider } from '@/components/layout/KeyboardShortcutsProvider';
import { ChatbotContextProvider } from '@/components/ai/ChatbotContext';
import { ReplyLaterProvider } from '@/contexts/ReplyLaterContext';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Lazy load heavy, non-critical components
const AIAssistantPanel = dynamic(
  () =>
    import('@/components/ai/AIAssistantPanelNew').then(
      (mod) => mod.AIAssistantPanel
    ),
  {
    ssr: false,
    loading: () => null, // No loading state needed
  }
);

const ReplyLaterStackWrapper = dynamic(
  () =>
    import('@/components/email/ReplyLaterStackWrapper').then(
      (mod) => mod.ReplyLaterStackWrapper
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

const NotificationCenter = dynamic(
  () =>
    import('@/components/notifications/NotificationCenter').then(
      (mod) => mod.NotificationCenter
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

const ProactiveSuggestions = dynamic(
  () =>
    import('@/components/notifications/ProactiveSuggestions').then(
      (mod) => mod.ProactiveSuggestions
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

const TutorialManager = dynamic(
  () =>
    import('@/components/tutorial/TutorialManager').then(
      (mod) => mod.TutorialManager
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's email accounts for sync
  let accounts: Array<{ id: string; emailAddress: string }> = [];
  try {
    accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
      columns: {
        id: true,
        emailAddress: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch email accounts:', error);
  }

  // Load sidebar data
  let sidebarData = null;
  try {
    sidebarData = await SidebarDataLoader();
  } catch (error) {
    console.error('Failed to load sidebar data:', error);
  }

  return (
    <ErrorBoundary>
      <ChatbotContextProvider>
        <KeyboardShortcutsProvider>
          <ReplyLaterProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Auto-start sync for all accounts */}
              <AutoSyncStarter accounts={accounts} />

              {/* Column 1: Modern Sidebar */}
              <SidebarWrapper initialData={sidebarData} />

              {/* Column 2: Main Content Area */}
              <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                {children}
              </main>

              {/* Column 3: AI Assistant Panel */}
              <ErrorBoundary>
                <AIAssistantPanel />
              </ErrorBoundary>

              {/* Reply Later Stack (floating at bottom-center) */}
              <ReplyLaterStackWrapper />

              {/* Notification Center Panel */}
              <NotificationCenter />

              {/* Proactive Suggestions (AI Insights) */}
              <ProactiveSuggestions />

              {/* Tutorial Manager for first-time users */}
              <TutorialManager userId={user.id} />
            </div>
          </ReplyLaterProvider>
        </KeyboardShortcutsProvider>
      </ChatbotContextProvider>
    </ErrorBoundary>
  );
}
