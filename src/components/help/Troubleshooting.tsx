'use client';

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  Mic,
  Mail,
  Lock,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Issue {
  id: string;
  category: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  symptoms: string[];
  solutions: Solution[];
}

interface Solution {
  step: number;
  instruction: string;
  note?: string;
}

export function Troubleshooting(): JSX.Element {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Issues', icon: AlertCircle },
    { id: 'sync', name: 'Email Sync', icon: RefreshCw },
    { id: 'connection', name: 'Connection', icon: Wifi },
    { id: 'voice', name: 'Voice Messages', icon: Mic },
    { id: 'auth', name: 'Login & Auth', icon: Lock },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'search', name: 'Search', icon: Search },
  ];

  const issues: Issue[] = [
    {
      id: 'sync-not-working',
      category: 'sync',
      title: 'Emails Not Syncing',
      severity: 'critical',
      description:
        'Your emails are not appearing or sync status shows as failed.',
      symptoms: [
        'No new emails appearing in inbox',
        'Sync status shows "Failed" or "Error"',
        'Last sync time is old',
        'Missing recent emails',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Check your internet connection',
          note: 'Make sure you have a stable internet connection. Try loading other websites.',
        },
        {
          step: 2,
          instruction: 'Go to Settings → Connected Accounts',
        },
        {
          step: 3,
          instruction: 'Find the account with sync issues and check its status',
        },
        {
          step: 4,
          instruction: 'Click "Sync Now" to manually trigger a sync',
          note: 'If this fails, proceed to next step.',
        },
        {
          step: 5,
          instruction: 'Click "Reconnect" to re-authenticate the account',
          note: 'You may need to log in again with your email provider.',
        },
        {
          step: 6,
          instruction: 'If issue persists, try disconnecting and reconnecting the account',
          note: 'Your emails will remain safe - they are stored with your email provider.',
        },
      ],
    },
    {
      id: 'slow-sync',
      category: 'sync',
      title: 'Sync is Very Slow',
      severity: 'warning',
      description: 'Email synchronization is taking longer than expected.',
      symptoms: [
        'Emails take minutes to appear',
        'Sync progress stuck at same percentage',
        'Initial sync seems endless',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Check if you have a large mailbox',
          note: 'Initial sync of 10,000+ emails can take 10-30 minutes depending on your email provider.',
        },
        {
          step: 2,
          instruction: 'Verify your internet speed',
          note: 'Run a speed test at fast.com. Slow speeds will affect sync times.',
        },
        {
          step: 3,
          instruction: 'Check if your email provider has rate limits',
          note: 'Some providers (like Yahoo, Fastmail) limit how fast we can sync. This is normal.',
        },
        {
          step: 4,
          instruction: 'Close other tabs or applications using your email',
          note: 'Multiple apps syncing simultaneously can slow things down.',
        },
        {
          step: 5,
          instruction: 'Wait for initial sync to complete, then syncs will be much faster',
          note: 'After initial sync, only new/changed emails are synced (much faster!).',
        },
      ],
    },
    {
      id: 'connection-lost',
      category: 'connection',
      title: 'Connection Lost or Offline',
      severity: 'critical',
      description: 'App shows offline or cannot connect to server.',
      symptoms: [
        'Offline indicator appears',
        'Cannot send or receive emails',
        '"Connection lost" message',
        'Features not loading',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Check your internet connection',
          note: 'Try opening other websites. If they don\'t load, your internet is down.',
        },
        {
          step: 2,
          instruction: 'Refresh the page (Cmd/Ctrl + R)',
          note: 'Sometimes a simple refresh restores the connection.',
        },
        {
          step: 3,
          instruction: 'Check if your firewall or antivirus is blocking the app',
          note: 'Add imbox.app to your allowed list.',
        },
        {
          step: 4,
          instruction: 'Try a different browser',
          note: 'Chrome, Edge, and Safari work best.',
        },
        {
          step: 5,
          instruction: 'Check our status page at status.imbox.app',
          note: 'There might be a service outage (rare).',
        },
      ],
    },
    {
      id: 'voice-not-recording',
      category: 'voice',
      title: 'Cannot Record Voice Messages',
      severity: 'warning',
      description: 'Microphone not working or recording fails.',
      symptoms: [
        'Microphone permission denied',
        'No audio when playing back',
        'Recording button disabled',
        'Browser says microphone in use',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Grant microphone permission when prompted',
          note: 'Click "Allow" in the browser popup. If you blocked it before, you\'ll need to reset permissions.',
        },
        {
          step: 2,
          instruction: 'Check browser microphone permissions',
          note: 'Chrome: Click lock icon in address bar → Site settings → Microphone → Allow',
        },
        {
          step: 3,
          instruction: 'Test your microphone in system settings',
          note: 'Make sure your microphone works in other apps first.',
        },
        {
          step: 4,
          instruction: 'Close other apps using your microphone',
          note: 'Only one app can use the microphone at a time.',
        },
        {
          step: 5,
          instruction: 'Try a different browser',
          note: 'Chrome and Edge have the best voice message support.',
        },
        {
          step: 6,
          instruction: 'Check if browser supports voice recording',
          note: 'Voice messages require a modern browser. Update if needed.',
        },
      ],
    },
    {
      id: 'voice-quality-poor',
      category: 'voice',
      title: 'Poor Voice Message Quality',
      severity: 'info',
      description: 'Voice messages sound unclear, muffled, or distorted.',
      symptoms: [
        'Audio is too quiet',
        'Crackling or distortion',
        'Background noise',
        'Echoing',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Record in a quiet environment',
          note: 'Background noise significantly affects quality.',
        },
        {
          step: 2,
          instruction: 'Speak closer to your microphone',
          note: 'But not too close - maintain 4-6 inches distance.',
        },
        {
          step: 3,
          instruction: 'Adjust quality settings',
          note: 'Go to Settings → Voice Messages → Quality and select "High".',
        },
        {
          step: 4,
          instruction: 'Use a better microphone',
          note: 'Built-in laptop mics vary in quality. Consider a USB microphone or headset.',
        },
        {
          step: 5,
          instruction: 'Check system audio input level',
          note: 'Too high = distortion, too low = quiet. Aim for 50-75%.',
        },
      ],
    },
    {
      id: 'cannot-login',
      category: 'auth',
      title: 'Cannot Log In',
      severity: 'critical',
      description: 'Login fails or authentication errors.',
      symptoms: [
        '"Invalid credentials" error',
        'Stuck on login screen',
        'OAuth provider error',
        'Session expired message',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Double-check your email and password',
          note: 'Password is case-sensitive. Check Caps Lock.',
        },
        {
          step: 2,
          instruction: 'Use "Forgot Password" to reset',
          note: 'Check your email spam folder for the reset link.',
        },
        {
          step: 3,
          instruction: 'Clear browser cookies and cache',
          note: 'Old sessions might interfere. Try incognito/private mode.',
        },
        {
          step: 4,
          instruction: 'For OAuth (Google/Microsoft): Make sure you\'re not blocking popups',
          note: 'OAuth requires popup windows. Allow popups for imbox.app.',
        },
        {
          step: 5,
          instruction: 'Check if your account is locked',
          note: 'Too many failed attempts can temporarily lock your account. Wait 15 minutes.',
        },
        {
          step: 6,
          instruction: 'Contact support if issue persists',
          note: 'Email support@imbox.app with your email address (not password!).',
        },
      ],
    },
    {
      id: 'app-slow',
      category: 'performance',
      title: 'App is Slow or Laggy',
      severity: 'warning',
      description: 'Interface is sluggish or unresponsive.',
      symptoms: [
        'Clicking takes time to respond',
        'Scrolling is janky',
        'Emails load slowly',
        'Animations stuttering',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Close unused browser tabs',
          note: 'Each tab uses memory. Aim for fewer than 20 tabs.',
        },
        {
          step: 2,
          instruction: 'Check your computer\'s available memory (RAM)',
          note: 'If RAM is full, close other applications.',
        },
        {
          step: 3,
          instruction: 'Reduce email density in Settings',
          note: 'Settings → Display → Density → Compact shows more emails with less overhead.',
        },
        {
          step: 4,
          instruction: 'Disable glassmorphism effects',
          note: 'Settings → Display → Disable "Glassmorphism effects" for better performance.',
        },
        {
          step: 5,
          instruction: 'Update your browser to the latest version',
          note: 'Newer browsers have better performance.',
        },
        {
          step: 6,
          instruction: 'Try the desktop app (if available)',
          note: 'Native apps often perform better than web versions.',
        },
      ],
    },
    {
      id: 'search-not-working',
      category: 'search',
      title: 'Search Not Finding Emails',
      severity: 'warning',
      description: 'Search returns no results or wrong results.',
      symptoms: [
        'Known emails not appearing in results',
        'Search returns empty',
        'Results seem incomplete',
        'Old emails not showing up',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Check if initial sync is complete',
          note: 'Search only works on synced emails. Wait for sync to finish.',
        },
        {
          step: 2,
          instruction: 'Verify your search query',
          note: 'Try simpler keywords. Avoid typos.',
        },
        {
          step: 3,
          instruction: 'Use search operators for better results',
          note: 'Example: from:sender@example.com subject:meeting',
        },
        {
          step: 4,
          instruction: 'Check if you\'re searching in the right folder',
          note: 'Some searches are folder-specific. Try "All Mail".',
        },
        {
          step: 5,
          instruction: 'Reindex your mailbox',
          note: 'Go to Settings → Advanced → Rebuild Search Index (takes 5-10 minutes).',
        },
      ],
    },
    {
      id: 'ai-not-working',
      category: 'sync',
      title: 'AI Features Not Working',
      severity: 'warning',
      description: 'AI summaries, screening, or replies not appearing.',
      symptoms: [
        'No AI summary on long emails',
        'Quick replies not showing',
        'Email screening not suggesting',
        'AI features disabled',
      ],
      solutions: [
        {
          step: 1,
          instruction: 'Check if AI features are enabled',
          note: 'Go to Settings → AI Preferences and ensure features are toggled ON.',
        },
        {
          step: 2,
          instruction: 'Verify your subscription plan',
          note: 'Some AI features require Pro plan. Check Settings → Billing.',
        },
        {
          step: 3,
          instruction: 'Check AI service status',
          note: 'Occasionally AI services are down for maintenance. Check status.imbox.app.',
        },
        {
          step: 4,
          instruction: 'Try refreshing the page',
          note: 'Sometimes AI features need a page refresh to activate.',
        },
        {
          step: 5,
          instruction: 'For email screening: Ensure sender is new',
          note: 'Screening only appears for first-time senders.',
        },
      ],
    },
  ];

  const filteredIssues =
    selectedCategory === 'all'
      ? issues
      : issues.filter((issue) => issue.category === selectedCategory);

  const getSeverityColor = (severity: Issue['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
    }
  };

  const getSeverityIcon = (severity: Issue['severity']): JSX.Element => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Troubleshooting Common Issues
        </h2>
        <p className="text-sm text-gray-600 dark:text-white/60">
          Find solutions to common problems and get back to work quickly
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10'
              )}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.map((issue) => {
          const isExpanded = expandedIssue === issue.id;
          return (
            <div
              key={issue.id}
              className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedIssue(isExpanded ? null : issue.id)
                }
                className="w-full flex items-start justify-between p-5 text-left hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                        getSeverityColor(issue.severity)
                      )}
                    >
                      {getSeverityIcon(issue.severity)}
                      {issue.severity === 'critical'
                        ? 'Critical'
                        : issue.severity === 'warning'
                          ? 'Common'
                          : 'Info'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {issue.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    {issue.description}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-white/50 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-white/50 flex-shrink-0 ml-4" />
                )}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-200 dark:border-white/10 pt-5 space-y-4">
                  {/* Symptoms */}
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      Symptoms:
                    </h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {issue.symptoms.map((symptom) => (
                        <li
                          key={symptom}
                          className="text-sm text-gray-700 dark:text-white/70"
                        >
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solutions */}
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                      Solutions:
                    </h5>
                    <div className="space-y-3">
                      {issue.solutions.map((solution) => (
                        <div
                          key={solution.step}
                          className="flex items-start gap-3"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-xs flex-shrink-0">
                            {solution.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {solution.instruction}
                            </p>
                            {solution.note && (
                              <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                                {solution.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Still Having Issues */}
                  <div className="rounded-lg bg-gray-100 dark:bg-white/5 p-4 border border-gray-200 dark:border-white/10">
                    <h6 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      Still having issues?
                    </h6>
                    <p className="text-xs text-gray-600 dark:text-white/60 mb-3">
                      If the above solutions didn&apos;t help, our support team is
                      here for you:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="mailto:support@imbox.app"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        Contact Support
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href="https://status.imbox.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white/70 text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Check Service Status
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredIssues.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            No Issues in This Category
          </h3>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Try selecting a different category or contact support if you need help
          </p>
        </div>
      )}

      {/* Additional Resources */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Need More Help?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/help"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Search className="h-4 w-4" />
            Browse Help Center
          </a>
          <a
            href="https://docs.imbox.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Read Documentation
          </a>
          <a
            href="mailto:support@imbox.app"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}

