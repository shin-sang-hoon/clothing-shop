import styles from "./AdminCommon.module.css";

/**
 * AdminTable
 * - 관리자 테이블 공통 래퍼
 * - thead / tbody / tr / th / td 는 페이지에서 직접 구성
 * - 초반에는 범용 테이블로 과하게 추상화하지 않고 껍데기만 공통화
 */
interface AdminTableProps {
    children: React.ReactNode;
}

export default function AdminTable({ children }: AdminTableProps) {
    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>{children}</table>
        </div>
    );
}