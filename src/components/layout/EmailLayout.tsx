'use client';

import { ChatBot } from '@/components/ai/ChatBot';

interface EmailLayoutProps {
  children?: React.ReactNode;
  sidebar: React.ReactNode;
  emailList: React.ReactNode;
}

export function EmailLayout({
  sidebar,
  emailList,
}: EmailLayoutProps): JSX.Element {
  return (
    <div
      className="flex h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-secondary)' }}
    >
      {/* Sidebar - Fixed width */}
      <div className="w-60 flex-shrink-0">{sidebar}</div>

      {/* Main Content - Full width */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-colors duration-300"
        style={{ background: 'var(--bg-primary)' }}
      >
        {emailList}
      </div>

      {/* AI Chatbot */}
      <ChatBot />
    </div>
  );
}
