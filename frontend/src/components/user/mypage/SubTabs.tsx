import styles from "@/pages/MyPage.module.css";
import type { SubTab } from "./types";

type Props = {
  active: SubTab;
  onChange: (tab: SubTab) => void;
};

export default function SubTabs({ active, onChange }: Props) {
  return (
    <div className={styles.subTabs}>
      {(["bid", "rental"] as SubTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          className={`${styles.subTab} ${active === tab ? styles.subTabActive : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab === "bid" ? "입찰" : "렌탈"}
        </button>
      ))}
    </div>
  );
}
