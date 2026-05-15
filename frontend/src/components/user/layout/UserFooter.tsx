import { useNavigate } from "react-router-dom";
import styles from "./UserFooter.module.css";

/**
 * UserFooter
 * - 사용자 영역 하단 푸터
 */
export default function UserFooter() {
  const navigate = useNavigate();

  const goTo = (path: string) => () => navigate(path);
  const keyNav = (path: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") navigate(path);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <span
            className={styles.logo}
            role="button"
            tabIndex={0}
            onClick={goTo("/")}
            onKeyDown={keyNav("/")}
          >
            MUREAM
          </span>
          <nav className={styles.links} aria-label="사용자 푸터 메뉴">
            <span role="button" tabIndex={0} onClick={goTo("/terms")} onKeyDown={keyNav("/terms")}>이용약관</span>
            <span role="button" tabIndex={0} onClick={goTo("/privacy")} onKeyDown={keyNav("/privacy")}>개인정보처리방침</span>
            <span role="button" tabIndex={0} onClick={goTo("/customer-service")} onKeyDown={keyNav("/customer-service")}>고객센터</span>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>© 2026 MUREAM Corp. All rights reserved.</p>
          <p>사업자등록번호: 123-45-67890 | 통신판매업신고: 2026-서울강남-0000</p>
        </div>
      </div>
    </footer>
  );
}
