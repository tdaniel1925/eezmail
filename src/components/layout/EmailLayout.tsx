'use client';

import { useState, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Clone emailList to pass onToggleSidebar prop if it's a valid React element
  const emailListWithToggle = isValidElement(emailList)
    ? cloneElement(emailList, {
        onToggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
      } as any)
    : emailList;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar */}
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isSidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        {sidebar}
      </div>

      {/* Main Content - Full Width Email List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {emailListWithToggle}
      </div>

      {/* AI Chatbot */}
      <ChatBot />
    </div>
  );
}
