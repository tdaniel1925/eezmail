'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { PanelHeader } from './PanelHeader';
import { PanelSettingsModal } from './PanelSettingsModal';
import { TabNavigation } from './TabNavigation';
import { ChatTab } from './tabs/ChatTab';
import { InsightsTab } from './tabs/InsightsTab';
import { ActionsTab } from './tabs/ActionsTab';

export function AIAssistantPanel(): JSX.Element {
  const {
    isExpanded,
    isVisible,
    width,
    activeTab,
    currentEmail,
    autoExpandOnEmail,
    defaultTab,
    setExpanded,
    setVisible,
    setWidth,
    setActiveTab,
    setAutoExpand,
    setDefaultTab,
  } = useAIPanelStore();

  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Handle window resize to ensure panel stays within viewport
  useEffect(() => {
    const handleResize = () => {
      if (!isExpanded) return;

      const maxAllowedWidth = window.innerWidth - 250; // 250px minimum for main content
      if (width > maxAllowedWidth) {
        setWidth(Math.max(320, maxAllowedWidth));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, width, setWidth]);

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

      // Constrain width to min/max bounds
      const constrainedWidth = Math.max(320, Math.min(600, newWidth));

      // Ensure panel doesn't exceed viewport width (leave space for sidebar)
      const maxAllowedWidth = window.innerWidth - 250; // 250px minimum for main content
      const finalWidth = Math.min(constrainedWidth, maxAllowedWidth);

      setWidth(finalWidth);
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
      case 'chat':
        return <ChatTab currentEmail={currentEmail} />;
      case 'insights':
        return <InsightsTab currentEmail={currentEmail} />;
      case 'actions':
        return <ActionsTab />;
      default:
        return <ChatTab currentEmail={currentEmail} />;
    }
  };

  return (
    <motion.aside
      ref={panelRef}
      animate={{ width: isExpanded ? width : 48 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-screen flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            hasEmailSelected={!!currentEmail}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {renderTabContent()}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <PanelSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoExpandOnEmail={autoExpandOnEmail}
        defaultTab={defaultTab}
        onToggleAutoExpand={() => setAutoExpand(!autoExpandOnEmail)}
        onSetDefaultTab={setDefaultTab}
      />
    </motion.aside>
  );
}
