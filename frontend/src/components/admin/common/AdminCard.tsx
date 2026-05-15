import type { ReactNode } from "react";
import styles from "./AdminCommon.module.css";

/**
 * AdminCardProps
 * - 관리자 공통 카드 props
 */
interface AdminCardProps {
    /**
     * 카드 제목
     */
    title?: string;

    /**
     * 카드 헤더 우측 액션 영역
     * - 버튼, 셀렉트, 설명 텍스트 등을 넣을 수 있음
     */
    actions?: ReactNode;

    /**
     * 카드 본문
     */
    children: ReactNode;
}

/**
 * AdminCard
 * - 관리자 공통 카드 UI
 * - title + actions 구조 지원
 */
export default function AdminCard({
    title,
    actions,
    children,
}: AdminCardProps) {
    return (
        <section className={styles.card}>
            {(title || actions) && (
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        {title ? <h3 className={styles.title}>{title}</h3> : null}
                    </div>

                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
            )}

            <div className={styles.body}>{children}</div>
        </section>
    );
}