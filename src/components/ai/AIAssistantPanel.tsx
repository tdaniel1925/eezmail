'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAIPanel } from '@/hooks/useAIPanel';
import { PanelHeader } from './PanelHeader';
import { PanelSettingsModal } from './PanelSettingsModal';
import { EmailInsights } from './EmailInsights';
import { QuickActions } from './QuickActions';
import { EmailAnalytics } from './EmailAnalytics';
import { ResearchSection } from './ResearchSection';
import { ChatInterface } from './ChatInterface';

export function AIAssistantPanel(): JSX.Element {
  const {
    isExpanded,
    isVisible,
    width,
    sections,
    autoExpandOnEmail,
    currentEmail,
    setExpanded,
    setVisible,
    setWidth,
    toggleSection,
    setAutoExpand,
    resetToDefaults,
  } = useAIPanel();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Handle client-side mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
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

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted || !isVisible) return <></>;

  // Mobile: Keep existing floating modal (not implemented in this component)
  if (isMobile) {
    return <></>;
  }

  // Desktop: Full 3-column layout
  if (isDesktop) {
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
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto">
            {sections.insights && <EmailInsights email={currentEmail} />}

            {sections.quickActions && <QuickActions email={currentEmail} />}

            {sections.analytics && <EmailAnalytics email={currentEmail} />}

            {sections.research && <ResearchSection email={currentEmail} />}

            {sections.chat && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <ChatInterface />
              </div>
            )}
          </div>
        )}

        {/* Settings Modal */}
        <PanelSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          sections={sections}
          autoExpandOnEmail={autoExpandOnEmail}
          onToggleSection={(section) => toggleSection(section as any)}
          onToggleAutoExpand={() => setAutoExpand(!autoExpandOnEmail)}
          onResetDefaults={resetToDefaults}
        />
      </motion.aside>
    );
  }

  // Tablet: Slide-out drawer
  if (isTablet) {
    return (
      <>
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpanded(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-0 z-50 h-full w-[380px] flex flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
              >
                <PanelHeader
                  isExpanded={true}
                  onToggleExpand={() => setExpanded(false)}
                  onClose={() => setVisible(false)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />

                <div className="flex-1 overflow-y-auto">
                  {sections.insights && <EmailInsights email={currentEmail} />}
                  {sections.quickActions && (
                    <QuickActions email={currentEmail} />
                  )}
                  {sections.analytics && (
                    <EmailAnalytics email={currentEmail} />
                  )}
                  {sections.research && (
                    <ResearchSection email={currentEmail} />
                  )}
                  {sections.chat && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <ChatInterface />
                    </div>
                  )}
                </div>

                <PanelSettingsModal
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                  sections={sections}
                  autoExpandOnEmail={autoExpandOnEmail}
                  onToggleSection={(section) => toggleSection(section as any)}
                  onToggleAutoExpand={() => setAutoExpand(!autoExpandOnEmail)}
                  onResetDefaults={resetToDefaults}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Toggle Button (when collapsed) */}
        {!isExpanded && (
          <button
            onClick={() => setExpanded(true)}
            className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90"
            title="Open AI Assistant"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        )}
      </>
    );
  }

  return <></>;
}
