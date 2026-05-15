import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * 재시도 플래그 확장 타입
 */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * refresh 재시도 제외 대상 경로
 * - 로그인 실패 401
 * - 소셜 회원 연결 실패 401
 * - refresh 자체 401
 * - logout 요청
 * 는 refresh로 해결할 문제가 아니므로 제외
 */
const REFRESH_EXCLUDE_PATHS = [
  "/auth/login",
  "/auth/social/connect",
  "/auth/refresh",
  "/auth/logout",
];

/**
 * http
 * - baseURL: /api (vite proxy로 백엔드 연결)
 * - withCredentials: refresh_token(HttpOnly 쿠키) 주고받기
 * - Authorization 자동 첨부
 * - 401이면 refresh -> 원 요청 1회 재시도
 */
export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10_000,
});

/**
 * refresh 전용 axios 인스턴스
 * - refresh 요청은 일반 http 인터셉터를 타지 않게 분리
 * - 무한 루프 / 중첩 호출 방지 목적
 */
const refreshHttp = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10_000,
});

/**
 * 요청 URL이 refresh 제외 대상인지 확인
 */
function isRefreshExcluded(url?: string): boolean {
  if (!url) {
    return false;
  }

  return REFRESH_EXCLUDE_PATHS.some((path) => url.includes(path));
}

/**
 * 요청 인터셉터
 * - accessToken 자동 첨부
 */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers = (config.headers ?? {}) as typeof config.headers;
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * refresh 동시 호출 방지용 상태
 */
let isRefreshing = false;

/**
 * refresh 대기열
 * - 이미 refresh 중이면 이후 요청들은 여기서 대기
 */
let refreshWaitQueue: Array<(token: string | null) => void> = [];

/**
 * refresh 완료 후 대기 중 요청들에 결과 통지
 */
function notifyRefreshSubscribers(token: string | null): void {
  refreshWaitQueue.forEach((callback) => callback(token));
  refreshWaitQueue = [];
}

/**
 * AccessToken 재발급
 * - 반드시 refresh 전용 인스턴스를 사용
 */
async function refreshAccessToken(): Promise<string> {
  const response = await refreshHttp.post("/auth/refresh");
  const newToken: string | undefined = response.data?.accessToken;
  if (!newToken) {
    throw new Error("REFRESH_TOKEN_UNAVAILABLE");
  }

  useAuthStore.getState().setAccessToken(newToken);

  return newToken;
}

/**
 * 응답 인터셉터
 * - 401이면 refresh 후 원 요청 1회 재시도
 */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    /**
     * login / social connect / refresh / logout 은 refresh 대상에서 제외
     */
    if (isRefreshExcluded(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (isRefreshing) {
        const newToken = await new Promise<string | null>((resolve) => {
          refreshWaitQueue.push(resolve);
        });

        if (!newToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }

        originalRequest.headers = (originalRequest.headers ?? {}) as typeof originalRequest.headers;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return http(originalRequest);
      }

      isRefreshing = true;

      const newToken = await refreshAccessToken();
      notifyRefreshSubscribers(newToken);

      originalRequest.headers = (originalRequest.headers ?? {}) as typeof originalRequest.headers;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return http(originalRequest);
    } catch (refreshError) {
      notifyRefreshSubscribers(null);
      useAuthStore.getState().clearAuth();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
