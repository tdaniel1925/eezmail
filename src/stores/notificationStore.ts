import { create } from 'zustand';
import type { Notification, NotificationCategory } from '@/db/schema';

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  activeFilter: 'all' | 'unread' | NotificationCategory;

  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  markAsRead: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveFilter: (filter: 'all' | 'unread' | NotificationCategory) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  activeFilter: 'all',

  // Actions
  setNotifications: (notifications) =>
    set({ notifications, isLoading: false }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  removeNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setIsOpen: (isOpen) => set({ isOpen }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  setIsLoading: (isLoading) => set({ isLoading }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      activeFilter: 'all',
    }),
}));

