import { useEffect } from "react";
import { useNotificationStore } from "@/shared/store/notificationStore";
import styles from "./NotificationToast.module.css";

const ICONS: Record<string, string> = {
  bid: "📋",
  matched: "🤝",
  rental: "🏷️",
  info: "ℹ️",
};

const AUTO_DISMISS_MS = 5000;

export default function NotificationToast() {
  const { notifications, remove } = useNotificationStore();

  useEffect(() => {
    if (notifications.length === 0) return;
    const oldest = notifications[notifications.length - 1];
    const elapsed = Date.now() - oldest.createdAt;
    const remaining = Math.max(0, AUTO_DISMISS_MS - elapsed);
    const timer = setTimeout(() => remove(oldest.id), remaining);
    return () => clearTimeout(timer);
  }, [notifications, remove]);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((n) => (
        <div key={n.id} className={`${styles.toast} ${styles[n.type] ?? ""}`}>
          <span className={styles.icon}>{ICONS[n.type] ?? "🔔"}</span>
          <div className={styles.body}>
            <div className={styles.title}>{n.title}</div>
            <div className={styles.message}>{n.message}</div>
          </div>
          <button className={styles.close} onClick={() => remove(n.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
