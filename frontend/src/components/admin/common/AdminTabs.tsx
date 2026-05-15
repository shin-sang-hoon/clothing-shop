import styles from "./AdminCommon.module.css";

/**
 * AdminTabs
 * - 관리자 화면 상태/카테고리 전환용 탭 공통 컴포넌트
 * - 렌탈/경매/전체/진행중 같은 UI에 재사용
 */
export interface AdminTabItem {
    key: string;
    label: string;
}

interface AdminTabsProps {
    items: AdminTabItem[];
    activeKey: string;
    onChange?: (key: string) => void;
}

export default function AdminTabs({
    items,
    activeKey,
    onChange,
}: AdminTabsProps) {
    return (
        <div className={styles.tabs}>
            {items.map((item) => {
                const isActive = item.key === activeKey;

                return (
                    <button
                        key={item.key}
                        type="button"
                        className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
                        onClick={() => onChange?.(item.key)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}