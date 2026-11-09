import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: {
    title: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
  }) => void;
  setTodayNotifications: (items: Array<{
    id?: string;
    title: string;
    message: string;
    type?: "success" | "error" | "info" | "warning";
    timestamp?: string;
  }>) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          const newItem: NotificationItem = {
            id: Math.random().toString(36).substring(2, 9),
            title: notification.title,
            message: notification.message,
            type: notification.type || "info",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: false,
          };
          // Keep last 25 records and avoid exact duplicate messages in recent 5
          const isDuplicate = state.notifications.slice(0, 5).some(
            (n) => n.title === newItem.title && n.message === newItem.message
          );
          if (isDuplicate) return state;

          const updated = [newItem, ...state.notifications].slice(0, 25);
          return { notifications: updated };
        }),
      setTodayNotifications: (items) =>
        set((state) => {
          const existingIds = new Set(state.notifications.map((n) => n.id));
          const newItems: NotificationItem[] = items.map((it, idx) => ({
            id: it.id || `today-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            title: it.title,
            message: it.message,
            type: it.type || "info",
            timestamp: it.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: false,
          }));

          // Retain existing unread notifications that aren't in newItems
          const combined = [
            ...newItems,
            ...state.notifications.filter((n) => !existingIds.has(n.id)),
          ].slice(0, 25);

          return { notifications: combined };
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
