import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AutoSyncStarter } from '@/components/sync/AutoSyncStarter';
import { SidebarWrapper } from '@/components/sidebar/SidebarWrapper';
import { SidebarDataLoader } from '@/components/sidebar/SidebarDataLoader';
import { KeyboardShortcutsProvider } from '@/components/layout/KeyboardShortcutsProvider';
import { ChatbotContextProvider } from '@/components/ai/ChatbotContext';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { ReplyLaterProvider } from '@/contexts/ReplyLaterContext';
import { ReplyLaterStackWrapper } from '@/components/email/ReplyLaterStackWrapper';

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
  const sidebarData = await SidebarDataLoader();

  return (
    <ChatbotContextProvider>
      <KeyboardShortcutsProvider>
        <ReplyLaterProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Auto-start sync for all accounts */}
            <AutoSyncStarter accounts={accounts} />

            {/* Column 1: Modern Sidebar */}
            <SidebarWrapper initialData={sidebarData} />

            {/* Column 2: Main Content Area */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              {children}
            </main>

            {/* Column 3: AI Assistant Panel */}
            <AIAssistantPanel />

            {/* Reply Later Stack (floating at bottom-center) */}
            <ReplyLaterStackWrapper />
          </div>
        </ReplyLaterProvider>
      </KeyboardShortcutsProvider>
    </ChatbotContextProvider>
  );
}
