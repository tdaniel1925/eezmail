'use client';

import { useState } from 'react';
import { HelpCenter } from '@/components/help/HelpCenter';
import { QuickStartGuide } from '@/components/help/QuickStartGuide';
import { DetailedGuides } from '@/components/help/DetailedGuides';
import { Troubleshooting } from '@/components/help/Troubleshooting';
import {
  BookOpen,
  PlayCircle,
  LifeBuoy,
  Zap,
  MessageCircle,
  Video,
  ExternalLink,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'quick-start' | 'guides' | 'troubleshooting' | 'videos';

export default function HelpPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    {
      id: 'overview' as Tab,
      name: 'Help Center',
      icon: BookOpen,
      description: 'Browse all help resources',
    },
    {
      id: 'quick-start' as Tab,
      name: 'Quick Start',
      icon: Zap,
      description: 'Get started in minutes',
    },
    {
      id: 'guides' as Tab,
      name: 'Detailed Guides',
      icon: BookOpen,
      description: 'In-depth feature tutorials',
    },
    {
      id: 'troubleshooting' as Tab,
      name: 'Troubleshooting',
      icon: LifeBuoy,
      description: 'Fix common issues',
    },
    {
      id: 'videos' as Tab,
      name: 'Video Tutorials',
      icon: Video,
      description: 'Watch and learn',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Help & Documentation
              </h1>
              <p className="mt-2 text-gray-600 dark:text-white/60">
                Everything you need to master EaseMail
              </p>
            </div>
            <a
              href="mailto:support@imbox.app"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </a>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <HelpCenter />}
        {activeTab === 'quick-start' && <QuickStartGuide />}
        {activeTab === 'guides' && <DetailedGuides />}
        {activeTab === 'troubleshooting' && <Troubleshooting />}
        {activeTab === 'videos' && <VideoTutorials />}
      </div>
    </div>
  );
}

function VideoTutorials(): JSX.Element {
  const tutorials = [
    {
      id: 'getting-started',
      title: 'Getting Started with EaseMail',
      description: 'Learn the basics in under 5 minutes',
      duration: '4:32',
      thumbnail: '/thumbnails/getting-started.jpg',
      videoUrl: 'https://youtube.com/watch?v=example1',
      category: 'Basics',
    },
    {
      id: 'connect-email',
      title: 'Connecting Your First Email Account',
      description: 'Step-by-step guide to connecting Gmail, Outlook, or IMAP',
      duration: '3:15',
      thumbnail: '/thumbnails/connect-email.jpg',
      videoUrl: 'https://youtube.com/watch?v=example2',
      category: 'Basics',
    },
    {
      id: 'categories-explained',
      title: 'Understanding Priority Inbox, Feed & Paper Trail',
      description: 'How the three-tier system organizes your emails',
      duration: '6:10',
      thumbnail: '/thumbnails/categories.jpg',
      videoUrl: 'https://youtube.com/watch?v=example3',
      category: 'Organization',
    },
    {
      id: 'ai-features',
      title: 'Using AI Features',
      description: 'Email screening, smart summaries, and quick replies',
      duration: '8:45',
      thumbnail: '/thumbnails/ai-features.jpg',
      videoUrl: 'https://youtube.com/watch?v=example4',
      category: 'AI Features',
    },
    {
      id: 'voice-messages',
      title: 'Recording Voice Messages',
      description: 'Add a personal touch with voice messages in emails',
      duration: '5:20',
      thumbnail: '/thumbnails/voice-messages.jpg',
      videoUrl: 'https://youtube.com/watch?v=example5',
      category: 'Features',
    },
    {
      id: 'folders-labels',
      title: 'Organizing with Folders and Labels',
      description: 'Create custom folders and use labels effectively',
      duration: '7:30',
      thumbnail: '/thumbnails/folders-labels.jpg',
      videoUrl: 'https://youtube.com/watch?v=example6',
      category: 'Organization',
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts Master Class',
      description: 'Work faster with essential keyboard shortcuts',
      duration: '10:15',
      thumbnail: '/thumbnails/shortcuts.jpg',
      videoUrl: 'https://youtube.com/watch?v=example7',
      category: 'Productivity',
    },
    {
      id: 'advanced-search',
      title: 'Advanced Search Techniques',
      description: 'Find any email instantly with search operators',
      duration: '6:45',
      thumbnail: '/thumbnails/search.jpg',
      videoUrl: 'https://youtube.com/watch?v=example8',
      category: 'Productivity',
    },
    {
      id: 'filters-rules',
      title: 'Automating Email with Filters and Rules',
      description: 'Set up smart rules to organize emails automatically',
      duration: '9:00',
      thumbnail: '/thumbnails/rules.jpg',
      videoUrl: 'https://youtube.com/watch?v=example9',
      category: 'Advanced',
    },
    {
      id: 'troubleshooting',
      title: 'Common Issues and Solutions',
      description: 'Fix sync problems, connection issues, and more',
      duration: '12:30',
      thumbnail: '/thumbnails/troubleshooting.jpg',
      videoUrl: 'https://youtube.com/watch?v=example10',
      category: 'Support',
    },
  ];

  const categories = ['All', 'Basics', 'Organization', 'AI Features', 'Features', 'Productivity', 'Advanced', 'Support'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTutorials = selectedCategory === 'All'
    ? tutorials
    : tutorials.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Youtube className="h-6 w-6 text-red-600 dark:text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Video Tutorials
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-white/60">
          Watch step-by-step video guides to master every feature
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap',
              selectedCategory === category
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => (
          <a
            key={tutorial.id}
            href={tutorial.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden hover:shadow-lg transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <PlayCircle className="relative h-16 w-16 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium">
                {tutorial.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {tutorial.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors line-clamp-2">
                {tutorial.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/60 line-clamp-2">
                {tutorial.description}
              </p>
              <div className="mt-3 flex items-center gap-1 text-sm text-primary group-hover:underline">
                Watch on YouTube
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* YouTube Channel CTA */}
      <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-center">
        <Youtube className="h-12 w-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Subscribe for More Tutorials
        </h3>
        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          Get notified when we release new video guides and tips
        </p>
        <a
          href="https://youtube.com/@imbox"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          <Youtube className="h-5 w-5" />
          Subscribe on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

