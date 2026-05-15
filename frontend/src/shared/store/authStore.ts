import { create } from "zustand";

/**
 * MeResponse
 * - 백엔드 /api/me 응답 형태
 */
export type MeResponse = {
  id: number;
  name: string;
  nickname: string | null;
  email: string;
  phoneNumber: string | null;
  zipCode: string | null;
  roadAddress: string | null;
  detailAddress: string | null;
  roles: string[];
  permissions: string[];
};

/**
 * AuthState
 * - 인증 관련 전역 상태
 */
type AuthState = {
  accessToken: string | null;
  me: MeResponse | null;

  /**
   * 앱 시작 시 인증 복구가 끝났는지 여부
   * - false: 아직 refresh / me 확인 전
   * - true: 인증 복구 시도 완료
   */
  isAuthInitialized: boolean;

  setAccessToken: (token: string | null) => void;
  setMe: (me: MeResponse | null) => void;
  setAuthInitialized: (value: boolean) => void;

  /**
   * 역할 보유 여부 확인
   */
  hasRole: (role: string) => boolean;

  /**
   * 권한 코드 보유 여부 확인
   */
  hasPerm: (perm: string) => boolean;

  /**
   * 관리자 여부 확인
   */
  isAdmin: () => boolean;

  clearAuth: () => void;
};

/**
 * useAuthStore
 * - Zustand 인증 상태 저장소
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  me: null,
  isAuthInitialized: false,

  /**
   * accessToken 저장/초기화
   */
  setAccessToken: (token) => set({ accessToken: token }),

  /**
   * 현재 로그인 사용자 정보 저장/초기화
   */
  setMe: (me) => set({ me }),

  /**
   * 인증 초기화 완료 여부 저장
   */
  setAuthInitialized: (value) => set({ isAuthInitialized: value }),

  /**
   * 역할 보유 여부 확인
   */
  hasRole: (role) => {
    const me = get().me;

    if (!me) {
      return false;
    }

    return me.roles.includes(role);
  },

  /**
   * 권한 코드 보유 여부 확인
   */
  hasPerm: (perm) => {
    const me = get().me;

    if (!me) {
      return false;
    }

    return me.permissions.includes(perm);
  },

  /**
   * 관리자 여부 확인
   * - ADMIN / ROLE_ADMIN 둘 다 대응
   */
  isAdmin: () => {
    const me = get().me;

    if (!me) {
      return false;
    }

    return me.roles.includes("ADMIN") || me.roles.includes("ROLE_ADMIN");
  },

  /**
   * clearAuth
   * - 인증 정보만 초기화
   * - isAuthInitialized는 유지
   */
  clearAuth: () =>
    set({
      accessToken: null,
      me: null,
    }),
}));
