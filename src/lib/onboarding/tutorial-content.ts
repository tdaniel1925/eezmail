export interface TutorialStep {
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  destinationLink: string;
}

export const tutorials: Record<string, Tutorial> = {
  // Phase 1: Essential Setup
  emailConnected: {
    id: 'emailConnected',
    title: 'Connect Your Email Account',
    description: 'Learn how to connect your Microsoft or Gmail account',
    destinationLink: '/dashboard/settings?tab=email-accounts',
    steps: [
      {
        title: 'Welcome to easeMail!',
        description:
          "Let's connect your email account to get started. This will allow easeMail to sync your emails and provide AI-powered features.",
        highlight: false,
      },
      {
        title: 'Find the Connect Button',
        description:
          'Click the "Connect Email Account" button to begin the OAuth authentication flow.',
        targetSelector: '[data-tutorial="connect-account-btn"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Choose Your Provider',
        description:
          "Select Microsoft (Outlook, Office 365) or Gmail. You'll be redirected to securely authenticate with your email provider.",
        highlight: false,
      },
      {
        title: 'Authorize Access',
        description:
          'Grant easeMail permission to read and send emails on your behalf. Your credentials are never stored - we use secure OAuth tokens.',
        highlight: false,
      },
      {
        title: 'Start Syncing',
        description:
          'Once connected, easeMail will begin syncing your emails. This may take a few minutes for large mailboxes.',
        highlight: false,
      },
    ],
  },

  signatureConfigured: {
    id: 'signatureConfigured',
    title: 'Set Up Your Email Signature',
    description: 'Create a professional signature for your emails',
    destinationLink: '/dashboard/settings?tab=email-signatures',
    steps: [
      {
        title: 'Create Your Signature',
        description:
          'A professional email signature makes your emails look polished and helps recipients contact you easily.',
        highlight: false,
      },
      {
        title: 'Click Add Signature',
        description:
          'Click the "Add Signature" or "Create Signature" button to start creating your signature.',
        targetSelector: '[data-tutorial="add-signature-btn"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Enter Your Details',
        description:
          'Fill in your name, title, company, phone number, and other contact information. You can use plain text or HTML for formatting.',
        targetSelector: '[data-tutorial="signature-editor"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Set as Default',
        description:
          'Toggle "Set as Default" to automatically add this signature to all new emails you compose.',
        targetSelector: '[data-tutorial="default-signature-toggle"]',
        position: 'left',
        highlight: true,
      },
      {
        title: 'Save Your Signature',
        description:
          'Click "Save" to save your signature. You can create multiple signatures for different purposes.',
        targetSelector: '[data-tutorial="save-signature-btn"]',
        position: 'top',
        highlight: true,
      },
    ],
  },

  profileCompleted: {
    id: 'profileCompleted',
    title: 'Complete Your Profile',
    description: 'Set up your profile information and preferences',
    destinationLink: '/dashboard/settings',
    steps: [
      {
        title: 'Personalize Your Profile',
        description:
          'Complete your profile to help colleagues recognize you and set your preferences.',
        highlight: false,
      },
      {
        title: 'Upload Profile Photo',
        description:
          'Click to upload a profile photo. This will appear next to your name throughout the app.',
        targetSelector: '[data-tutorial="profile-photo"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Enter Your Name',
        description:
          'Fill in your full name. This will be used when sending emails and in your signature.',
        targetSelector: '[data-tutorial="name-fields"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Set Your Timezone',
        description:
          'Select your timezone to ensure email timestamps and scheduling features work correctly.',
        targetSelector: '[data-tutorial="timezone-selector"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Save Your Changes',
        description:
          'Click "Save Changes" to update your profile. You can come back and edit this anytime.',
        targetSelector: '[data-tutorial="save-profile-btn"]',
        position: 'top',
        highlight: true,
      },
    ],
  },

  // Phase 2: Quick Wins
  aiReplyTried: {
    id: 'aiReplyTried',
    title: 'Try the AI Reply Assistant',
    description: 'Generate professional email replies instantly with AI',
    destinationLink: '/dashboard/inbox',
    steps: [
      {
        title: 'AI-Powered Email Replies',
        description:
          "easeMail can write professional email replies for you in seconds using AI. Let's try it!",
        highlight: false,
      },
      {
        title: 'Select an Email',
        description:
          'Click on any email in your inbox to open it. The AI works best with emails that need a response.',
        targetSelector: '[data-tutorial="email-list"]',
        position: 'right',
        highlight: true,
      },
      {
        title: 'Click AI Summary',
        description:
          'Look for the sparkles ✨ icon and click it to see an AI summary of the email.',
        targetSelector: '[data-tutorial="ai-summary-btn"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Choose Reply Type',
        description:
          'Select from Professional Reply, Quick Acknowledgment, Detailed Response, or Custom Reply based on your needs.',
        targetSelector: '[data-tutorial="ai-reply-buttons"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Review and Send',
        description:
          'The AI will generate a reply and open the composer. Review the text, make any edits, and send!',
        highlight: false,
      },
    ],
  },

  smartInboxViewed: {
    id: 'smartInboxViewed',
    title: 'Explore Smart Inbox Categories',
    description: 'Learn how AI automatically categorizes your emails',
    destinationLink: '/dashboard/inbox',
    steps: [
      {
        title: 'AI-Powered Email Organization',
        description:
          'EaseMail automatically categorizes your emails into Priority Inbox, Feed, and Paper Trail using AI.',
        highlight: false,
      },
      {
        title: 'Priority Inbox - Important Emails',
        description:
          'Click the "Priority Inbox" tab to see emails from people you know and important messages that need your attention.',
        targetSelector: '[data-tutorial="imbox-tab"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Feed - Newsletters',
        description:
          'Click "Feed" to see newsletters, updates, and bulk emails. Read them when you have time.',
        targetSelector: '[data-tutorial="feed-tab"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Paper Trail - Receipts',
        description:
          'Click "Paper Trail" to see receipts, confirmations, and transactional emails. Searchable when you need them.',
        targetSelector: '[data-tutorial="paper-trail-tab"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Focus on What Matters',
        description:
          'This categorization helps you focus on important emails first, while keeping everything organized and searchable.',
        highlight: false,
      },
    ],
  },

  keyboardShortcutsLearned: {
    id: 'keyboardShortcutsLearned',
    title: 'Master Keyboard Shortcuts',
    description: 'Work faster with keyboard shortcuts',
    destinationLink: '/dashboard/inbox',
    steps: [
      {
        title: 'Work Faster with Shortcuts',
        description:
          'Keyboard shortcuts help you navigate and manage emails 10x faster than using your mouse.',
        highlight: false,
      },
      {
        title: 'Press ? for Help',
        description:
          'At any time, press the "?" key to see a complete list of available keyboard shortcuts.',
        highlight: false,
      },
      {
        title: 'Essential Shortcuts',
        description:
          '• C - Compose new email\n• / - Search emails\n• J/K - Navigate up/down\n• E - Archive email\n• # - Delete email\n• R - Reply',
        highlight: false,
      },
      {
        title: 'Try One Now',
        description:
          'Try pressing "C" right now to open the compose window. You can close it with "ESC".',
        highlight: false,
      },
      {
        title: 'Practice Makes Perfect',
        description:
          "The more you use shortcuts, the faster you'll work. Start with 2-3 favorites and gradually learn more.",
        highlight: false,
      },
    ],
  },

  // Phase 3: Power User
  contactsExplored: {
    id: 'contactsExplored',
    title: 'Explore Contact Intelligence',
    description: 'See relationship scores and communication history',
    destinationLink: '/dashboard/contacts',
    steps: [
      {
        title: 'Contact Intelligence',
        description:
          'easeMail tracks your communication patterns and builds relationship intelligence for every contact.',
        highlight: false,
      },
      {
        title: 'View Your Contacts',
        description:
          'Browse your contact list. easeMail automatically creates contacts from people you email.',
        targetSelector: '[data-tutorial="contacts-list"]',
        position: 'right',
        highlight: true,
      },
      {
        title: 'Click a Contact',
        description:
          'Click on any contact to see their full profile with communication history and relationship insights.',
        targetSelector: '[data-tutorial="contact-card"]',
        position: 'left',
        highlight: true,
      },
      {
        title: 'Relationship Score',
        description:
          'The relationship score shows how strong your connection is based on email frequency, response times, and engagement.',
        targetSelector: '[data-tutorial="relationship-score"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Communication Timeline',
        description:
          'Scroll down to see a complete timeline of all emails, calls, and SMS messages with this contact.',
        targetSelector: '[data-tutorial="timeline"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Quick Actions',
        description:
          'Use the "Email" and "SMS" buttons to quickly reach out to your contact.',
        targetSelector: '[data-tutorial="communication-actions"]',
        position: 'top',
        highlight: true,
      },
    ],
  },

  automationCreated: {
    id: 'automationCreated',
    title: 'Create Automation Rules',
    description: 'Automatically organize and manage your emails',
    destinationLink: '/dashboard/settings',
    steps: [
      {
        title: 'Email Automation',
        description:
          'Create rules to automatically organize, label, or take action on incoming emails.',
        highlight: false,
      },
      {
        title: 'Open Automation Settings',
        description:
          'Navigate to the Automation tab in settings to see your rules and create new ones.',
        targetSelector: '[data-tutorial="automation-tab"]',
        position: 'right',
        highlight: true,
      },
      {
        title: 'Create New Rule',
        description:
          'Click "Create Rule" or "Add Rule" to start setting up an automation.',
        targetSelector: '[data-tutorial="create-rule-btn"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Set Conditions',
        description:
          'Define when the rule should trigger: emails from specific senders, with certain subjects, or containing keywords.',
        targetSelector: '[data-tutorial="rule-conditions"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Choose Actions',
        description:
          'Select what happens: move to folder, mark as read, apply label, forward to another address, or delete.',
        targetSelector: '[data-tutorial="rule-actions"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Save and Enable',
        description:
          'Save your rule and toggle it on. The rule will now automatically process matching emails.',
        highlight: false,
      },
    ],
  },

  voiceFeatureTried: {
    id: 'voiceFeatureTried',
    title: 'Try Voice Features',
    description: 'Send voice messages and make calls',
    destinationLink: '/dashboard/contacts',
    steps: [
      {
        title: 'Voice Communication',
        description:
          'easeMail integrates with Twilio to let you send voice messages and make calls directly from contact records.',
        highlight: false,
      },
      {
        title: 'Open a Contact',
        description:
          'Navigate to the Contacts page and select any contact with a phone number.',
        targetSelector: '[data-tutorial="contacts-list"]',
        position: 'right',
        highlight: true,
      },
      {
        title: 'Find Voice Buttons',
        description:
          "Look for the phone or voice message buttons in the contact's communication actions.",
        targetSelector: '[data-tutorial="voice-buttons"]',
        position: 'bottom',
        highlight: true,
      },
      {
        title: 'Send Voice Message',
        description:
          'Click to record and send a voice message. This is great for quick, personal communication.',
        highlight: false,
      },
      {
        title: 'Configure Twilio',
        description:
          "To use voice features, you'll need to configure Twilio in Settings > Communication. You can use the system's Twilio or connect your own.",
        highlight: false,
      },
    ],
  },

  chatbotUsed: {
    id: 'chatbotUsed',
    title: 'Use the AI Chatbot Assistant',
    description: 'Ask questions about your emails with AI',
    destinationLink: '/dashboard/inbox',
    steps: [
      {
        title: 'Your AI Email Assistant',
        description:
          'The AI assistant can answer questions about your emails, find information, and help you stay organized.',
        highlight: false,
      },
      {
        title: 'Open the AI Panel',
        description:
          'Look for the AI assistant panel on the right side of your inbox. Click to open it if collapsed.',
        targetSelector: '[data-tutorial="ai-panel"]',
        position: 'left',
        highlight: true,
      },
      {
        title: 'Ask a Question',
        description:
          'Try asking: "Summarize today\'s emails" or "Show me unread emails from John" or "What meetings do I have?"',
        targetSelector: '[data-tutorial="ai-input"]',
        position: 'top',
        highlight: true,
      },
      {
        title: 'Get Instant Answers',
        description:
          'The AI will search your emails and provide contextual answers with links to relevant messages.',
        highlight: false,
      },
      {
        title: 'Use Natural Language',
        description:
          'Ask questions in plain English. The AI understands context and can help with scheduling, finding information, and more.',
        highlight: false,
      },
    ],
  },
};

export function getTutorial(tutorialId: string): Tutorial | undefined {
  return tutorials[tutorialId];
}

export function getAllTutorialIds(): string[] {
  return Object.keys(tutorials);
}

