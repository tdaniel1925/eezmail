'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Mail,
  Eye,
  Keyboard,
  Globe,
  Zap,
  Shield,
  Database,
  ArrowLeft,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingComposingPrefs } from '@/components/preferences/ReadingComposingPrefs';
import { DisplayPrefs } from '@/components/preferences/DisplayPrefs';
import { KeyboardShortcuts } from '@/components/preferences/KeyboardShortcuts';
import { LanguageRegionPrefs } from '@/components/preferences/LanguageRegionPrefs';
import { PerformancePrefs } from '@/components/preferences/PerformancePrefs';
import { PrivacyDataPrefs } from '@/components/preferences/PrivacyDataPrefs';
import { AdvancedPrefs } from '@/components/preferences/AdvancedPrefs';

type PrefsTab =
  | 'reading-composing'
  | 'display'
  | 'keyboard'
  | 'language'
  | 'performance'
  | 'privacy-data'
  | 'advanced';

interface TabConfig {
  id: PrefsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'reading-composing',
    label: 'Reading & Composing',
    icon: Mail,
    description: 'Email display, composer, and reply settings',
  },
  {
    id: 'display',
    label: 'Display',
    icon: Eye,
    description: 'Layout, density, and visual preferences',
  },
  {
    id: 'keyboard',
    label: 'Keyboard Shortcuts',
    icon: Keyboard,
    description: 'Customize keyboard shortcuts',
  },
  {
    id: 'language',
    label: 'Language & Region',
    icon: Globe,
    description: 'Language, timezone, and date formatting',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Zap,
    description: 'Sync, caching, and optimization settings',
  },
  {
    id: 'privacy-data',
    label: 'Privacy & Data',
    icon: Shield,
    description: 'Tracking, analytics, and data collection',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: Database,
    description: 'Developer options and experimental features',
  },
];

function PreferencesPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<PrefsTab>('reading-composing');
  const [isLoading, setIsLoading] = useState(true);

  // State for preferences
  const [preferences, setPreferences] = useState<any>(null);

  // Read tab from URL on initial load
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.find((t) => t.id === tab)) {
      setActiveTab(tab as PrefsTab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Load preferences
    const loadPreferences = async (): Promise<void> => {
      try {
        setIsLoading(true);
        // TODO: Fetch from server
        const mockPrefs = {
          emailsPerPage: 50,
          density: 'comfortable',
          readingPanePosition: 'right',
          theme: 'system',
          language: 'en',
          timezone: 'auto',
        };
        setPreferences(mockPrefs);
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const renderTabContent = (): React.ReactNode => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    switch (activeTab) {
      case 'reading-composing':
        return <ReadingComposingPrefs preferences={preferences} />;
      case 'display':
        return <DisplayPrefs preferences={preferences} />;
      case 'keyboard':
        return <KeyboardShortcuts />;
      case 'language':
        return <LanguageRegionPrefs preferences={preferences} />;
      case 'performance':
        return <PerformancePrefs preferences={preferences} />;
      case 'privacy-data':
        return <PrivacyDataPrefs preferences={preferences} />;
      case 'advanced':
        return <AdvancedPrefs preferences={preferences} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Left Sidebar - Preferences Navigation */}
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Preferences
              </h1>
              <p className="text-xs text-gray-600 dark:text-white/60">
                Customize your experience
              </p>
            </div>
          </div>

          {/* Link to Settings */}
          <Link
            href="/dashboard/settings"
            className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <Settings size={16} />
            <span>Go to Settings</span>
          </Link>

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
                      `/dashboard/preferences?tab=${tab.id}`
                    );
                  }}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-200 border border-transparent',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                      : 'text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tab.label}</div>
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
export default function PreferencesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PreferencesPageContent />
    </Suspense>
  );
}

