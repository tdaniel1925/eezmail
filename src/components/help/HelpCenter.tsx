'use client';

import { useState } from 'react';
import {
  Search,
  BookOpen,
  MessageCircle,
  Video,
  Keyboard,
  ExternalLink,
  HelpCircle,
  Mic,
  Paperclip,
  Settings,
  AlertTriangle,
  Shield,
  CreditCard,
} from 'lucide-react';
import { Accordion, type AccordionItem } from '@/components/ui/accordion';
import { KeyboardShortcuts } from './KeyboardShortcuts';

export function HelpCenter(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics',
      articles: [
        'Setting up your first email account',
        'Understanding Inbox vs Feed vs Paper Trail',
        'Connecting Gmail, Outlook, or IMAP',
        'Customizing your settings',
        'First steps with easeMail',
        'Importing your existing emails',
      ],
    },
    {
      id: 'voice-messages',
      name: 'Voice Messages',
      icon: Mic,
      description: 'Record and send voice messages',
      articles: [
        'Recording your first voice message',
        'Voice message settings and quality',
        'Playing voice messages',
        'Voice message troubleshooting',
        'Browser compatibility for voice',
        'Voice message file sizes',
      ],
    },
    {
      id: 'ai-features',
      name: 'AI Features',
      icon: HelpCircle,
      description: 'AI-powered email management',
      articles: [
        'How email screening works',
        'Using AI summaries and quick replies',
        'Smart actions and auto-classification',
        'Customizing AI behavior',
        'AI-powered email composition',
        'Thread analysis and insights',
      ],
    },
    {
      id: 'organization',
      name: 'Email Organization',
      icon: MessageCircle,
      description: 'Organize your inbox',
      articles: [
        'Using labels and folders',
        'Setting up filters and rules',
        'Reply Later and Set Aside',
        'Archiving and searching',
        'Custom folders and labels',
        'Email threading and conversations',
      ],
    },
    {
      id: 'attachments',
      name: 'Attachments',
      icon: Paperclip,
      description: 'Manage email attachments',
      articles: [
        'Viewing and downloading attachments',
        'Attachment search and filtering',
        'AI-powered attachment analysis',
        'Attachment storage and limits',
        'Supported file types',
        'Bulk attachment operations',
      ],
    },
    {
      id: 'settings',
      name: 'Settings & Customization',
      icon: Settings,
      description: 'Customize your experience',
      articles: [
        'Account settings',
        'Email preferences',
        'Voice message settings',
        'AI preferences',
        'Notification settings',
        'Appearance and themes',
      ],
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      icon: AlertTriangle,
      description: 'Fix common issues',
      articles: [
        'Email sync problems',
        'Voice message issues',
        'AI features not working',
        'Browser compatibility',
        'Performance issues',
        'Login and authentication',
      ],
    },
    {
      id: 'security',
      name: 'Security & Privacy',
      icon: Shield,
      description: 'Keep your data safe',
      articles: [
        'Data encryption and security',
        'Privacy settings',
        'Two-factor authentication',
        'Data export and backup',
        'Account security',
        'GDPR compliance',
      ],
    },
    {
      id: 'billing',
      name: 'Billing & Subscriptions',
      icon: CreditCard,
      description: 'Manage your subscription',
      articles: [
        'Subscription plans',
        'Billing and payments',
        'Upgrading or downgrading',
        'Canceling subscription',
        'Refunds and credits',
        'Enterprise features',
      ],
    },
    {
      id: 'keyboard',
      name: 'Keyboard Shortcuts',
      icon: Keyboard,
      description: 'Work faster with shortcuts',
      articles: [
        'Essential keyboard shortcuts',
        'Navigation shortcuts',
        'Email actions shortcuts',
        'Custom keyboard shortcuts',
        'Voice message shortcuts',
        'Accessibility shortcuts',
      ],
    },
  ];

  const faqItems: AccordionItem[] = [
    {
      id: 'faq-1',
      title: 'What is the difference between Inbox, Feed, and Paper Trail?',
      content: (
        <div className="space-y-2">
          <p>
            <strong>Inbox:</strong> Important emails from people and services
            you care about. Think of it as your VIP inbox.
          </p>
          <p>
            <strong>Feed:</strong> Newsletters, updates, and marketing emails.
            Read them when you have time.
          </p>
          <p>
            <strong>Paper Trail:</strong> Receipts, confirmations, and
            transactional emails. Automatically organized for reference.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-2',
      title: 'How does AI email screening work?',
      content: (
        <div className="space-y-2">
          <p>
            When someone emails you for the first time, our AI analyzes the
            email content, sender information, and context to suggest whether it
            should go to your Inbox, Feed, or Paper Trail.
          </p>
          <p>
            You can accept, modify, or override the AI&apos;s suggestion. Over
            time, the system learns your preferences and becomes more accurate.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-3',
      title: 'Can I use easeMail with multiple email accounts?',
      content: (
        <div className="space-y-2">
          <p>
            Yes! You can connect multiple Gmail, Outlook, Yahoo, or custom IMAP
            accounts.
          </p>
          <p>
            The Pro plan supports up to 5 accounts, and the Team plan supports
            up to 15 accounts. All accounts can be managed from a single unified
            interface.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-4',
      title: 'Is my email data secure?',
      content: (
        <div className="space-y-2">
          <p>
            Absolutely. We use bank-level encryption for all data in transit and
            at rest. Your emails are stored securely and never used to train AI
            models or shared with third parties.
          </p>
          <p>
            We use OAuth authentication whenever possible, which means we never
            store your email password. You can revoke access at any time.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-5',
      title: 'How do Quick Replies work?',
      content: (
        <div className="space-y-2">
          <p>
            Quick Replies are AI-generated response suggestions that appear when
            you open an email. They&apos;re contextually aware and match your
            communication style.
          </p>
          <p>
            You can customize the tone (professional, casual, friendly, formal)
            in your AI preferences. Just click a suggestion to use it, or edit
            it before sending.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-6',
      title: 'Can I export my data?',
      content: (
        <div className="space-y-2">
          <p>
            Yes! You can export all your emails, settings, and data at any time
            in standard formats (MBOX, EML, JSON).
          </p>
          <p>
            Go to Settings → Account → Export Data to download your complete
            email archive.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-7',
      title: 'What happens if I cancel my subscription?',
      content: (
        <div className="space-y-2">
          <p>
            If you cancel a paid subscription, you&apos;ll continue to have
            access to Pro features until the end of your billing period.
          </p>
          <p>
            After that, your account will revert to the Free plan. Your emails
            and data remain accessible, but some advanced features will be
            limited.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-8',
      title: 'How do I report a bug or request a feature?',
      content: (
        <div className="space-y-2">
          <p>We love feedback! You can report bugs or request features by:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Using the feedback button in the app</li>
            <li>Emailing support@imbox.app</li>
            <li>Joining our community Discord</li>
          </ul>
          <p>We review all suggestions and prioritize based on user demand.</p>
        </div>
      ),
    },
  ];

  const filteredFAQs = searchQuery
    ? faqItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof item.content === 'string' &&
            item.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : faqItems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Help Center
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
          Find answers to common questions and learn how to use easeMail
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-white/60" />
        <input
          type="text"
          placeholder="Search help articles and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 transition-all duration-200 focus:border-gray-300 dark:focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary flex-shrink-0">
            <Keyboard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
              View all keyboard shortcuts
            </div>
          </div>
        </button>

        <a
          href="https://docs.imbox.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Full Documentation
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
              Complete guides and tutorials
            </div>
          </div>
        </a>

        <a
          href="https://youtube.com/imbox"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex-shrink-0">
            <Video className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Video Tutorials
              <ExternalLink className="h-4 w-4" />
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
              Watch step-by-step guides
            </div>
          </div>
        </a>

        <a
          href="mailto:support@imbox.app"
          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-gray-50/80 dark:hover:bg-white/10 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 flex-shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              Contact Support
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60 mt-1">
              Get help from our team
            </div>
          </div>
        </a>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Browse by Category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="h-5 w-5 text-gray-700 dark:text-white/70" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
                  {category.description}
                </p>
                <ul className="space-y-2">
                  {category.articles.slice(0, 4).map((article) => (
                    <li key={article}>
                      <button className="text-sm text-primary hover:underline text-left">
                        {article}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h3>

        <Accordion items={filteredFAQs} />

        {filteredFAQs.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-600 dark:text-white/60">
              No results found for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
