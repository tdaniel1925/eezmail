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
    sections,
    autoExpandOnEmail,
    setExpanded,
    setVisible,
    setWidth,
    toggleSection,
    setAutoExpand,
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
    sections,
    autoExpandOnEmail,
    currentEmail,

    // Actions
    setExpanded,
    setVisible,
    setWidth,
    toggleSection,
    setAutoExpand,
    resetToDefaults,
  };
}
