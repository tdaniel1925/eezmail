import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tab types for the right sidebar
export type TabType = 'assistant' | 'thread' | 'actions' | 'contacts';

// Email interface for context
export interface Email {
  id: string;
  subject: string;
  from: string;
  to?: string;
  body?: string;
  timestamp?: Date;
  threadId?: string;
}

interface AIPanelSections {
  emailInsights: boolean;
  quickActions: boolean;
  analytics: boolean;
  research: boolean;
  chat: boolean;
}

interface AIPanelState {
  isExpanded: boolean;
  isVisible: boolean;
  width: number;
  sections: AIPanelSections;
  autoExpandOnEmail: boolean;

  // New state for tabs and context
  activeTab: TabType;
  currentEmail: Email | null;
  selectedContactId: string | null;

  // Actions
  setExpanded: (expanded: boolean) => void;
  setVisible: (visible: boolean) => void;
  setWidth: (width: number) => void;
  toggleSection: (section: keyof AIPanelSections) => void;
  setAutoExpand: (enabled: boolean) => void;
  resetToDefaults: () => void;

  // New actions for tabs and context
  setActiveTab: (tab: TabType) => void;
  setCurrentEmail: (email: Email | null) => void;
  setSelectedContact: (contactId: string | null) => void;
}

const DEFAULT_SECTIONS: AIPanelSections = {
  emailInsights: true,
  quickActions: true,
  analytics: true,
  research: true,
  chat: true,
};

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;

export const useAIPanelStore = create<AIPanelState>()(
  persist(
    (set) => ({
      // Initial state
      isExpanded: true, // Start expanded by default
      isVisible: true,
      width: DEFAULT_WIDTH,
      sections: DEFAULT_SECTIONS,
      autoExpandOnEmail: true,

      // New state
      activeTab: 'assistant',
      currentEmail: null,
      selectedContactId: null,

      // Actions
      setExpanded: (expanded) => set({ isExpanded: expanded }),

      setVisible: (visible) => set({ isVisible: visible }),

      setWidth: (width) => {
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
        set({ width: clampedWidth });
      },

      toggleSection: (section) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [section]: !state.sections[section],
          },
        })),

      setAutoExpand: (enabled) => set({ autoExpandOnEmail: enabled }),

      resetToDefaults: () =>
        set({
          isExpanded: true,
          isVisible: true,
          width: DEFAULT_WIDTH,
          sections: DEFAULT_SECTIONS,
          autoExpandOnEmail: true,
          activeTab: 'assistant',
          currentEmail: null,
          selectedContactId: null,
        }),

      // New actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      // When setting a new email, always reset to assistant tab
      setCurrentEmail: (email) =>
        set({
          currentEmail: email,
          activeTab: 'assistant',
        }),

      setSelectedContact: (contactId) => set({ selectedContactId: contactId }),
    }),
    {
      name: 'ai-panel-storage',
    }
  )
);
