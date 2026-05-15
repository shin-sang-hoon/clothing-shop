/**
 * AdminTemplatePage
 * - 빠른 관리자 화면 구성용 공통 템플릿
 * - 실제 API 연동 전까지 마크업 뼈대와 액션 위치를 맞추는 용도
 */
export default function AdminTemplatePage({
    title,
    description,
    actions,
    children,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="admin-page">
            <div className="admin-page__header">
                <div className="admin-page__title-wrap">
                    <h1 className="admin-page__title">{title}</h1>
                    {description ? (
                        <p className="admin-page__desc">{description}</p>
                    ) : null}
                </div>

                {actions ? <div className="admin-page__actions">{actions}</div> : null}
            </div>

            {children}
        </section>
    );
}