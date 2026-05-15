import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { http } from "@/shared/api/http";
import { useAuthStore, type MeResponse } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import { BACKEND_ORIGIN } from "@/shared/config/env";
import SocialActionModal from "./SocialActionModal";
import FindIdModal from "./FindIdModal";
import FindPasswordModal from "./FindPasswordModal";
import ResetPasswordModal from "./ResetPasswordModal";
import styles from "./LoginForm.module.css";

/**
 * OAuth 로그인 유지 여부 전달용 임시 쿠키 이름
 * - 일반 로그인은 rememberMe를 body로 전송
 * - 소셜 로그인은 OAuth 시작 전에 이 쿠키에 체크 상태를 저장
 * - 백엔드 OAuth 성공 핸들러가 읽고 refresh 쿠키 발급 정책을 결정
 */
const OAUTH_REMEMBER_ME_COOKIE = "oauth_remember_me";

/**
 * LoginForm
 * - 이메일 로그인
 * - 로그인 유지 체크 지원
 * - 아이디 찾기 / 비밀번호 찾기 모달 제어
 * - 소셜 미연결 상태면 회원연결 모달 표시
 * - 이미 로그인 상태(me 존재)면 권한에 따라 자동 이동
 */
export default function LoginForm() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const me = useAuthStore((state) => state.me);
    const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setMe = useAuthStore((state) => state.setMe);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const openModal = useModalStore((state) => state.openModal);

    /**
     * 로그인 입력값
     */
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    /**
     * 로그인 유지 체크 여부
     * - true  : 브라우저 종료 후에도 로그인 유지
     * - false : 브라우저 종료 시 로그인 해제
     */
    const [rememberMe, setRememberMe] = useState(false);

    /**
     * 로그인 요청 중 여부
     */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * 소셜 회원 연결 모달 오픈 여부
     */
    const [isSocialActionModalOpen, setIsSocialActionModalOpen] = useState(false);

    /**
     * 아이디 찾기 모달 오픈 여부
     */
    const [isFindIdModalOpen, setIsFindIdModalOpen] = useState(false);

    /**
     * 비밀번호 찾기 모달 오픈 여부
     */
    const [isFindPasswordModalOpen, setIsFindPasswordModalOpen] = useState(false);

    /**
     * 비밀번호 변경 모달 오픈 여부
     */
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

    /**
     * 인증 완료된 이메일
     * - 비밀번호 재설정 모달에 전달
     */
    const [verifiedResetEmail, setVerifiedResetEmail] = useState("");

    /**
     * 소셜 미연결 상태 쿼리 파라미터
     */
    const socialStatus = searchParams.get("socialStatus") ?? "";
    const socialConnect = searchParams.get("socialConnect") ?? "";
    const socialConnectReason = searchParams.get("reason") ?? "";
    const socialProvider = searchParams.get("provider") ?? "";
    const socialEmail = searchParams.get("email") ?? "";
    const providerUserId = searchParams.get("providerUserId") ?? "";

    /**
     * 자동 로그아웃 후 로그인 페이지로 리다이렉트된 경우
     */
    const expiredSession = searchParams.get("session") ?? "";

    /**
     * 소셜 제공자 표시명
     */
    const providerLabel = useMemo(() => {
        switch (socialProvider.toLowerCase()) {
            case "google":
                return "Google";
            case "kakao":
                return "Kakao";
            case "naver":
                return "Naver";
            default:
                return "소셜";
        }
    }, [socialProvider]);

    /**
     * 관리자 포털 접근 가능 여부 확인
     * - 현재 프로젝트는 permission 기준 판별이 가장 안전하다.
     */
    const canAccessAdminPortal = (currentMe: MeResponse): boolean => {
        return Array.isArray(currentMe.permissions)
            ? currentMe.permissions.includes("PERM_ADMIN_PORTAL_ACCESS")
            : false;
    };

    /**
     * 로그인 페이지 진입 시 이미 로그인 상태라면 자동 이동
     * - AuthInitializer가 끝난 뒤에만 검사
     * - me가 있으면 로그인 페이지를 볼 필요가 없으므로 바로 이동
     */
    useEffect(() => {
        if (!isAuthInitialized) {
            return;
        }

        if (socialStatus === "required" || socialConnect === "success" || socialConnect === "failed") {
            return;
        }

        if (!me) {
            return;
        }

        if (canAccessAdminPortal(me)) {
            navigate("/admin", { replace: true });
            return;
        }

        navigate("/", { replace: true });
    }, [isAuthInitialized, me, navigate, socialConnect, socialStatus]);

    /**
     * 자동 로그아웃 후 로그인 페이지로 들어온 경우 안내 모달 표시
     * - 한 번 표시한 뒤 쿼리 파라미터 제거
     */
    useEffect(() => {
        if (expiredSession !== "expired") {
            return;
        }

        openModal(
            "warning",
            "세션 만료",
            "일정 시간 동안 동작이 없어 자동 로그아웃되었습니다.",
        );

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("session");
        setSearchParams(nextParams, { replace: true });
    }, [expiredSession, openModal, searchParams, setSearchParams]);

    /**
     * 소셜 로그인 실패 시 error=oauth 파라미터 처리
     */
    const oauthError = searchParams.get("error") ?? "";
    useEffect(() => {
        if (oauthError !== "oauth") {
            return;
        }

        openModal(
            "error",
            "소셜 로그인 실패",
            "소셜 로그인 중 오류가 발생했습니다. 다시 시도해 주세요.",
        );

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("error");
        nextParams.delete("reason");
        setSearchParams(nextParams, { replace: true });
    }, [oauthError, openModal, searchParams, setSearchParams]);

    /**
     * 일반 로그인 처리
     * - rememberMe 값을 함께 전송
     */
    const handleLogin = async (): Promise<void> => {
        try {
            setIsLoading(true);

            const loginResponse = await http.post("/auth/login", {
                email,
                password,
                rememberMe,
            });

            const accessTokenValue: string = loginResponse.data.accessToken;
            setAccessToken(accessTokenValue);

            const meResponse = await http.get<MeResponse>("/me");
            const currentMe = meResponse.data;
            setMe(currentMe);

            if (canAccessAdminPortal(currentMe)) {
                navigate("/admin", { replace: true });
                return;
            }

            navigate("/", { replace: true });
        } catch (error: any) {
            console.error("로그인 실패:", error);

            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "로그인에 실패했습니다.";

            clearAuth();
            setPassword("");

            openModal("error", "로그인 실패", String(message));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 엔터 입력 시 로그인 처리
     */
    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (event.key === "Enter" && !isLoading) {
            void handleLogin();
        }
    };

    /**
     * 아이디 찾기 모달 오픈
     */
    const handleFindId = (): void => {
        setIsFindIdModalOpen(true);
    };

    /**
     * 비밀번호 찾기 모달 오픈
     */
    const handleFindPassword = (): void => {
        setIsFindPasswordModalOpen(true);
    };

    /**
     * 비밀번호 찾기 인증 완료 후
     * - 비밀번호 변경 모달 오픈
     */
    const handleVerifiedResetEmail = (nextEmail: string): void => {
        setVerifiedResetEmail(nextEmail);
        setIsFindPasswordModalOpen(false);
        setIsResetPasswordModalOpen(true);
    };

    /**
     * 비밀번호 재설정 완료 후 처리
     */
    const handleResetPasswordSuccess = (): void => {
        setIsResetPasswordModalOpen(false);
        setVerifiedResetEmail("");
        openModal("success", "변경 완료", "비밀번호가 변경되었습니다.");
    };

    /**
     * OAuth 시작 전에 로그인 유지 여부를 임시 쿠키에 저장
     * - access/refresh token이 아니라 단순 체크 상태 전달용
     * - 10분 뒤 자동 만료되도록 짧게 설정
     */
    const setOAuthRememberMeCookie = (): void => {
        const cookieValue = rememberMe ? "1" : "0";

        document.cookie = [
            `${OAUTH_REMEMBER_ME_COOKIE}=${cookieValue}`,
            "Path=/",
            "Max-Age=600",
            "SameSite=Lax",
        ].join("; ");
    };

    /**
     * 소셜 로그인 공통 시작 처리
     * - 로그인 유지 체크 상태를 먼저 저장한 뒤 OAuth URL로 이동
     */
    const handleSocialLogin = (provider: "google" | "kakao" | "naver"): void => {
        setOAuthRememberMeCookie();
        window.location.href = `${BACKEND_ORIGIN}/oauth2/authorization/${provider}`;
    };

    /**
     * 소셜 로그인 시작
     */
    const handleGoogleLogin = (): void => {
        handleSocialLogin("google");
    };

    const handleKakaoLogin = (): void => {
        handleSocialLogin("kakao");
    };

    const handleNaverLogin = (): void => {
        handleSocialLogin("naver");
    };

    /**
     * 소셜 미연결 상태면 회원연결 모달 오픈
     */
    useEffect(() => {
        if (socialStatus === "required") {
            setIsSocialActionModalOpen(true);
        }
    }, [socialStatus]);

    useEffect(() => {
        if (!isAuthInitialized) {
            return;
        }

        if (socialConnect !== "success" && socialConnect !== "failed") {
            return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("socialConnect");
        nextParams.delete("reason");
        nextParams.delete("provider");
        nextParams.delete("email");
        nextParams.delete("providerUserId");
        nextParams.delete("socialStatus");
        setSearchParams(nextParams, { replace: true });

        if (socialConnect === "success") {
            openModal("success", "연동 완료", "소셜 계정 연동이 완료되었습니다.");
            if (me) {
                navigate("/mypage", { replace: true, state: { menu: "social-accounts" } });
            }
            return;
        }

        const isAlreadyLinked =
            socialConnectReason === "social_already_linked"
            || socialConnectReason === "member_already_has_provider";
        openModal(
            "error",
            "연동 실패",
            isAlreadyLinked ? "이미 연결된 정보가 있습니다." : "정보를 확인해주세요.",
        );
        if (me) {
            navigate("/mypage", { replace: true, state: { menu: "social-accounts" } });
        }
    }, [isAuthInitialized, me, navigate, openModal, searchParams, setSearchParams, socialConnect, socialConnectReason]);

    /**
     * 소셜 회원연결 모달 닫기
     */
    const handleCloseSocialActionModal = (): void => {
        setIsSocialActionModalOpen(false);

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("socialStatus");
        nextParams.delete("provider");
        nextParams.delete("email");
        nextParams.delete("providerUserId");

        setSearchParams(nextParams, { replace: true });
    };

    /**
     * 회원연결 페이지 이동
     */
    const handleMoveConnect = (): void => {
        navigate(
            `/social/connect?provider=${encodeURIComponent(
                socialProvider,
            )}&email=${encodeURIComponent(
                socialEmail,
            )}&providerUserId=${encodeURIComponent(providerUserId)}`,
        );
    };

    const handleMoveSignup = (): void => {
        navigate("/signup");
    };

    return (
        <>
            <div className={styles.authPage}>
                <div className={styles.authBox}>
                    <button
                        type="button"
                        className={styles.authLogo}
                        onClick={() => navigate("/")}
                    >
                        MUREAM
                    </button>

                    <h1 className={styles.authTitle}>로그인</h1>

                    <div className={styles.authFormGroup}>
                        <label htmlFor="login-email" className={styles.authLabel}>
                            이메일
                        </label>
                        <input
                            id="login-email"
                            type="text"
                            className={styles.authInput}
                            placeholder="이메일을 입력하세요"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.authFormGroup}>
                        <label htmlFor="login-password" className={styles.authLabel}>
                            비밀번호
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className={styles.authInput}
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="current-password"
                        />
                    </div>

                    <div className={styles.authOptionRow}>
                        <label htmlFor="remember-me" className={styles.rememberLabel}>
                            <input
                                id="remember-me"
                                type="checkbox"
                                className={styles.rememberCheckbox}
                                checked={rememberMe}
                                onChange={(event) => setRememberMe(event.target.checked)}
                            />
                            로그인 유지
                        </label>
                    </div>

                    <button
                        type="button"
                        className={styles.authSubmitBtn}
                        onClick={() => {
                            void handleLogin();
                        }}
                        disabled={isLoading}
                    >
                        {isLoading ? "로그인 중..." : "로그인"}
                    </button>

                    <div className={styles.authLinks}>
                        <button
                            type="button"
                            className={styles.authLinkButton}
                            onClick={handleFindId}
                        >
                            아이디 찾기
                        </button>

                        <button
                            type="button"
                            className={styles.authLinkButton}
                            onClick={handleFindPassword}
                        >
                            비밀번호 찾기
                        </button>

                        <Link to="/signup" className={styles.authTextLink}>
                            회원가입
                        </Link>
                    </div>

                    <div className={styles.socialSection}>
                        <div className={styles.socialDivider}>
                            <span className={styles.socialDividerText}>소셜 로그인</span>
                        </div>

                        <div className={styles.socialButtonGroup}>
                            <button
                                type="button"
                                className={`${styles.socialButton} ${styles.googleButton}`}
                                onClick={handleGoogleLogin}
                            >
                                Google로 로그인
                            </button>

                            <button
                                type="button"
                                className={`${styles.socialButton} ${styles.kakaoButton}`}
                                onClick={handleKakaoLogin}
                            >
                                Kakao로 로그인
                            </button>

                            <button
                                type="button"
                                className={`${styles.socialButton} ${styles.naverButton}`}
                                onClick={handleNaverLogin}
                            >
                                Naver로 로그인
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isSocialActionModalOpen && (
                <SocialActionModal
                    isOpen={isSocialActionModalOpen}
                    providerLabel={providerLabel}
                    email={socialEmail}
                    onClose={handleCloseSocialActionModal}
                    onSignup={handleMoveSignup}
                    onConnect={handleMoveConnect}
                />
            )}

            {isFindIdModalOpen && (
                <FindIdModal
                    isOpen={isFindIdModalOpen}
                    onClose={() => setIsFindIdModalOpen(false)}
                />
            )}

            {isFindPasswordModalOpen && (
                <FindPasswordModal
                    isOpen={isFindPasswordModalOpen}
                    onClose={() => setIsFindPasswordModalOpen(false)}
                    onVerified={handleVerifiedResetEmail}
                />
            )}

            {isResetPasswordModalOpen && (
                <ResetPasswordModal
                    isOpen={isResetPasswordModalOpen}
                    email={verifiedResetEmail}
                    onClose={() => {
                        setIsResetPasswordModalOpen(false);
                        setVerifiedResetEmail("");
                    }}
                    onSuccess={handleResetPasswordSuccess}
                />
            )}
        </>
    );
}
