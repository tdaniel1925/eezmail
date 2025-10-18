'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { PanelHeader } from './PanelHeader';
import { TabNavigation } from './TabNavigation';
import { AssistantTab } from './tabs/AssistantTab';
import { ThreadSummaryTab } from './tabs/ThreadSummaryTab';
import { QuickActionsTab } from './tabs/QuickActionsTab';
import { ContactActionsTab } from './tabs/ContactActionsTab';

export function AIAssistantPanel(): JSX.Element {
  const {
    isExpanded,
    isVisible,
    width,
    activeTab,
    currentEmail,
    setExpanded,
    setVisible,
    setWidth,
    setActiveTab,
  } = useAIPanelStore();

  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Handle client-side mounting and ensure visibility
  useEffect(() => {
    setMounted(true);
    // Force visible on first mount if not explicitly set
    if (!isVisible) {
      setVisible(true);
    }
  }, []);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth]);

  // Don't render until mounted
  if (!mounted) {
    return <></>;
  }

  // Mobile: Hide panel
  if (isMobile) {
    return <></>;
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'assistant':
        return <AssistantTab currentEmail={currentEmail} />;
      case 'thread':
        return <ThreadSummaryTab currentEmail={currentEmail} />;
      case 'actions':
        return <QuickActionsTab />;
      case 'contacts':
        return <ContactActionsTab />;
      default:
        return <AssistantTab currentEmail={currentEmail} />;
    }
  };

  // Check if email has a thread (threadId exists and is not null/empty)
  const hasThread = !!currentEmail?.threadId;

  return (
    <motion.aside
      ref={panelRef}
      animate={{ width: isExpanded ? width : 48 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{
        minWidth: isExpanded ? 320 : 48,
        maxWidth: isExpanded ? 600 : 48,
      }}
    >
      {/* Resize Handle */}
      {isExpanded && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20"
          style={{ marginLeft: '-2px' }}
        />
      )}

      {/* Header */}
      <PanelHeader
        isExpanded={isExpanded}
        onToggleExpand={() => setExpanded(!isExpanded)}
        onClose={() => setVisible(false)}
      />

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasEmailSelected={!!currentEmail}
            hasThread={hasThread}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderTabContent()}
          </div>
        </div>
      )}
    </motion.aside>
  );
}
