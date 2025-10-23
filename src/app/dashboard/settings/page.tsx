'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Sparkles,
  Bell,
  Palette,
  CreditCard,
  Shield,
  HelpCircle,
  Settings as SettingsIcon,
  ArrowLeft,
  Folder,
  FileSignature,
  Filter,
  AlertTriangle,
  Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AIPreferences } from '@/components/settings/AIPreferences';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { DisplaySettings } from '@/components/settings/DisplaySettings';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { ConnectedAccounts } from '@/components/settings/ConnectedAccounts';
import { CommunicationSettings } from '@/components/settings/CommunicationSettings';
import { FolderSettings } from '@/components/settings/FolderSettings';
import { SignaturesSettings } from '@/components/settings/SignaturesSettings';
import { RulesSettings } from '@/components/settings/RulesSettings';
import { HelpCenter } from '@/components/help/HelpCenter';
import { DangerZone } from '@/components/settings/DangerZone';
import { VoiceSettings } from '@/components/settings/VoiceSettings';
import { useSettingsData } from '@/hooks/useSettingsData';

type SettingsTab =
  | 'account'
  | 'email-accounts'
  | 'communication'
  | 'organization'
  | 'ai-voice'
  | 'display'
  | 'notifications'
  | 'security'
  | 'advanced';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Profile, password, and preferences',
  },
  {
    id: 'email-accounts',
    label: 'Email Accounts',
    icon: Mail,
    description: 'Connect and manage email accounts',
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Mic,
    description: 'SMS, voice messages, and Twilio',
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Folder,
    description: 'Folders, signatures, and rules',
  },
  {
    id: 'ai-voice',
    label: 'AI & Voice',
    icon: Sparkles,
    description: 'AI features and voice settings',
  },
  {
    id: 'display',
    label: 'Display',
    icon: Palette,
    description: 'Theme, layout, and typography',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and notification preferences',
  },
  {
    id: 'security',
    label: 'Privacy & Security',
    icon: Shield,
    description: 'Privacy, tracking, and data',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: SettingsIcon,
    description: 'Billing, help, and danger zone',
  },
];

function SettingsPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  
  // Use SWR hook for cached data fetching
  const { userData, isLoading, isError, refreshSettings } = useSettingsData();

  // Read tab from URL on initial load
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.find((t) => t.id === tab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, []); // Run only once on mount

  // URL cleaning to prevent error persistence across tabs
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    // Only clean error parameters if there's no success
    if (error && !success) {
      console.log('🧹 Cleaning error URL parameters');
      const tab = searchParams.get('tab') || 'account';
      const cleanUrl = `${window.location.pathname}?tab=${tab}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [searchParams]);

  const renderTabContent = (): React.ReactNode => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    // Show error state
    if (isError || !userData) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Failed to load settings
          </div>
          <button
            onClick={() => refreshSettings()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'account':
        return <AccountSettings user={userData.user} />;
      case 'email-accounts':
        return <ConnectedAccounts accounts={userData.emailAccounts} />;
      case 'communication':
        return <CommunicationSettings />;
      case 'organization':
        return (
          <div className="space-y-8">
            <FolderSettings userId={userData.user.id} />
            <div className="border-t border-gray-200 dark:border-white/10 pt-8">
              <SignaturesSettings />
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 pt-8">
              <RulesSettings />
            </div>
          </div>
        );
      case 'ai-voice':
        return (
          <div className="space-y-8">
            <AIPreferences
              settings={userData.settings}
              accountId={userData.defaultAccountId || ''}
            />
            <div className="border-t border-gray-200 dark:border-white/10 pt-8">
              <VoiceSettings />
            </div>
          </div>
        );
      case 'display':
        return (
          <DisplaySettings
            settings={userData.settings}
            accountId={userData.defaultAccountId || ''}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            settings={userData.settings}
            accountId={userData.defaultAccountId || ''}
          />
        );
      case 'security':
        return (
          <PrivacySettings
            settings={userData.settings}
            accountId={userData.defaultAccountId || ''}
          />
        );
      case 'advanced':
        return (
          <div className="space-y-8">
            <BillingSettings
              user={userData.user}
              subscription={userData.subscription}
            />
            <div className="border-t border-gray-200 dark:border-white/10 pt-8">
              <HelpCenter />
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 pt-8">
              <DangerZone />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-black">
      {/* Left Sidebar - Settings Navigation */}
      <aside className="w-[280px] flex-shrink-0 border-r border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-y-auto">
        <div className="p-6">
          {/* Back to Email Link */}
          <Link
            href="/dashboard/inbox"
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Email
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 text-white">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-xs text-gray-600 dark:text-white/60">
                Manage your preferences
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    window.history.pushState(
                      {},
                      '',
                      `/dashboard/settings?tab=${tab.id}`
                    );
                  }}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-200 border border-transparent',
                    isActive
                      ? 'bg-gray-200/80 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white backdrop-blur-sm'
                      : 'text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="mt-0.5 text-xs opacity-70">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-black/50">
        <div className="mx-auto max-w-4xl p-8">{renderTabContent()}</div>
      </main>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function SettingsPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
