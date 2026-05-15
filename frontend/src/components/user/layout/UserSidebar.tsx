import { useEffect, useState } from "react";
import styles from "./UserSidebar.module.css";
import CategorySidebarTab from "./sidebar/CategorySidebarTab";
import BrandSidebarTab from "./sidebar/BrandSidebarTab";
import type { SidebarTab } from "./sidebar/types";

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("category");

  useEffect(() => {
    if (isOpen) {
      setSidebarTab("category");
    }
  }, [isOpen]);

  const sidebarHeaderTitle = sidebarTab === "category" ? "카테고리" : "브랜드";

  return (
    <div
      className={`${styles.sidebarOverlay} ${isOpen ? styles.sidebarOverlayOpen : ""}`}
      onClick={onClose}
    >
      <div
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarHeaderTitle}>{sidebarHeaderTitle}</span>
          <span
            className={styles.sidebarClose}
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onClose();
              }
            }}
          >
            ✕
          </span>
        </div>

        <div className={styles.sidebarMainTabs}>
          {(["category", "brand"] as SidebarTab[]).map((tab) => (
            <div
              key={tab}
              className={`${styles.sidebarMainTab} ${sidebarTab === tab ? styles.sidebarMainTabActive : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setSidebarTab(tab)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSidebarTab(tab);
                }
              }}
            >
              {tab === "category" ? "카테고리" : "브랜드"}
            </div>
          ))}
        </div>

        {sidebarTab === "category" ? (
          <CategorySidebarTab isOpen={isOpen} onClose={onClose} />
        ) : (
          <BrandSidebarTab isOpen={isOpen} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
