import styles from "./AdminCommon.module.css";

/**
 * AdminEmpty
 * - 데이터가 없을 때 사용하는 공통 빈 상태 컴포넌트
 * - 목록 없음, 검색 결과 없음, 아직 API 미연결 상태 등 공통 처리
 */
interface AdminEmptyProps {
    message: string;
}

export default function AdminEmpty({ message }: AdminEmptyProps) {
    return <div className={styles.emptyBox}>{message}</div>;
}