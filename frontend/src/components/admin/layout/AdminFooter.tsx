import styles from "./AdminFooter.module.css";

/**
 * AdminFooter
 * - rental_auction의 app-footer 스타일을 기준으로 구성
 */
export default function AdminFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.copy}>© 렌탈·입찰 관리자</p>
      </div>
    </footer>
  );
}