import AdminTemplatePage from "./AdminTemplatePage";

/**
 * AdminMemberFormPage
 * - 회원 등록 / 수정 / 삭제 공용 폼 화면
 */
export default function AdminMemberFormPage({
    mode,
}: {
    mode: "register" | "edit" | "delete";
}) {
    const pageTitle = {
        register: "회원등록",
        edit: "회원수정",
        delete: "회원삭제",
    }[mode];

    const submitLabel = {
        register: "등록",
        edit: "수정",
        delete: "삭제",
    }[mode];

    return (
        <AdminTemplatePage
            title={pageTitle}
            description="회원 정보 입력/수정/삭제 요청을 처리하는 관리자 폼 화면"
            actions={
                <button
                    type="button"
                    className={`admin-btn${mode === "delete" ? " admin-btn--danger" : ""}`}
                >
                    {submitLabel}
                </button>
            }
        >
            <div className="admin-card">
                <div className="admin-card__body">
                    <div className="admin-info-grid">
                        <label className="admin-field">
                            <span className="admin-field__label">회원 아이디</span>
                            <input type="text" className="admin-input" placeholder="member01" />
                        </label>

                        <label className="admin-field">
                            <span className="admin-field__label">이름</span>
                            <input type="text" className="admin-input" placeholder="홍길동" />
                        </label>

                        <label className="admin-field">
                            <span className="admin-field__label">닉네임</span>
                            <input type="text" className="admin-input" placeholder="길동" />
                        </label>

                        <label className="admin-field">
                            <span className="admin-field__label">휴대폰</span>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="010-0000-0000"
                            />
                        </label>

                        <label className="admin-field">
                            <span className="admin-field__label">상태</span>
                            <select className="admin-select" defaultValue="active">
                                <option value="active">정상</option>
                                <option value="blocked">차단</option>
                                <option value="withdrawn">탈퇴</option>
                            </select>
                        </label>

                        <label className="admin-field">
                            <span className="admin-field__label">권한</span>
                            <select className="admin-select" defaultValue="member">
                                <option value="member">회원</option>
                                <option value="seller">판매자</option>
                                <option value="admin">관리자</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        </AdminTemplatePage>
    );
}