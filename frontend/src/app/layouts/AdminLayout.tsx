import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import CommonModal from "@/components/common/modal/CommonModal";
import IdleLogoutHandler from "@/shared/auth/IdleLogoutHandler";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./AdminLayout.module.css";

/**
 * AdminLayout
 * - 관리자 공통 레이아웃
 * - 헤더의 햄버거 버튼으로 사이드바 열림/닫힘 상태를 제어
 * - 전역 모달도 관리자 영역에서 함께 렌더링
 * - 로그인 상태에서는 자동 로그아웃 핸들러도 함께 동작
 */
export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  /**
   * 공통 모달 상태
   */
  const isOpen = useModalStore((state) => state.isOpen);
  const type = useModalStore((state) => state.type);
  const actionType = useModalStore((state) => state.actionType);
  const title = useModalStore((state) => state.title);
  const message = useModalStore((state) => state.message);
  const confirmText = useModalStore((state) => state.confirmText);
  const cancelText = useModalStore((state) => state.cancelText);
  const closeOnOverlay = useModalStore((state) => state.closeOnOverlay);
  const confirmModal = useModalStore((state) => state.confirmModal);
  const cancelModal = useModalStore((state) => state.cancelModal);

  /**
   * handleToggleSidebar
   * - 헤더 햄버거 버튼 클릭 시 사이드바 열림/닫힘 전환
   */
  function handleToggleSidebar(): void {
    setIsSidebarOpen((prev) => !prev);
  }

  return (
    <div className={styles.app}>
      {/* 로그인 상태일 때만 내부에서 자동 로그아웃 타이머가 동작 */}
      <IdleLogoutHandler />

      <AdminHeader onToggleSidebar={handleToggleSidebar} />

      <div className={styles.body}>
        <AdminSidebar isOpen={isSidebarOpen} />

        <main className={styles.main}>
          <div className={styles.viewContainer}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* <AdminFooter /> */}

      <CommonModal
        isOpen={isOpen}
        type={type}
        actionType={actionType}
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        closeOnOverlay={closeOnOverlay}
        onConfirm={confirmModal}
        onClose={cancelModal}
      />
    </div>
  );
}