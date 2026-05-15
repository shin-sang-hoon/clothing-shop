import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { http } from "@/shared/api/http";
import { useAuthStore, MeResponse } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./LoginForm.module.css";

/**
 * SocialConnectForm
 * - 소셜 미연결 상태에서 기존 회원 계정으로 본인 확인 후
 *   소셜 계정을 연결하고 즉시 로그인 처리한다.
 */
export default function SocialConnectForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setMe = useAuthStore((state) => state.setMe);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const openModal = useModalStore((state) => state.openModal);

    const provider = searchParams.get("provider") ?? "";
    const socialEmail = searchParams.get("email") ?? "";
    const providerUserId = searchParams.get("providerUserId") ?? "";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const providerLabel = useMemo(() => {
        switch (provider.toLowerCase()) {
            case "google":
                return "Google";
            case "kakao":
                return "Kakao";
            case "naver":
                return "Naver";
            default:
                return "소셜";
        }
    }, [provider]);

    /**
     * 회원 연결 처리
     * 1) 기존 회원 이메일/비밀번호 검증
     * 2) 소셜 계정 연결
     * 3) accessToken 저장
     * 4) /me 조회 후 사용자 정보 저장
     */
    const handleConnect = async (): Promise<void> => {
        try {
            setIsLoading(true);

            const response = await http.post("/auth/social/connect", {
                provider,
                providerUserId,
                socialEmail,
                email,
                password,
            });

            const accessToken: string | undefined = response.data?.accessToken;

            if (!accessToken) {
                throw new Error("ACCESS_TOKEN_MISSING");
            }

            setAccessToken(accessToken);

            const meResponse = await http.get<MeResponse>("/me");
            setMe(meResponse.data);

            openModal("success", "회원 연결 완료", "소셜 계정 연결이 완료되었습니다.");
            navigate("/");
        } catch (error: any) {
            console.error("회원 연결 실패:", error);

            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "회원 연결에 실패했습니다.";

            clearAuth();
            setPassword("");

            openModal("error", "회원 연결 실패", String(message));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 엔터 입력 시 연결 처리
     */
    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (event.key === "Enter" && !isLoading) {
            handleConnect();
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authBox}>
                <button
                    type="button"
                    className={styles.authLogo}
                    onClick={() => navigate("/")}
                >
                    MUREAM
                </button>

                <h1 className={styles.authTitle}>회원 연결</h1>

                <div className={styles.authFormGroup}>
                    <label className={styles.authLabel}>연결할 소셜 계정</label>
                    <input
                        type="text"
                        className={styles.authInput}
                        value={`${providerLabel} / ${socialEmail || "-"}`}
                        readOnly
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="connect-email" className={styles.authLabel}>
                        기존 회원 이메일
                    </label>
                    <input
                        id="connect-email"
                        type="text"
                        className={styles.authInput}
                        placeholder="기존 회원 이메일을 입력하세요"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="username"
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="connect-password" className={styles.authLabel}>
                        비밀번호
                    </label>
                    <input
                        id="connect-password"
                        type="password"
                        className={styles.authInput}
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="button"
                    className={styles.authSubmitBtn}
                    onClick={handleConnect}
                    disabled={isLoading}
                >
                    {isLoading ? "연결 중..." : "회원 연결"}
                </button>

                <div className={styles.authLinks}>
                    <Link to="/login" className={styles.authTextLink}>
                        로그인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}