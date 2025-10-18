'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import type { Email } from '@/db/schema';
import { useAIPanelStore } from '@/stores/aiPanelStore';

interface ChatbotContextType {
  currentEmail: Email | null;
  currentFolder: string | null;
  selectedEmails: string[];
  setCurrentEmail: (email: Email | null) => void;
  setCurrentFolder: (folder: string | null) => void;
  setSelectedEmails: (emailIds: string[]) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotContextProvider({ children }: { children: ReactNode }) {
  const [currentEmail, setCurrentEmailState] = useState<Email | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Sync email to AI Panel store
  const setCurrentEmail = useCallback((email: Email | null) => {
    setCurrentEmailState(email);

    // Also update the AI Panel store with mapped fields
    // We use a setTimeout to break out of the current render cycle
    setTimeout(() => {
      const aiPanelStore = useAIPanelStore.getState();

      if (email) {
        aiPanelStore.setCurrentEmail({
          id: email.id,
          subject: email.subject,
          from:
            typeof email.fromAddress === 'string'
              ? email.fromAddress
              : email.fromAddress?.email || '',
          to: Array.isArray(email.toAddresses)
            ? email.toAddresses
                .map((addr) => (typeof addr === 'string' ? addr : addr.email))
                .join(', ')
            : '',
          body: email.bodyText || email.bodyHtml || '',
          timestamp: email.receivedAt || email.createdAt,
          threadId: email.threadId || undefined,
        });
      } else {
        aiPanelStore.setCurrentEmail(null);
      }
    }, 0);
  }, []);

  return (
    <ChatbotContext.Provider
      value={{
        currentEmail,
        currentFolder,
        selectedEmails,
        setCurrentEmail,
        setCurrentFolder,
        setSelectedEmails,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error(
      'useChatbotContext must be used within ChatbotContextProvider'
    );
  }
  return context;
}
