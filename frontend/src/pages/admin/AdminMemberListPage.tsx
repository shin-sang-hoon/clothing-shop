import AdminTemplatePage from "./AdminTemplatePage";

/**
 * AdminMemberListPage
 * - 회원 조회 화면
 * - rental_auction 회원조회 테이블 마크업을 React 구조로 변환
 */
export default function AdminMemberListPage() {
    return (
        <AdminTemplatePage
            title="회원관리"
            description="회원 조회, 상태 확인, 일괄 수정/삭제 액션을 처리하는 화면"
            actions={
                <>
                    <button type="button" className="admin-btn">
                        선택수정
                    </button>

                    <button type="button" className="admin-btn admin-btn--secondary">
                        선택삭제
                    </button>
                </>
            }
        >
            <div className="admin-tabs">
                <span className="admin-tab is-active">전체목록</span>
                <span className="admin-page__desc">총회원수 0명</span>
                <span className="admin-page__desc">차단 0명</span>
                <span className="admin-page__desc">탈퇴 0명</span>
            </div>

            <div className="admin-card">
                <div className="admin-card__body">
                    <div className="admin-filter-row">
                        <select className="admin-select" defaultValue="loginId">
                            <option value="loginId">회원아이디</option>
                            <option value="name">이름</option>
                            <option value="nickname">닉네임</option>
                        </select>

                        <input
                            type="text"
                            className="admin-input admin-input--wide"
                            placeholder="검색"
                        />

                        <button type="button" className="admin-btn">
                            검색
                        </button>
                    </div>
                </div>
            </div>

            <div className="admin-notice">
                회원자료 삭제 시 다른 회원이 기존 회원아이디를 사용하지 못하도록 회원아이디, 이름, 닉네임은 삭제하지 않고 영구 보관합니다.
            </div>

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" aria-label="전체선택" />
                                </th>
                                <th>아이디 / 이름</th>
                                <th>본인확인</th>
                                <th>회원인증</th>
                                <th>정보공개 / 성인인증</th>
                                <th>광고수신 / 접근차단</th>
                                <th>상태 / 권한</th>
                                <th>휴대폰 / 전화번호</th>
                                <th>가입일</th>
                                <th>최종접속</th>
                                <th>접근그룹 / 포인트</th>
                                <th>관리</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td colSpan={12} className="admin-table__empty">
                                    데이터 연동 후 회원 목록이 표시됩니다.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminTemplatePage>
    );
}