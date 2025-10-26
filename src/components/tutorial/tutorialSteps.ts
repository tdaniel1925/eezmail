/**
 * Tutorial Steps Configuration
 *
 * Predefined tutorial flows for different features
 */

import { TutorialStep } from './TutorialOverlay';

/**
 * First-time onboarding tutorial (5 steps)
 */
export const firstTimeOnboardingSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to EaseMail!',
    description:
      "Let's take a quick 2-minute tour to help you get started. You can skip this anytime and revisit it from Settings → Help.",
    targetSelector: '[data-tutorial="main-content"]',
    position: 'center',
  },
  {
    id: 'inbox-overview',
    title: 'Your Inbox',
    description:
      'This is your main inbox where all emails appear. Use the search box to quickly find any email by sender, subject, or content.',
    targetSelector: '[data-tutorial="email-list"]',
    position: 'right',
  },
  {
    id: 'sidebar-folders',
    title: 'Organize with Folders',
    description:
      'Access your Imbox (VIPs), Feed (newsletters), Paper Trail (receipts), and custom folders here. Click any folder to filter your emails.',
    targetSelector: '[data-tutorial="sidebar"]',
    position: 'right',
  },
  {
    id: 'compose-button',
    title: 'Compose New Emails',
    description:
      'Click here to compose a new email. You can also use AI to write emails, add voice messages, and more!',
    targetSelector: '[data-tutorial="compose-button"]',
    position: 'bottom',
  },
  {
    id: 'ai-assistant',
    title: 'Your AI Assistant',
    description:
      'Ask questions, search emails, get summaries, and more with your AI assistant. Try asking "Show me emails from my boss" or "Summarize my unread emails".',
    targetSelector: '[data-tutorial="ai-panel"]',
    position: 'left',
  },
];

/**
 * Email compose tutorial (4 steps)
 */
export const emailComposeTutorialSteps: TutorialStep[] = [
  {
    id: 'compose-basics',
    title: 'Compose Your Email',
    description:
      'Fill in the recipient, subject, and message. The compose window supports rich text formatting.',
    targetSelector: '[data-tutorial="compose-form"]',
    position: 'top',
  },
  {
    id: 'ai-features',
    title: 'AI Writing Tools',
    description:
      'Use AI Remix to rewrite your text, AI Writer to generate content, or AI Dictation to speak your message.',
    targetSelector: '[data-tutorial="ai-buttons"]',
    position: 'bottom',
  },
  {
    id: 'attachments',
    title: 'Add Attachments',
    description:
      'Click the paperclip icon to attach files. You can also drag and drop files directly into the compose window.',
    targetSelector: '[data-tutorial="attach-button"]',
    position: 'bottom',
  },
  {
    id: 'send-schedule',
    title: 'Send or Schedule',
    description:
      'Send immediately or schedule your email for later. Perfect for timing messages to different time zones!',
    targetSelector: '[data-tutorial="send-button"]',
    position: 'top',
  },
];

/**
 * AI Assistant tutorial (3 steps)
 */
export const aiAssistantTutorialSteps: TutorialStep[] = [
  {
    id: 'chat-tab',
    title: 'AI Assistant Chat',
    description:
      'Ask your AI assistant anything about your emails. Try "Find emails about project deadlines" or "Draft a reply to John".',
    targetSelector: '[data-tutorial="chat-tab"]',
    position: 'left',
  },
  {
    id: 'people-tab',
    title: 'Contact Intelligence',
    description:
      'View sender details, previous conversations, and add contacts directly from the People tab.',
    targetSelector: '[data-tutorial="people-tab"]',
    position: 'left',
  },
  {
    id: 'actions-tab',
    title: 'Quick Actions',
    description:
      'Access quick actions like Reply Later, Schedule Follow-up, and more from the Actions tab.',
    targetSelector: '[data-tutorial="actions-tab"]',
    position: 'left',
  },
];

/**
 * Settings tutorial (4 steps)
 */
export const settingsTutorialSteps: TutorialStep[] = [
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your profile, password, and account preferences here.',
    targetSelector: '[data-tutorial="account-tab"]',
    position: 'right',
  },
  {
    id: 'email-accounts',
    title: 'Email Accounts',
    description:
      'Connect multiple email accounts (Gmail, Outlook, etc.) and manage sync settings.',
    targetSelector: '[data-tutorial="email-accounts-tab"]',
    position: 'right',
  },
  {
    id: 'ai-preferences',
    title: 'AI Preferences',
    description:
      'Choose between Traditional, Hey Mode, or Hybrid email workflows. Configure AI features to match your style.',
    targetSelector: '[data-tutorial="ai-preferences-tab"]',
    position: 'right',
  },
  {
    id: 'display-settings',
    title: 'Display Settings',
    description:
      'Customize theme, density, reading pane, and typography to make EaseMail your own.',
    targetSelector: '[data-tutorial="display-tab"]',
    position: 'right',
  },
];

/**
 * Email actions tutorial (3 steps)
 */
export const emailActionsTutorialSteps: TutorialStep[] = [
  {
    id: 'email-actions',
    title: 'Email Actions',
    description:
      'Reply, forward, archive, or delete emails using these quick action buttons.',
    targetSelector: '[data-tutorial="email-actions"]',
    position: 'bottom',
  },
  {
    id: 'reply-later',
    title: 'Reply Later',
    description:
      "Schedule emails to reply to later. They'll appear in your Reply Later queue at the bottom of the screen.",
    targetSelector: '[data-tutorial="reply-later-button"]',
    position: 'top',
  },
  {
    id: 'threading',
    title: 'Email Threads',
    description:
      'Click to view full conversation thread with AI-powered summaries and easy navigation.',
    targetSelector: '[data-tutorial="thread-button"]',
    position: 'top',
  },
];

/**
 * Helper function to check if tutorial has been completed
 */
export function isTutorialCompleted(tutorialId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`tutorial-${tutorialId}-completed`) === 'true';
}

/**
 * Helper function to check if tutorial has been skipped
 */
export function isTutorialSkipped(tutorialId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`tutorial-${tutorialId}-skipped`) === 'true';
}

/**
 * Helper function to reset tutorial status (for testing/support)
 */
export function resetTutorialStatus(tutorialId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`tutorial-${tutorialId}-completed`);
  localStorage.removeItem(`tutorial-${tutorialId}-skipped`);
}

/**
 * Helper function to reset all tutorials
 */
export function resetAllTutorials(): void {
  if (typeof window === 'undefined') return;
  const tutorialKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith('tutorial-')
  );
  tutorialKeys.forEach((key) => localStorage.removeItem(key));
}
