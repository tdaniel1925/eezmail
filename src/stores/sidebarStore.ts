import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomLabel } from '@/db/schema';

interface UnreadCounts {
  inbox: number;
  replyQueue: number;
  screener: number;
  newsFeed: number;
  starred: number;
  drafts: number;
  scheduled: number;
  spam: number;
  trash: number;
}

interface SidebarStore {
  // UI State
  isCollapsed: boolean;
  width: number;
  activeFolder: string;

  // Data
  unreadCounts: UnreadCounts;
  customLabels: CustomLabel[];

  // Actions
  toggleCollapse: () => void;
  setWidth: (width: number) => void;
  setActiveFolder: (folder: string) => void;
  setUnreadCounts: (counts: Partial<UnreadCounts>) => void;
  setCustomLabels: (labels: CustomLabel[]) => void;
  addCustomLabel: (label: CustomLabel) => void;
  removeCustomLabel: (labelId: string) => void;
  updateCustomLabel: (labelId: string, updates: Partial<CustomLabel>) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      // Initial State
      isCollapsed: false,
      width: 260,
      activeFolder: 'inbox',
      unreadCounts: {
        inbox: 0,
        replyQueue: 0,
        screener: 0,
        newsFeed: 0,
        starred: 0,
        drafts: 0,
        scheduled: 0,
        spam: 0,
        trash: 0,
      },
      customLabels: [],

      // Actions
      toggleCollapse: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
          width: !state.isCollapsed ? 80 : 260,
        })),

      setWidth: (width) => set({ width }),

      setActiveFolder: (folder) => set({ activeFolder: folder }),

      setUnreadCounts: (counts) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, ...counts },
        })),

      setCustomLabels: (labels) => set({ customLabels: labels }),

      addCustomLabel: (label) =>
        set((state) => ({
          customLabels: [...state.customLabels, label],
        })),

      removeCustomLabel: (labelId) =>
        set((state) => ({
          customLabels: state.customLabels.filter((l) => l.id !== labelId),
        })),

      updateCustomLabel: (labelId, updates) =>
        set((state) => ({
          customLabels: state.customLabels.map((l) =>
            l.id === labelId ? { ...l, ...updates } : l
          ),
        })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        width: state.width,
        activeFolder: state.activeFolder,
      }),
    }
  )
);
