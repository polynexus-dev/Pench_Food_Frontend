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
          // Keep last 10 records and drop others
          const updated = [newItem, ...state.notifications].slice(0, 10);
          return { notifications: updated };
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
