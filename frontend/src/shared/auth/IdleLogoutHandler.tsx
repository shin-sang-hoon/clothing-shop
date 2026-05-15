import { useEffect, useRef } from "react";
import { http } from "@/shared/api/http";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * 자동 로그아웃 기준 시간(분)
 * - .env 가 없어도 기본값 30분으로 동작
 * - 필요 시 VITE_IDLE_LOGOUT_MINUTES로 조절 가능
 */
const IDLE_TIMEOUT_MINUTES = Number(
    import.meta.env.VITE_IDLE_LOGOUT_MINUTES ?? 30,
);

/**
 * 자동 로그아웃 기준 시간(ms)
 */
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

/**
 * 사용자 활동으로 간주할 이벤트 목록
 */
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    "mousedown",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart",
    "click",
];

/**
 * IdleLogoutHandler
 * - 로그인 상태에서만 동작
 * - 일정 시간 활동이 없으면 자동 로그아웃 처리
 */
export default function IdleLogoutHandler() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    /**
     * 현재 타이머 ID 보관
     */
    const timeoutRef = useRef<number | null>(null);

    /**
     * 중복 로그아웃 방지 플래그
     */
    const isLoggingOutRef = useRef<boolean>(false);

    useEffect(() => {
        /**
         * 비로그인 상태면 타이머 제거 후 종료
         */
        if (!accessToken) {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            isLoggingOutRef.current = false;
            return;
        }

        /**
         * 실제 자동 로그아웃 처리
         */
        const handleIdleLogout = async (): Promise<void> => {
            if (isLoggingOutRef.current) {
                return;
            }

            isLoggingOutRef.current = true;

            try {
                await http.post("/auth/logout");
            } catch (error) {
                /**
                 * 서버 요청 실패여도 프론트 인증 상태는 정리해야 한다.
                 */
                console.error("자동 로그아웃 요청 실패:", error);
            } finally {
                clearAuth();
                window.location.replace("/login?session=expired");
            }
        };

        /**
         * 활동 감지 시 타이머 재시작
         */
        const resetIdleTimer = (): void => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = window.setTimeout(() => {
                void handleIdleLogout();
            }, IDLE_TIMEOUT_MS);
        };

        /**
         * 로그인 상태 진입 직후 타이머 시작
         */
        resetIdleTimer();

        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, resetIdleTimer, { passive: true });
        });

        return () => {
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, resetIdleTimer);
            });

            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [accessToken, clearAuth]);

    return null;
}