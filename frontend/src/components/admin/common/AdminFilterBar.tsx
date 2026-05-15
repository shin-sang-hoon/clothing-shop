import styles from "./AdminCommon.module.css";

/**
 * AdminFilterBar
 * - 검색조건/셀렉트/버튼들을 한 줄 또는 여러 줄로 정렬하는 공통 컨테이너
 * - 내부 input, select, button은 페이지 쪽에서 자유롭게 조합
 */
interface AdminFilterBarProps {
    children: React.ReactNode;
}

export default function AdminFilterBar({ children }: AdminFilterBarProps) {
    return <div className={styles.filterBar}>{children}</div>;
}