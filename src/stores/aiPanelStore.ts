import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tab types for the right sidebar (simplified to 3)
export type TabType = 'chat' | 'insights' | 'actions';

// Email interface for context
export interface Email {
  id: string;
  subject: string;
  from: string;
  fromName?: string; // Extracted sender name
  to?: string;
  body?: string;
  snippet?: string;
  timestamp?: Date;
  threadId?: string;
}

interface AIPanelState {
  isExpanded: boolean;
  isVisible: boolean;
  width: number;
  autoExpandOnEmail: boolean;

  // State for tabs and context
  activeTab: TabType;
  currentEmail: Email | null;
  selectedContactId: string | null;
  defaultTab: TabType; // User's preferred default tab

  // Actions
  setExpanded: (expanded: boolean) => void;
  setVisible: (visible: boolean) => void;
  setWidth: (width: number) => void;
  setAutoExpand: (enabled: boolean) => void;
  setDefaultTab: (tab: TabType) => void;
  resetToDefaults: () => void;

  // Actions for tabs and context
  setActiveTab: (tab: TabType) => void;
  setCurrentEmail: (email: Email | null) => void;
  setSelectedContact: (contactId: string | null) => void;
}

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
      autoExpandOnEmail: true,
      defaultTab: 'chat', // Default starting tab

      // State (NOT persisted)
      activeTab: 'chat',
      currentEmail: null,
      selectedContactId: null,

      // Actions
      setExpanded: (expanded) => set({ isExpanded: expanded }),

      setVisible: (visible) => set({ isVisible: visible }),

      setWidth: (width) => {
        const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
        set({ width: clampedWidth });
      },

      setAutoExpand: (enabled) => set({ autoExpandOnEmail: enabled }),

      setDefaultTab: (tab) => set({ defaultTab: tab }),

      resetToDefaults: () =>
        set({
          isExpanded: true,
          isVisible: true,
          width: DEFAULT_WIDTH,
          autoExpandOnEmail: true,
          defaultTab: 'chat',
          activeTab: 'chat',
          currentEmail: null,
          selectedContactId: null,
        }),

      // Tab actions
      setActiveTab: (tab) => set({ activeTab: tab }),

      // When setting a new email, reset to default tab
      setCurrentEmail: (email) =>
        set((state) => ({
          currentEmail: email,
          activeTab: state.defaultTab,
        })),

      setSelectedContact: (contactId) => set({ selectedContactId: contactId }),
    }),
    {
      name: 'ai-panel-storage',
      // Only persist UI preferences, NOT contextual data
      partialize: (state) => ({
        isExpanded: state.isExpanded,
        isVisible: state.isVisible,
        width: state.width,
        autoExpandOnEmail: state.autoExpandOnEmail,
        defaultTab: state.defaultTab,
        // currentEmail: NOT persisted (contextual)
        // selectedContactId: NOT persisted (contextual)
        // activeTab: NOT persisted (resets to defaultTab)
      }),
    }
  )
);
