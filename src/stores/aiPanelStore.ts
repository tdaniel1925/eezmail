import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIPanelSections {
  insights: boolean;
  quickActions: boolean;
  chat: boolean;
  analytics: boolean;
  research: boolean;
}

interface AIPanelState {
  isExpanded: boolean;
  isVisible: boolean;
  width: number;
  sections: AIPanelSections;
  autoExpandOnEmail: boolean;

  // Actions
  setExpanded: (expanded: boolean) => void;
  setVisible: (visible: boolean) => void;
  setWidth: (width: number) => void;
  toggleSection: (section: keyof AIPanelSections) => void;
  setAutoExpand: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SECTIONS: AIPanelSections = {
  insights: true,
  quickActions: true,
  chat: true,
  analytics: true,
  research: true,
};

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 320;
const MAX_WIDTH = 600;

export const useAIPanelStore = create<AIPanelState>()(
  persist(
    (set) => ({
      // Initial state
      isExpanded: false, // Start collapsed, auto-expand on email view
      isVisible: true,
      width: DEFAULT_WIDTH,
      sections: DEFAULT_SECTIONS,
      autoExpandOnEmail: true,

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
          isExpanded: false,
          isVisible: true,
          width: DEFAULT_WIDTH,
          sections: DEFAULT_SECTIONS,
          autoExpandOnEmail: true,
        }),
    }),
    {
      name: 'ai-panel-storage',
    }
  )
);
