import { PropsWithChildren, useEffect } from "react";
import { http } from "@/shared/api/http";
import { useAuthStore, type MeResponse } from "@/shared/store/authStore";

/**
 * 인증 초기화 중복 호출 방지용 Promise
 * - React 18 StrictMode 개발 모드 중복 실행 방지
 */
let authInitializePromise: Promise<void> | null = null;

/**
 * AuthInitializer
 * - 앱 시작 시 refresh_token(HttpOnly 쿠키) 기준으로 인증 상태 복구
 * - 순서:
 *   1) /auth/refresh 호출 -> accessToken 복구
 *   2) /me 호출 -> 사용자 정보 복구
 * - 복구 시도가 끝날 때까지 children 렌더링 보류
 */
export default function AuthInitializer({ children }: PropsWithChildren) {
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setMe = useAuthStore((state) => state.setMe);
  const setAuthInitialized = useAuthStore((state) => state.setAuthInitialized);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      /**
       * 이미 초기화가 끝났으면 재실행하지 않음
       */
      if (useAuthStore.getState().isAuthInitialized) {
        return;
      }

      /**
       * 이미 진행 중인 초기화 Promise가 있으면 재사용
       */
      if (!authInitializePromise) {
        authInitializePromise = (async () => {
          try {
            /**
             * 1. accessToken 재발급
             * - 비로그인 상태에서는 401이 정상
             */
            const refreshResponse = await http.post("/auth/refresh");
            const newToken: string | undefined =
              refreshResponse.data?.accessToken;

            if (!newToken) {
              clearAuth();
              return;
            }

            setAccessToken(newToken);

            /**
             * 2. 현재 로그인 사용자 정보 조회
             */
            const meResponse = await http.get<MeResponse>("/me");
            setMe(meResponse.data);
          } catch {
            /**
             * refresh 실패 또는 /me 실패 시 비로그인 상태로 정리
             */
            clearAuth();
          } finally {
            setAuthInitialized(true);
          }
        })();
      }

      await authInitializePromise;
    };

    initializeAuth();
  }, [clearAuth, setAccessToken, setAuthInitialized, setMe]);

  /**
   * 인증 복구가 끝나기 전에는 렌더링 보류
   * - 필요하면 로딩 UI로 교체 가능
   */
  if (!isAuthInitialized) {
    return null;
  }

  return <>{children}</>;
}