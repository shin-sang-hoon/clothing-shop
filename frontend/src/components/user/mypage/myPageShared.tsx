import { resolveUrl } from "@/shared/config/env";
import styles from "@/pages/MyPage.module.css";

export type MenuKey = "purchase" | "sale" | "liked-brands" | "liked-items" | "my-info";
export type SubTab = "bid" | "rental";

export function resolveBrandIconUrl(iconImageUrl?: string | null): string {
    return resolveUrl(iconImageUrl);
}

export function SubTabs({ active, onChange }: { active: SubTab; onChange: (t: SubTab) => void }) {
    return (
        <div className={styles.subTabs}>
            {(["bid", "rental"] as SubTab[]).map((t) => (
                <button
                    key={t}
                    type="button"
                    className={`${styles.subTab} ${active === t ? styles.subTabActive : ""}`}
                    onClick={() => onChange(t)}
                >
                    {t === "bid" ? "입찰" : "렌탈"}
                </button>
            ))}
        </div>
    );
}

export function StatusBadge({ status }: { status: string }) {
    const classMap: Record<string, string> = {
        "입찰중": styles.statusBlue,
        "낙찰완료": styles.statusGreen,
        "유찰": styles.statusGray,
        "취소": styles.statusRed,
        "대기중": styles.statusGray,
        "렌탈중": styles.statusBlue,
        "반납완료": styles.statusGreen,
    };
    return <span className={`${styles.statusBadge} ${classMap[status] ?? styles.statusGray}`}>{status}</span>;
}
