import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "bid" | "matched" | "rental" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tradeId?: number | null;
  tradeRoomId?: number | null;
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  push: (n: Omit<Notification, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      push: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: `${Date.now()}-${Math.random()}`, createdAt: Date.now() },
            ...state.notifications,
          ].slice(0, 20),
        })),
      remove: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clear: () => set({ notifications: [] }),
    }),
    { name: "muream-notifications" },
  ),
);
