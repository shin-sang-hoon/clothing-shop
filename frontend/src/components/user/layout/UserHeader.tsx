import { useState } from "react";

const btnBaseStyle: React.CSSProperties = { color: "#222", background: "#fff", border: "1px solid #222" };
const btnHoverStyle: React.CSSProperties = { color: "#fff", background: "#000", border: "1px solid #000" };
import { useNavigate } from "react-router-dom";
import { http } from "@/shared/api/http";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import UserSidebar from "./UserSidebar";
import SearchOverlay from "./SearchOverlay";
import NotificationCenter from "./NotificationCenter";
import styles from "./UserHeader.module.css";

/**
 * 상단 메뉴 항목 타입
 * - label: 화면에 노출할 메뉴명
 * - path: 이동 경로
 */
interface NavLinkItem {
  label: string;
  path: string;
  requiresAuth?: boolean;
}

/**
 * 상단 메뉴 데이터
 */
const navLinkItems: NavLinkItem[] = [
  { label: "렌탈", path: "/rental" },
  { label: "입찰", path: "/auction" },
  { label: "배송조회", path: "/delivery", requiresAuth: true },
];

/**
 * UserHeader
 * - 사용자 공통 헤더
 */
export default function UserHeader() {
  /**
   * 라우터 이동용 훅
   */
  const navigate = useNavigate();

  /**
   * 인증 상태
   */
  const accessToken = useAuthStore((state) => state.accessToken);
  const me = useAuthStore((state) => state.me);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  /**
   * 공통 모달 오픈 함수
   */
  const openModal = useModalStore((state) => state.openModal);
  const openConfirm = useModalStore((state) => state.openConfirm);

  /**
   * 사이드바 열림 상태
   */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  /**
   * 검색 오버레이 열림 상태
   */
  const [showSearch, setShowSearch] = useState(false);

  /**
   * 햄버거 버튼 클릭 처리
   */
  const handleOpenSidebar = (): void => {
    setIsSidebarOpen(true);
  };

  /**
   * 사이드바 닫기 처리
   */
  const handleCloseSidebar = (): void => {
    setIsSidebarOpen(false);
  };

  /**
   * 로고 클릭 시 홈 이동
   */
  const handleMoveHome = (): void => {
    navigate("/");
  };

  /**
   * 상단 메뉴 클릭 시 경로 이동
   * - requiresAuth 항목은 비로그인 시 로그인 확인 모달 표시
   */
  const handleMovePage = (item: NavLinkItem): void => {
    if (item.requiresAuth && !accessToken) {
      openConfirm(
        "warning",
        "로그인이 필요합니다",
        "배송조회는 로그인 후 이용 가능합니다.\n로그인 페이지로 이동하시겠습니까?",
        () => navigate("/login"),
        "로그인하기",
        "취소",
      );
      return;
    }
    navigate(item.path);
  };

  /**
   * 실제 로그아웃 처리
   * - 서버 로그아웃 요청 후 프론트 인증 상태 정리
   * - 성공 알림 모달 확인 후 홈으로 이동
   */
  const handleLogout = async (): Promise<void> => {
    try {
      await http.post("/auth/logout");
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      clearAuth();

      openModal(
        "success",
        "로그아웃 완료",
        "로그아웃되었습니다.",
        "확인",
        () => {
          navigate("/");
        },
      );
    }
  };


  /**
   * 로그아웃 확인 모달 오픈
   * - 확인 버튼 클릭 시 실제 로그아웃 실행
   */
  const handleConfirmLogout = (): void => {
    openModal(
      "warning",
      "로그아웃",
      "로그아웃하시겠습니까?",
      "로그아웃",
      () => {
        void handleLogout();
      },
    );
  };

  return (
    <>
      <nav className={styles.navTop}>
        <div className={styles.navTopInner}>
          <div
            className={styles.navHamburger}
            onClick={handleOpenSidebar}
            aria-label="사이드바 열기"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleOpenSidebar();
              }
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span
            className={styles.logo}
            onClick={handleMoveHome}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleMoveHome();
              }
            }}
          >
            MUREAM
          </span>

          <ul className={styles.navLinks}>
            {navLinkItems.map((item) => {
              const disabled = item.requiresAuth && !accessToken;
              return (
                <li key={item.label}>
                  <a
                    onClick={() => handleMovePage(item)}
                    role="button"
                    tabIndex={0}
                    aria-disabled={disabled}
                    style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        handleMovePage(item);
                      }
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className={styles.navRight}>
            {accessToken && (
              <>
                <a role="button" tabIndex={0} onClick={() => navigate("/mypage", { state: { menu: "liked-items" } })}>
                  <span style={{ color: "#e53e3e" }}>♥</span> 좋아요
                </a>

                <a role="button" tabIndex={0} onClick={() => navigate("/mypage", { state: { menu: "liked-brands" } })}>
                  ★ 관심브랜드
                </a>

                <a
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/mypage")}
                >
                  👤 마이 페이지
                </a>

              </>
            )}

            {accessToken && <NotificationCenter />}

            <span className={styles.navAuth}>
              {accessToken ? (
                <div className={styles.userInfoBox}>
                  <span className={styles.userEmail}>{me?.email ?? "사용자"}</span>
                  <span className={styles.userDivider}>|</span>
                  <button
                    type="button"
                    className={styles.btnLogout}
                    style={btnBaseStyle}
                    onMouseEnter={e => Object.assign((e.currentTarget as HTMLButtonElement).style, btnHoverStyle)}
                    onMouseLeave={e => Object.assign((e.currentTarget as HTMLButtonElement).style, btnBaseStyle)}
                    onClick={handleConfirmLogout}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.btnLogin}
                  style={btnBaseStyle}
                  onMouseEnter={e => Object.assign((e.currentTarget as HTMLButtonElement).style, btnHoverStyle)}
                  onMouseLeave={e => Object.assign((e.currentTarget as HTMLButtonElement).style, btnBaseStyle)}
                  onClick={() => navigate("/login")}
                >
                  로그인
                </button>
              )}
            </span>
          </div>
        </div>
      </nav>

      <div className={styles.searchSection} onClick={() => setShowSearch(true)}>
        <div className={styles.searchWrap}>
          <div className={styles.searchInputWrap}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="브랜드, 상품명으로 검색해보세요"
              readOnly
            />
            <span className={styles.searchButton}>🔍</span>
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <UserSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </>
  );
}