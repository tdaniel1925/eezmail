import { useEffect } from 'react';
import { useAIPanelStore } from '@/stores/aiPanelStore';
import { useChatbotContext } from '@/components/ai/ChatbotContext';

/**
 * Hook that manages AI panel state and auto-expand behavior
 */
export function useAIPanel() {
  const { currentEmail } = useChatbotContext();
  const {
    isExpanded,
    isVisible,
    width,
    autoExpandOnEmail,
    defaultTab,
    setExpanded,
    setVisible,
    setWidth,
    setAutoExpand,
    setDefaultTab,
    resetToDefaults,
  } = useAIPanelStore();

  // Auto-expand when viewing an email (if enabled)
  useEffect(() => {
    if (autoExpandOnEmail && currentEmail && !isExpanded) {
      setExpanded(true);
    }
  }, [currentEmail, autoExpandOnEmail, isExpanded, setExpanded]);

  return {
    // State
    isExpanded,
    isVisible,
    width,
    autoExpandOnEmail,
    defaultTab,
    currentEmail,

    // Actions
    setExpanded,
    setVisible,
    setWidth,
    setAutoExpand,
    setDefaultTab,
    resetToDefaults,
  };
}
