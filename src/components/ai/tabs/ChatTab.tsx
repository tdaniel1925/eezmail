'use client';

import { ChatInterface } from '../ChatInterface';

export function ChatTab(): JSX.Element {
  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <ChatInterface />
    </div>
  );
}
