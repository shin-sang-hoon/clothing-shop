import styles from "./AdminCommon.module.css";

/**
 * AdminPageHeader
 * - 관리자 페이지 상단 제목/설명/액션 영역 공통 컴포넌트
 * - 각 페이지의 h1, 설명문, 우측 버튼 영역을 일관되게 맞춤
 */
interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export default function AdminPageHeader({
    title,
    description,
    actions,
}: AdminPageHeaderProps) {
    return (
        <div className={styles.pageHeader}>
            <div className={styles.pageTitleWrap}>
                <h1 className={styles.pageTitle}>{title}</h1>

                {description ? (
                    <p className={styles.pageDescription}>{description}</p>
                ) : null}
            </div>

            {actions ? <div className={styles.pageActions}>{actions}</div> : null}
        </div>
    );
}