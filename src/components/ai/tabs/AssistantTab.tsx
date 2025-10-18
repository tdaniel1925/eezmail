'use client';

import { Email } from '@/stores/aiPanelStore';
import { ChatInterface } from './assistant/ChatInterface';
import { EmailQuickActions } from './assistant/EmailQuickActions';
import { ContactStats } from './assistant/ContactStats';

interface AssistantTabProps {
  currentEmail: Email | null;
}

export function AssistantTab({ currentEmail }: AssistantTabProps): JSX.Element {
  // Mode 1: No email selected - Full chat interface
  if (!currentEmail) {
    return (
      <div className="flex flex-1 flex-col h-full">
        <ChatInterface isCompact={false} currentEmail={null} />
      </div>
    );
  }

  // Mode 2: Email selected - Show context-aware sections
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Email Quick Actions Section */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <EmailQuickActions email={currentEmail} />
      </div>

      {/* Contact Stats Section */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <ContactStats email={currentEmail} />
      </div>

      {/* Compact Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface isCompact={true} currentEmail={currentEmail} />
      </div>
    </div>
  );
}


