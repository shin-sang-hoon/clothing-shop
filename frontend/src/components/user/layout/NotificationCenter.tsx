import { useEffect, useRef, useState } from "react";
import { useNotificationStore, type Notification } from "@/shared/store/notificationStore";
import styles from "./NotificationCenter.module.css";

const TYPE_ICON: Record<string, string> = {
  bid: "📋",
  matched: "🤝",
  rental: "🏷️",
  info: "ℹ️",
};

function timeAgo(createdAt: number): string {
  const diff = Math.floor((Date.now() - createdAt) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function NotificationCenter() {
  const { notifications, remove, clear } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={panelRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label="알림"
      >
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>알림</span>
            {notifications.length > 0 && (
              <button type="button" className={styles.clearBtn} onClick={clear}>
                전체 삭제
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>새로운 알림이 없습니다.</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n: Notification) => (
                <li key={n.id} className={`${styles.item} ${styles[n.type] ?? ""}`}>
                  <span className={styles.icon}>{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className={styles.body}>
                    <div className={styles.nTitle}>{n.title}</div>
                    <div className={styles.nMessage}>{n.message}</div>
                    <div className={styles.nTime}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(n.id)}
                  >✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
