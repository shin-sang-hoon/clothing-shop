import AdminTemplatePage from "./AdminTemplatePage";

/**
 * AdminMemberLoginPage
 * - 관리자 회원 로그인 이력/테스트 화면 자리
 */
export default function AdminMemberLoginPage() {
    return (
        <AdminTemplatePage
            title="회원 로그인"
            description="회원 로그인 관련 관리 화면. 실제 로그인 이력 API 연결 전 임시 마크업입니다."
        >
            <div className="admin-card">
                <div className="admin-card__body">
                    <div className="admin-placeholder">
                        로그인 이력, 차단 상태, 보안 이벤트 목록이 이 영역에 연결됩니다.
                    </div>
                </div>
            </div>
        </AdminTemplatePage>
    );
}