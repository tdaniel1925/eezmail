'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Email } from '@/db/schema';

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
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

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
