import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * AppLayout
 * - 공통 레이아웃(상단 메뉴 → 롤링바 → 컨텐츠 → 하단 롤링바)
 * - 메뉴는 permission 기반으로 노출(UX)
 * - 실제 보안은 백엔드 + AdminRoute가 최종
 */
export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.me);
  const hasPerm = useAuthStore((s) => s.hasPerm);

  const canAdminPortal = accessToken && hasPerm("PERM_ADMIN_PORTAL_ACCESS");

  // 관리자 세부 메뉴 노출 기준(UX)
  const canPermMenu = hasPerm("PERM_PERMISSION_READ");
  const canRoleMenu = hasPerm("PERM_ROLE_READ");
  const canMemberMenu = hasPerm("PERM_MEMBER_READ");

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <header style={{ padding: 16, borderBottom: "1px solid #ddd" }}>
        <nav
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link to="/">홈</Link>
          <Link to="/login">로그인</Link>
          <Link to="/signup">회원가입</Link>
          <Link to="/mypage">마이페이지</Link>

          <span style={{ marginLeft: 12, opacity: 0.6 }}>|</span>

          {canAdminPortal && <Link to="/admin">관리자</Link>}
          {canAdminPortal && canPermMenu && (
            <Link to="/admin/permissions">권한관리</Link>
          )}
          {canAdminPortal && canRoleMenu && (
            <Link to="/admin/roles">역할관리</Link>
          )}
          {canAdminPortal && canMemberMenu && (
            <Link to="/admin/members">회원할당</Link>
          )}

          <span style={{ marginLeft: 12, opacity: 0.6 }}>|</span>
          <span style={{ opacity: 0.7 }}>
            {me?.email ? `login: ${me.email}` : "(not logged in)"}
          </span>
        </nav>
      </header>

      {/* Top rolling bar */}
      <div
        style={{
          padding: 12,
          borderBottom: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        <strong>Rolling</strong> : 공지 / 이벤트 / 배너 영역 (나중에 API로 교체)
      </div>

      {/* Content */}
      <main style={{ padding: 16, flex: 1 }}>
        <Outlet />
      </main>

      {/* Bottom rolling bar */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid #eee",
          background: "#fafafa",
        }}
      >
        <strong>Rolling</strong> : 하단 배너 / 링크 / 안내 영역 (나중에 API로
        교체)
      </div>

      {/* Footer */}
      <footer style={{ padding: 16, borderTop: "1px solid #ddd" }}>
        <small>© Demo IAM Service</small>
      </footer>
    </div>
  );
}
