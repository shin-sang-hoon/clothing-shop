import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { http } from "@/shared/api/http";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./AdminHeader.module.css";

/**
 * AdminHeaderProps
 * - 헤더에서 사이드바 토글 함수를 전달받기 위한 props
 */
interface AdminHeaderProps {
    onToggleSidebar: () => void;
}

/**
 * AdminHeader
 * - 관리자 상단 헤더
 * - 햄버거 버튼 클릭 시 사이드바 열림/닫힘 토글
 * - 로그아웃은 확인 모달 1회만 사용
 */
export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
    /**
     * 라우터 이동
     */
    const navigate = useNavigate();

    /**
     * 인증 상태
     */
    const me = useAuthStore((state) => state.me);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    /**
     * 공통 모달 오픈 함수
     */
    const openModal = useModalStore((state) => state.openModal);

    /**
     * 관리자 드롭다운 열림 상태
     */
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    /**
     * 드롭다운 영역 ref
     * - 바깥 클릭 시 닫기 처리용
     */
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    /**
     * 바깥 클릭 시 드롭다운 닫기
     */
    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent): void => {
            if (!dropdownRef.current) {
                return;
            }

            if (!dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleDocumentClick);

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick);
        };
    }, []);

    /**
     * 실제 로그아웃 처리
     * - 서버 로그아웃 요청
     * - 관리자 페이지 가드 충돌 방지를 위해 먼저 사용자 홈으로 이동
     * - 이동 후 인증 상태 초기화
     *
     * 중요:
     * - 성공 모달을 다시 띄우지 않는다.
     * - 이미 "로그아웃 하시겠습니까?" 모달에서 사용자가 확인했으므로
     *   2차 성공 모달까지 띄우면 UX가 중복된다.
     */
    const handleLogout = async (): Promise<void> => {
        try {
            await http.post("/auth/logout");
        } catch (error) {
            console.error("로그아웃 요청 실패:", error);
        } finally {
            /**
             * 관리자 라우트(/admin)에서 인증을 먼저 지우면
             * AdminRoute가 즉시 /login 으로 리다이렉트할 수 있다.
             * 그래서 먼저 사용자 홈으로 이동시킨 뒤 인증을 정리한다.
             */
            navigate("/", { replace: true });
            clearAuth();
        }
    };

    /**
     * 로그아웃 확인 모달 오픈
     * - 확인 버튼 클릭 시 실제 로그아웃 실행
     */
    const handleConfirmLogout = (): void => {
        setIsMenuOpen(false);

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

    /**
     * 드롭다운 토글
     */
    const handleToggleMenu = (): void => {
        setIsMenuOpen((prev) => !prev);
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="사이드바 토글"
                    onClick={onToggleSidebar}
                >
                    <svg
                        className={styles.iconSvg}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>

                <span className={styles.brandText}>ADMINISTRATOR</span>
            </div>

            <div className={styles.right}>
                <Link
                    to="/"
                    className={styles.action}
                    title="사용자 홈"
                    aria-label="사용자 홈"
                >
                    <svg
                        className={styles.actionSvg}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </Link>

                <div className={styles.dropdown} ref={dropdownRef}>
                    <button
                        type="button"
                        className={styles.dropdownTrigger}
                        onClick={handleToggleMenu}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                    >
                        <span>관리자</span>

                        <svg
                            className={`${styles.dropdownCaret} ${isMenuOpen ? styles.dropdownCaretOpen : ""
                                }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {isMenuOpen && (
                        <div className={styles.dropdownMenu} role="menu">
                            <button
                                type="button"
                                className={styles.dropdownItem}
                                role="menuitem"
                                onClick={handleConfirmLogout}
                            >
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}