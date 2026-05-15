import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserHeader from "@/components/user/layout/UserHeader";
import UserFooter from "@/components/user/layout/UserFooter";
import CommonModal from "@/components/common/modal/CommonModal";
import IdleLogoutHandler from "@/shared/auth/IdleLogoutHandler";
import FloatingChatBar from "@/components/user/chat/FloatingChatBar";
import OnboardingModal from "@/components/user/onboarding/OnboardingModal";
import NotificationToast from "@/components/common/NotificationToast";
import { useModalStore } from "@/shared/store/modalStore";
import { useAuthStore } from "@/shared/store/authStore";
import { useCategoryStore } from "@/shared/store/categoryStore";
import styles from "./UserLayout.module.css";
import "@/assets/styles/global.css";

/**
 * UserLayout
 * - 사용자 영역 공통 레이아웃
 * - 헤더 / 본문 / 푸터 구조 담당
 * - 공통 모달도 여기서 한 번만 렌더링
 * - 로그인 상태에서는 자동 로그아웃 핸들러도 함께 동작
 */
export default function UserLayout() {
  const { pathname } = useLocation();
  const me = useAuthStore((state) => state.me);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (me && localStorage.getItem(`pendingOnboarding_${me.email}`) === "true") {
      setShowOnboarding(true);
    }
  }, [me]);

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

  return (
    <div className={styles.layout}>
      {/* 로그인 상태일 때만 내부에서 자동 로그아웃 타이머가 동작 */}
      <IdleLogoutHandler />

      <UserHeader />

      <main className={styles.main}>
        <Outlet />
      </main>

      <UserFooter />

      <FloatingChatBar />
      <NotificationToast />

      {showOnboarding && me && (
        <OnboardingModal userEmail={me.email} onClose={() => setShowOnboarding(false)} />
      )}

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