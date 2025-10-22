'use client';

import { Email } from '@/stores/aiPanelStore';
import { ChatInterface } from '../ChatInterface';
import { EmptyState } from '../EmptyStates';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { toast } from 'sonner';

interface ChatTabProps {
  currentEmail: Email | null;
}

export function ChatTab({ currentEmail }: ChatTabProps): JSX.Element {
  const { setActiveTab } = useAIPanelStore();

  const handleActionClick = async (action: string) => {
    if (!currentEmail) return;

    switch (action) {
      case 'summarize':
        // Send summarize request to chat
        try {
          const event = new CustomEvent('chat-send-message', {
            detail: { message: 'Please summarize this email' },
          });
          window.dispatchEvent(event);
        } catch (error) {
          toast.error('Failed to send summarize request');
        }
        break;

      case 'reply':
        // Send draft reply request to chat
        try {
          const event = new CustomEvent('chat-send-message', {
            detail: { message: 'Help me draft a reply to this email' },
          });
          window.dispatchEvent(event);
        } catch (error) {
          toast.error('Failed to send reply request');
        }
        break;

      case 'actions':
        // Switch to insights tab to show action items
        setActiveTab('insights');
        toast.success('Viewing insights...');
        break;

      default:
        break;
    }
  };

  // Get sender info from email
  const emailFrom = currentEmail?.from;

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Empty state or context chips at top */}
      {!currentEmail ? (
        <div className="flex-1 overflow-y-auto">
          <EmptyState type="chat" />
        </div>
      ) : (
        <>
          {/* Context-aware greeting and quick actions */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <EmptyState
              type="chat-with-email"
              emailFrom={emailFrom}
              onActionClick={handleActionClick}
            />
          </div>

          {/* Chat interface fills remaining space */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </>
      )}

      {/* If no email, chat interface should still be available at bottom */}
      {!currentEmail && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <ChatInterface />
          </div>
        </div>
      )}
    </div>
  );
}

