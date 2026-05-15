import { useState } from "react";
import styles from "./MainSubNav.module.css";

/**
 * 메인 서브 네비 탭 목록
 * - 기존 SubNav() 함수 기준
 * - 초기 선택값은 첫 번째 탭으로 사용
 */
const SUB_NAV_TABS: string[] = ["콘텐츠", "추천", "랭킹", "세일", "발매"];

/**
 * MainSubNav
 * - 메인 페이지 전용 서브 네비게이션
 * - 초기 활성 탭은 첫 번째 데이터
 */
export default function MainSubNav() {
  /**
   * 현재 활성 탭
   * - 요구사항에 따라 첫 번째 데이터로 초기화
   */
  const [activeTab, setActiveTab] = useState<string>(SUB_NAV_TABS[0]);

  return (
    <div className={styles.subNav}>
      <div className={styles.subNavInner}>
        <div className={styles.subNavTabs}>
          {SUB_NAV_TABS.map((tab) => (
            <div
              key={tab}
              className={`${styles.subNavTab} ${
                activeTab === tab ? styles.subNavTabActive : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveTab(tab);
                }
              }}
            >
              {tab}
            </div>
          ))}

          <div className={`${styles.subNavTab} ${styles.subNavTabOrange}`}>
            무탠다드
            <span className={styles.subNavBadge}>26신상</span>
          </div>

          <div className={`${styles.subNavTab} ${styles.subNavTabBlue}`}>
            나이키
            <span className={styles.subNavBadge}>에어맥스</span>
          </div>
        </div>
      </div>
    </div>
  );
}
