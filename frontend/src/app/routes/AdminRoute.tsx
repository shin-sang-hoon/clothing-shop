import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * AdminRoute
 * - 관리자 영역 접근 제어
 * - 정책: 인증 복구 완료 후 관리자 권한을 검사한다.
 */
export default function AdminRoute() {
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
  const me = useAuthStore((state) => state.me);

  /**
   * 아직 refresh / me 복구 전이면 판단 보류
   * - 이 시점에 리다이렉트하면 새로고침 직후 관리자가 튕길 수 있다.
   */
  if (!isAuthInitialized) {
    return null;
  }

  /**
   * 인증 복구 완료 후에도 me가 없으면 비로그인 상태
   */
  if (!me) {
    return <Navigate to="/login" replace />;
  }

  /**
   * 관리자 접근 권한 확인
   * - 실제 포털 진입 권한은 permission 기준으로 검사
   */
  const canAccessAdminPortal =
    me.permissions.includes("PERM_ADMIN_PORTAL_ACCESS");

  if (!canAccessAdminPortal) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}