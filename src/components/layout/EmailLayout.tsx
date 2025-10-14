'use client';

import { cn } from '@/lib/utils';

interface EmailLayoutProps {
  children?: React.ReactNode;
  sidebar: React.ReactNode;
  emailList: React.ReactNode;
  emailViewer: React.ReactNode;
}

export function EmailLayout({
  sidebar,
  emailList,
  emailViewer,
}: EmailLayoutProps): JSX.Element {
  // TODO: Add collapse functionality with toggle buttons
  const isSidebarCollapsed = false;
  const isViewerCollapsed = false;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Left Sidebar - 280px fixed (collapsed: 64px) */}
      <aside
        className={cn(
          'flex-shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300',
          isSidebarCollapsed ? 'w-16' : 'w-[280px]'
        )}
      >
        {sidebar}
      </aside>

      {/* Middle Panel - Email List (Flexible) */}
      <main className="flex flex-1 flex-col overflow-hidden bg-black/50">{emailList}</main>

      {/* Right Panel - Email Viewer / AI Copilot (420px fixed, collapsible) */}
      {!isViewerCollapsed && (
        <aside className="w-[420px] flex-shrink-0 border-l border-white/10 bg-white/5 backdrop-blur-md">
          {emailViewer}
        </aside>
      )}
    </div>
  );
}
