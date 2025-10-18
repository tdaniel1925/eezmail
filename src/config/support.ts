/**
 * Support configuration
 * Centralized configuration for support features
 */

export const SUPPORT_CONFIG = {
  // Phone support details
  phoneNumber: 'TBD', // User will provide later
  displayFormat: '(XXX) XXX-XXXX',
  availability: '24/7',
  timezone: 'All Timezones',

  // Support channels
  email: 'support@imbox.app',
  website: 'https://imbox.app',
  documentation: 'https://docs.imbox.app',

  // Business hours (for display purposes)
  businessHours: {
    weekdays: '9:00 AM - 6:00 PM EST',
    weekends: '10:00 AM - 4:00 PM EST',
    holidays: 'Limited availability',
  },

  // Support features
  features: {
    phoneSupport: true,
    emailSupport: true,
  },

  // Response times
  responseTimes: {
    phone: 'Immediate',
    email: 'Within 24 hours',
    chat: 'Within 2 hours',
  },

  // Support topics
  topics: [
    'Account setup and configuration',
    'Email integration issues',
    'Voice message problems',
    'AI features not working',
    'Billing and subscription',
    'Data export and import',
    'Security and privacy',
    'Feature requests',
    'Bug reports',
    'General questions',
  ],

  // Escalation levels
  escalation: {
    level1: 'General support',
    level2: 'Technical support',
    level3: 'Engineering team',
  },

  // Support languages
  languages: ['English'], // Add more as needed

  // Support regions
  regions: {
    primary: 'North America',
    secondary: 'Europe',
    tertiary: 'Asia Pacific',
  },
} as const;

/**
 * Get formatted phone number for display
 */
export function getFormattedPhoneNumber(): string {
  if (SUPPORT_CONFIG.phoneNumber === 'TBD') {
    return 'Phone number coming soon';
  }

  // Format phone number if it's provided
  const cleaned = SUPPORT_CONFIG.phoneNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return SUPPORT_CONFIG.phoneNumber;
}

/**
 * Check if phone support is available
 */
export function isPhoneSupportAvailable(): boolean {
  return (
    SUPPORT_CONFIG.phoneNumber !== 'TBD' && SUPPORT_CONFIG.features.phoneSupport
  );
}

/**
 * Get support contact information
 */
export function getSupportContacts() {
  return {
    phone: isPhoneSupportAvailable() ? getFormattedPhoneNumber() : null,
    email: SUPPORT_CONFIG.email,
    website: SUPPORT_CONFIG.website,
    documentation: SUPPORT_CONFIG.documentation,
  };
}

/**
 * Get support hours for current time
 */
export function getCurrentSupportStatus(): {
  isAvailable: boolean;
  message: string;
  nextAvailable?: string;
} {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if it's a weekday (Monday-Friday)
  const isWeekday = day >= 1 && day <= 5;

  if (isWeekday) {
    // Weekday hours: 9 AM - 6 PM EST
    if (hour >= 9 && hour < 18) {
      return {
        isAvailable: true,
        message: 'Support is available now',
      };
    } else if (hour < 9) {
      return {
        isAvailable: false,
        message: 'Support opens at 9:00 AM EST',
        nextAvailable: '9:00 AM EST today',
      };
    } else {
      return {
        isAvailable: false,
        message: 'Support is closed for the day',
        nextAvailable: '9:00 AM EST tomorrow',
      };
    }
  } else {
    // Weekend hours: 10 AM - 4 PM EST
    if (hour >= 10 && hour < 16) {
      return {
        isAvailable: true,
        message: 'Weekend support is available',
      };
    } else {
      return {
        isAvailable: false,
        message: 'Weekend support: 10:00 AM - 4:00 PM EST',
        nextAvailable: '10:00 AM EST tomorrow',
      };
    }
  }
}

/**
 * Get support topics by category
 */
export function getSupportTopicsByCategory() {
  return {
    technical: [
      'Email integration issues',
      'Voice message problems',
      'AI features not working',
    ],
    account: [
      'Account setup and configuration',
      'Billing and subscription',
      'Data export and import',
    ],
    general: [
      'Security and privacy',
      'Feature requests',
      'Bug reports',
      'General questions',
    ],
  };
}

/**
 * Get escalation information
 */
export function getEscalationInfo(issueType: string): {
  level: string;
  description: string;
  estimatedTime: string;
} {
  const escalationMap: Record<string, any> = {
    'email-integration': {
      level: 'Level 2 - Technical Support',
      description: 'Email provider connection issues',
      estimatedTime: '2-4 hours',
    },
    'voice-messages': {
      level: 'Level 2 - Technical Support',
      description: 'Audio recording and playback issues',
      estimatedTime: '1-2 hours',
    },
    'ai-features': {
      level: 'Level 3 - Engineering Team',
      description: 'AI processing and analysis issues',
      estimatedTime: '4-8 hours',
    },
    billing: {
      level: 'Level 1 - General Support',
      description: 'Payment and subscription issues',
      estimatedTime: '1 hour',
    },
    security: {
      level: 'Level 3 - Engineering Team',
      description: 'Security and privacy concerns',
      estimatedTime: 'Immediate',
    },
  };

  return (
    escalationMap[issueType] || {
      level: 'Level 1 - General Support',
      description: 'General inquiry',
      estimatedTime: '1-2 hours',
    }
  );
}
