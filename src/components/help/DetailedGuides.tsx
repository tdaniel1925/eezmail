'use client';

import { useState } from 'react';
import {
  Mail,
  Inbox,
  Newspaper,
  FileText,
  Sparkles,
  Folder,
  Tag,
  Clock,
  Search,
  Settings,
  Shield,
  Zap,
  Users,
  Mic,
  Paperclip,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Guide {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  sections: GuideSection[];
  videoUrl?: string;
}

interface GuideSection {
  title: string;
  content: React.ReactNode;
}

export function DetailedGuides(): JSX.Element {
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionTitle: string): void => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const guides: Guide[] = [
    {
      id: 'email-categories',
      title: 'Email Categories Explained',
      icon: Inbox,
      description:
        'Understand Priority Inbox, Feed, and Paper Trail and how emails are categorized',
      videoUrl: 'https://youtube.com/watch?v=example',
      sections: [
        {
          title: 'The Three-Tier System',
          content: (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-white/70">
                EaseMail uses a three-tier categorization system designed to help you focus on what matters most while keeping everything organized.
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    📬 Priority Inbox (VIP Inbox)
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                    Your priority inbox for important personal and work emails.
                  </p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                    Typically includes:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-white/60 space-y-1">
                    <li>• Direct messages from colleagues and clients</li>
                    <li>• Emails from people in your contacts</li>
                    <li>• Important notifications you&apos;ve marked</li>
                    <li>• Urgent or time-sensitive messages</li>
                  </ul>
                </div>

                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-500/10 p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    📰 Feed (Updates & Newsletters)
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                    Bulk emails, newsletters, and updates you can read when convenient.
                  </p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                    Typically includes:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-white/60 space-y-1">
                    <li>• Newsletter subscriptions</li>
                    <li>• Marketing emails and promotions</li>
                    <li>• Social media notifications</li>
                    <li>• Product updates and announcements</li>
                  </ul>
                </div>

                <div className="rounded-lg border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-500/10 p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                    🧾 Paper Trail (Receipts & Confirmations)
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-white/70 mb-2">
                    Transactional emails organized for easy reference and searching.
                  </p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                    Typically includes:
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-white/60 space-y-1">
                    <li>• Order confirmations and receipts</li>
                    <li>• Shipping and delivery notifications</li>
                    <li>• Payment confirmations</li>
                    <li>• Booking confirmations (travel, events, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: 'How Categorization Works',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                EaseMail uses AI and machine learning to automatically categorize incoming emails based on multiple factors:
              </p>

              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Sender Analysis:</strong>
                    <span className="text-gray-600 dark:text-white/60"> Is the sender in your contacts? Have you emailed them before?</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Content Analysis:</strong>
                    <span className="text-gray-600 dark:text-white/60"> AI examines the email content, subject, and structure</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Your History:</strong>
                    <span className="text-gray-600 dark:text-white/60"> System learns from your past categorization decisions</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs flex-shrink-0">
                    4
                  </div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Pattern Recognition:</strong>
                    <span className="text-gray-600 dark:text-white/60"> Identifies common patterns like newsletters, receipts, etc.</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-3">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Pro Tip:</strong> The more you use EaseMail and correct categorizations, the smarter the system becomes. It typically achieves 95%+ accuracy after a few days of use!
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Moving Emails Between Categories',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                You can manually move emails between categories to train the AI and organize your inbox:
              </p>

              <div className="space-y-2">
                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3">
                  <h6 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                    Method 1: Right-Click Menu
                  </h6>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                    <li>Right-click on any email</li>
                    <li>Select &quot;Move to...&quot;</li>
                    <li>Choose the destination category</li>
                  </ol>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3">
                  <h6 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                    Method 2: Drag and Drop
                  </h6>
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    Click and drag an email to the desired category in the sidebar
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3">
                  <h6 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                    Method 3: Keyboard Shortcuts
                  </h6>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-white/60">
                    <p>• Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">V</kbd> then <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">I</kbd> for Priority Inbox</p>
                    <p>• Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">V</kbd> then <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">F</kbd> for Feed</p>
                    <p>• Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">V</kbd> then <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">P</kbd> for Paper Trail</p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'ai-features',
      title: 'AI-Powered Features',
      icon: Sparkles,
      description: 'Smart email management with AI screening, summaries, and quick replies',
      sections: [
        {
          title: 'Email Screening',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                When someone emails you for the first time, EaseMail&apos;s AI Screener analyzes the email and suggests the best category.
              </p>

              <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  How Screening Works:
                </h6>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-700 dark:text-white/70">
                  <li>Email arrives from new sender</li>
                  <li>AI analyzes content, sender info, and context</li>
                  <li>System suggests category (Priority Inbox/Feed/Paper Trail)</li>
                  <li>You review and approve/modify the suggestion</li>
                  <li>Future emails from that sender follow your preference</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  Screening Actions:
                </h6>
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      ✅ Accept Suggestion
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Click &quot;Accept&quot; to use AI&apos;s recommendation
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      🔄 Override
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Choose a different category to teach the AI your preference
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      🚫 Block Sender
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/60">
                      Permanently block unwanted senders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: 'AI Summaries',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Get the gist of long emails instantly with AI-generated summaries that capture key points and action items.
              </p>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Summary Features:
                </h6>
                <ul className="space-y-1 text-xs text-gray-700 dark:text-white/70">
                  <li>• <strong>Key Points:</strong> Main topics and important information</li>
                  <li>• <strong>Action Items:</strong> Tasks or responses needed</li>
                  <li>• <strong>Sentiment:</strong> Tone detection (urgent, positive, neutral, etc.)</li>
                  <li>• <strong>Context:</strong> Relevant background from previous emails</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  How to Use:
                </h6>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Open any email</li>
                  <li>Look for the AI summary at the top (appears automatically for emails over 100 words)</li>
                  <li>Click &quot;Show Full Email&quot; to read the complete message</li>
                </ol>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-3">
                <p className="text-xs text-yellow-900 dark:text-yellow-300">
                  <strong>Tip:</strong> Summaries are especially useful for newsletters and long email threads. You can enable/disable them in Settings → AI Preferences.
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Quick Replies',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                AI-generated response suggestions that match your communication style and context.
              </p>

              <div className="space-y-2">
                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4">
                  <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                    Response Types:
                  </h6>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-xs flex-shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          Quick Confirm
                        </div>
                        <div className="text-xs text-gray-600 dark:text-white/60">
                          &quot;Yes, I&apos;ll be there&quot;, &quot;Sounds good&quot;, etc.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-xs flex-shrink-0">
                        ?
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          Clarifying Question
                        </div>
                        <div className="text-xs text-gray-600 dark:text-white/60">
                          Request more information or clarification
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 rounded bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-xs flex-shrink-0">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          Detailed Response
                        </div>
                        <div className="text-xs text-gray-600 dark:text-white/60">
                          Comprehensive reply with full context
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4">
                  <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                    Tone Options:
                  </h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-white dark:bg-white/5 p-2">
                      <strong className="text-gray-900 dark:text-white">Professional</strong>
                      <p className="text-gray-600 dark:text-white/60">Formal business tone</p>
                    </div>
                    <div className="rounded bg-white dark:bg-white/5 p-2">
                      <strong className="text-gray-900 dark:text-white">Casual</strong>
                      <p className="text-gray-600 dark:text-white/60">Friendly, relaxed</p>
                    </div>
                    <div className="rounded bg-white dark:bg-white/5 p-2">
                      <strong className="text-gray-900 dark:text-white">Friendly</strong>
                      <p className="text-gray-600 dark:text-white/60">Warm and personable</p>
                    </div>
                    <div className="rounded bg-white dark:bg-white/5 p-2">
                      <strong className="text-gray-900 dark:text-white">Formal</strong>
                      <p className="text-gray-600 dark:text-white/60">Very professional</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-3">
                <p className="text-xs text-indigo-900 dark:text-indigo-300">
                  <strong>Customize:</strong> Set your preferred default tone in Settings → AI Preferences → Quick Reply Tone
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'organization',
      title: 'Email Organization',
      icon: Folder,
      description: 'Folders, labels, filters, and smart organization tools',
      sections: [
        {
          title: 'Custom Folders',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Create custom folders to organize emails beyond the main categories.
              </p>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  Creating Folders:
                </h6>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Go to Settings → Folders & Labels</li>
                  <li>Click &quot;Create New Folder&quot;</li>
                  <li>Name your folder (e.g., &quot;Clients&quot;, &quot;Projects&quot;, &quot;Events&quot;)</li>
                  <li>Choose an icon and color for easy identification</li>
                  <li>Save and it appears in your sidebar</li>
                </ol>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Folder Operations:
                </h6>
                <ul className="space-y-1 text-xs text-gray-700 dark:text-white/70">
                  <li>• Drag emails to folders to organize</li>
                  <li>• Right-click folders for options (rename, delete, etc.)</li>
                  <li>• Create nested folders for sub-categories</li>
                  <li>• Set folder-specific rules for auto-sorting</li>
                </ul>
              </div>

              <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-3">
                <p className="text-xs text-green-900 dark:text-green-300">
                  <strong>Best Practice:</strong> Keep your folder structure simple. 5-10 main folders with occasional sub-folders works best for most users.
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Labels and Tags',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Labels allow you to tag emails with multiple categories without moving them from their folder.
              </p>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Label vs. Folder:
                </h6>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <strong className="text-gray-900 dark:text-white">Folders 📁</strong>
                    <p className="text-gray-600 dark:text-white/60">
                      Email can only be in one folder at a time
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-gray-900 dark:text-white">Labels 🏷️</strong>
                    <p className="text-gray-600 dark:text-white/60">
                      Email can have multiple labels
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  Using Labels:
                </h6>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Select email(s)</li>
                  <li>Click the label icon in toolbar</li>
                  <li>Choose existing label or create new one</li>
                  <li>Apply multiple labels to the same email</li>
                  <li>Filter by label in sidebar</li>
                </ul>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-3">
                <p className="text-xs text-gray-700 dark:text-white/70">
                  <strong>Example use cases:</strong> Label emails as &quot;Urgent&quot;, &quot;Follow-up&quot;, &quot;Waiting for response&quot;, or create project-specific labels like &quot;Q4 Launch&quot;
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Filters and Rules',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Automate email organization with smart rules and filters.
              </p>

              <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Rule Components:
                </h6>
                <div className="space-y-2">
                  <div className="text-xs">
                    <strong className="text-gray-900 dark:text-white">1. Trigger (When):</strong>
                    <p className="text-gray-600 dark:text-white/60 ml-4">
                      When emails arrive from, to, or containing specific criteria
                    </p>
                  </div>
                  <div className="text-xs">
                    <strong className="text-gray-900 dark:text-white">2. Conditions (If):</strong>
                    <p className="text-gray-600 dark:text-white/60 ml-4">
                      Optional: Check for subject keywords, sender domain, attachments, etc.
                    </p>
                  </div>
                  <div className="text-xs">
                    <strong className="text-gray-900 dark:text-white">3. Action (Then):</strong>
                    <p className="text-gray-600 dark:text-white/60 ml-4">
                      Move to folder, apply label, mark as read, archive, etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  Common Rule Examples:
                </h6>
                <div className="space-y-2">
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3 text-xs">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Auto-sort newsletters
                    </div>
                    <div className="text-gray-600 dark:text-white/60">
                      If from @newsletter.com → Move to Feed folder
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3 text-xs">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Priority clients
                    </div>
                    <div className="text-gray-600 dark:text-white/60">
                      If from @importantclient.com → Star + Label &quot;VIP&quot;
                    </div>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-3 text-xs">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      Receipts
                    </div>
                    <div className="text-gray-600 dark:text-white/60">
                      If subject contains &quot;receipt&quot; or &quot;invoice&quot; → Move to Paper Trail
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-3">
                <p className="text-xs text-yellow-900 dark:text-yellow-300">
                  <strong>Pro Tip:</strong> Test rules with &quot;Apply to existing emails&quot; to see how they work before enabling them permanently.
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'search',
      title: 'Advanced Search',
      icon: Search,
      description: 'Find any email instantly with powerful search operators',
      sections: [
        {
          title: 'Basic Search',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Use the search bar at the top to find emails by content, sender, subject, or date.
              </p>

              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Quick Search Tips:
                </h6>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Just type keywords to search all emails</li>
                  <li>Search is instant - results appear as you type</li>
                  <li>Search includes subject, body, sender, and recipients</li>
                  <li>Click any result to open the email</li>
                </ul>
              </div>
            </div>
          ),
        },
        {
          title: 'Search Operators',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Use advanced operators to narrow down search results:
              </p>

              <div className="space-y-2">
                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    from:email@example.com
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails from specific sender
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    to:email@example.com
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails sent to specific recipient
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    subject:meeting
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Search in subject line only
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    has:attachment
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails with attachments
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    after:2024-01-01
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails after specific date
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    before:2024-12-31
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails before specific date
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    is:unread
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find unread emails (also: is:read, is:starred)
                  </div>
                </div>

                <div className="rounded bg-gray-50 dark:bg-white/5 p-3">
                  <div className="font-mono text-xs text-primary mb-1">
                    label:urgent
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60">
                    Find emails with specific label
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 p-3">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  <strong>Combine operators:</strong> Use multiple operators together, like <code className="bg-blue-200 dark:bg-blue-700 px-1 rounded">from:boss@company.com has:attachment after:2024-01-01</code>
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'voice-messages',
      title: 'Voice Messages',
      icon: Mic,
      description: 'Record and send voice messages within emails',
      sections: [
        {
          title: 'Recording Voice Messages',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                Add a personal touch by recording voice messages to include in your emails.
              </p>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  How to Record:
                </h6>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Click &quot;Compose&quot; to start a new email</li>
                  <li>Click the microphone icon in the composer</li>
                  <li>Allow microphone access if prompted</li>
                  <li>Click the red record button to start</li>
                  <li>Speak your message (max 5 minutes)</li>
                  <li>Click stop when finished</li>
                  <li>Review and optionally re-record</li>
                  <li>Click &quot;Attach&quot; to add to your email</li>
                </ol>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-white/5 p-4">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Recording Tips:
                </h6>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li>Use a quiet environment for best quality</li>
                  <li>Speak clearly and at normal pace</li>
                  <li>Keep messages under 2 minutes for best results</li>
                  <li>Test your microphone before important recordings</li>
                </ul>
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-3">
                <p className="text-xs text-yellow-900 dark:text-yellow-300">
                  <strong>Browser Support:</strong> Voice messages work best in Chrome, Edge, and Safari. Firefox may have limited support.
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Playing Voice Messages',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-white/70">
                When you receive an email with a voice message, you&apos;ll see a playback control in the email.
              </p>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-4 space-y-2">
                <h6 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Playback Controls:
                </h6>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-white/60">
                  <li><strong>Play/Pause:</strong> Click to start or pause playback</li>
                  <li><strong>Seek:</strong> Drag the progress bar to jump to any point</li>
                  <li><strong>Speed:</strong> Adjust playback speed (0.5x to 2x)</li>
                  <li><strong>Download:</strong> Save the audio file to your device</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                  Keyboard Shortcuts:
                </h6>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">Space</kbd>
                    <span className="text-gray-600 dark:text-white/60">Play/Pause</span>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">→</kbd>
                    <span className="text-gray-600 dark:text-white/60">Skip forward 5s</span>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">←</kbd>
                    <span className="text-gray-600 dark:text-white/60">Skip back 5s</span>
                  </div>
                  <div className="rounded bg-gray-50 dark:bg-white/5 p-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded mr-1">M</kbd>
                    <span className="text-gray-600 dark:text-white/60">Mute/Unmute</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  const selectedGuideData = guides.find((g) => g.id === selectedGuide);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Detailed Feature Guides
        </h2>
        <p className="text-sm text-gray-600 dark:text-white/60">
          In-depth instructions for all EaseMail features
        </p>
      </div>

      {!selectedGuideData ? (
        /* Guide Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <button
                key={guide.id}
                onClick={() => setSelectedGuide(guide.id)}
                className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all text-left group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    {guide.title}
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    {guide.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-white/50">
                    <span>{guide.sections.length} sections</span>
                    {guide.videoUrl && (
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" />
                        Video available
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Selected Guide Content */
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedGuide(null)}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to all guides
          </button>

          {/* Guide Header */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
                <selectedGuideData.icon className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedGuideData.title}
                </h2>
                <p className="text-gray-600 dark:text-white/60">
                  {selectedGuideData.description}
                </p>
              </div>
            </div>

            {selectedGuideData.videoUrl && (
              <div className="mt-4">
                <a
                  href={selectedGuideData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <PlayCircle className="h-4 w-4" />
                  Watch Video Tutorial
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Guide Sections */}
          <div className="space-y-3">
            {selectedGuideData.sections.map((section, index) => {
              const isExpanded = expandedSections.has(section.title);
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h4>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 dark:text-white/50 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-white/50 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-200 dark:border-white/10 pt-5">
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

