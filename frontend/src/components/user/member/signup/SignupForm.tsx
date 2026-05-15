import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "@/shared/api/http";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./SignupForm.module.css";

/**
 * SignupRequest
 * - 회원가입 요청 DTO
 */
interface SignupRequest {
    name: string;
    nickname: string;
    phoneNumber: string;
    email: string;
    password: string;
}

/**
 * MessageResponse
 * - 서버 공통 메시지 응답 DTO
 */
interface MessageResponse {
    message: string;
}

/**
 * SignupForm
 * - 회원가입
 * - 이메일 인증번호 전송
 * - 이메일 인증번호 검증
 */
export default function SignupForm() {
    const navigate = useNavigate();
    const openModal = useModalStore((state) => state.openModal);

    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isEmailLocked, setIsEmailLocked] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState("");

    /**
     * 공통 에러 메시지 추출
     */
    const extractErrorMessage = (error: any, fallback: string): string => {
        return (
            error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            fallback
        );
    };

    /**
     * 이름 검증
     */
    const validateName = (): string | null => {
        const value = name.trim();

        if (!value) {
            return "이름을 입력해주세요.";
        }

        if (value.length < 2 || value.length > 20) {
            return "이름은 2자 이상 20자 이하로 입력해주세요.";
        }

        return null;
    };

    /**
     * 닉네임 검증
     */
    const validateNickname = (): string | null => {
        const value = nickname.trim();
        if (!value) return "닉네임을 입력해주세요.";
        if (value.length < 2 || value.length > 20) return "닉네임은 2자 이상 20자 이하로 입력해주세요.";
        return null;
    };

    /**
     * 전화번호 검증
     * - 숫자만 저장
     * - 10~11자리 허용
     */
    const validatePhoneNumber = (): string | null => {
        const value = phoneNumber.replace(/[^0-9]/g, "");

        if (!value) {
            return "전화번호를 입력해주세요.";
        }

        if (!/^\d{10,11}$/.test(value)) {
            return "전화번호는 숫자 10~11자리여야 합니다.";
        }

        return null;
    };

    /**
     * 이메일 검증
     */
    const validateEmail = (): string | null => {
        const value = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            return "이메일을 입력해주세요.";
        }

        if (!emailRegex.test(value)) {
            return "올바른 이메일 형식이 아닙니다.";
        }

        return null;
    };

    /**
     * 비밀번호 검증
     */
    const validatePassword = (): string | null => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!password) {
            return "비밀번호를 입력해주세요.";
        }

        if (!passwordRegex.test(password)) {
            return "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.";
        }

        if (!passwordConfirm) {
            return "비밀번호 확인을 입력해주세요.";
        }

        if (password !== passwordConfirm) {
            return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
        }

        return null;
    };

    /**
     * 인증번호 전송
     */
    const handleSendVerificationCode = async (): Promise<void> => {
        const emailError = validateEmail();

        if (emailError) {
            openModal("warning", "입력 확인", emailError);
            return;
        }

        try {
            setIsSendingCode(true);

            await http.post<MessageResponse>(
                "/auth/email/send-code",
                { email: email.trim() }
            );

            setIsEmailLocked(true);
            setEmailVerified(false);
            setVerifiedEmail("");
            setVerificationCode("");
        } catch (error: any) {
            openModal(
                "error",
                "전송 실패",
                extractErrorMessage(error, "인증번호 전송에 실패했습니다.")
            );
        } finally {
            setIsSendingCode(false);
        }
    };

    /**
     * 이메일 잠금 해제
     */
    const handleUnlockEmail = (): void => {
        setIsEmailLocked(false);
        setEmailVerified(false);
        setVerifiedEmail("");
        setVerificationCode("");
    };

    /**
     * 이메일 인증번호 확인
     */
    const handleVerifyEmail = async (): Promise<void> => {
        const emailError = validateEmail();

        if (emailError) {
            openModal("warning", "입력 확인", emailError);
            return;
        }

        if (!/^\d{6}$/.test(verificationCode.trim())) {
            openModal("warning", "입력 확인", "인증번호는 6자리 숫자여야 합니다.");
            return;
        }

        try {
            setIsVerifyingCode(true);

            await http.post<MessageResponse>(
                "/auth/email/verify-code",
                {
                    email: email.trim(),
                    code: verificationCode.trim(),
                }
            );

            setEmailVerified(true);
            setVerifiedEmail(email.trim());
        } catch (error: any) {
            setEmailVerified(false);
            setVerifiedEmail("");

            openModal(
                "error",
                "인증 실패",
                extractErrorMessage(error, "이메일 인증에 실패했습니다.")
            );
        } finally {
            setIsVerifyingCode(false);
        }
    };

    /**
     * 회원가입 처리
     */
    const handleRegister = async (): Promise<void> => {
        const nameError = validateName();
        if (nameError) {
            openModal("warning", "입력 확인", nameError);
            return;
        }

        const nicknameError = validateNickname();
        if (nicknameError) {
            openModal("warning", "입력 확인", nicknameError);
            return;
        }

        const phoneNumberError = validatePhoneNumber();
        if (phoneNumberError) {
            openModal("warning", "입력 확인", phoneNumberError);
            return;
        }

        const emailError = validateEmail();
        if (emailError) {
            openModal("warning", "입력 확인", emailError);
            return;
        }

        const passwordError = validatePassword();
        if (passwordError) {
            openModal("warning", "입력 확인", passwordError);
            return;
        }

        if (!emailVerified || verifiedEmail !== email.trim()) {
            openModal("warning", "인증 필요", "이메일 인증을 완료해주세요.");
            return;
        }

        const payload: SignupRequest = {
            name: name.trim(),
            nickname: nickname.trim(),
            phoneNumber: phoneNumber.replace(/[^0-9]/g, ""),
            email: email.trim(),
            password,
        };

        try {
            setIsSubmitting(true);

            const response = await http.post<MessageResponse>("/auth/signup", payload);

            localStorage.setItem(`pendingOnboarding_${email.trim()}`, "true");
            openModal(
                "success",
                "회원가입 완료",
                response.data.message || "회원가입이 완료되었습니다.",
                "로그인하러 가기",
                () => navigate("/login")
            );
        } catch (error: any) {
            openModal(
                "error",
                "회원가입 실패",
                extractErrorMessage(error, "회원가입에 실패했습니다.")
            );
        } finally {
            setIsSubmitting(false);
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

                <h1 className={styles.authTitle}>회원가입</h1>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-name" className={styles.authLabel}>
                        이름
                    </label>
                    <input
                        id="signup-name"
                        type="text"
                        className={styles.authInput}
                        placeholder="이름을 입력하세요"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={20}
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-nickname" className={styles.authLabel}>
                        닉네임 <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 400 }}>(채팅에서 표시됩니다)</span>
                    </label>
                    <input
                        id="signup-nickname"
                        type="text"
                        className={styles.authInput}
                        placeholder="2~20자 이내로 입력하세요"
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value)}
                        maxLength={20}
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-phone-number" className={styles.authLabel}>
                        전화번호
                    </label>
                    <input
                        id="signup-phone-number"
                        type="text"
                        inputMode="numeric"
                        className={styles.authInput}
                        placeholder="숫자만 입력하세요"
                        value={phoneNumber}
                        onChange={(event) =>
                            setPhoneNumber(event.target.value.replace(/[^0-9]/g, ""))
                        }
                        maxLength={11}
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-password" className={styles.authLabel}>
                        비밀번호
                    </label>
                    <input
                        id="signup-password"
                        type="password"
                        className={styles.authInput}
                        placeholder="영문 + 숫자 + 특수문자 8자 이상"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-password-confirm" className={styles.authLabel}>
                        비밀번호 확인
                    </label>
                    <input
                        id="signup-password-confirm"
                        type="password"
                        className={styles.authInput}
                        placeholder="비밀번호를 다시 입력하세요"
                        value={passwordConfirm}
                        onChange={(event) => setPasswordConfirm(event.target.value)}
                        autoComplete="new-password"
                    />
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-email" className={styles.authLabel}>
                        이메일
                    </label>

                    <div className={styles.authInputRow}>
                        <input
                            id="signup-email"
                            type="email"
                            className={`${styles.authInput} ${isEmailLocked ? styles.authInputDisabled : ""}`}
                            placeholder="이메일을 입력하세요"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            disabled={isEmailLocked}
                        />
                        <button
                            type="button"
                            className={styles.authVerifyBtn}
                            onClick={handleSendVerificationCode}
                            disabled={isSendingCode || isEmailLocked}
                        >
                            {isSendingCode ? "전송 중..." : "인증번호 전송"}
                        </button>
                    </div>

                    {isEmailLocked && (
                        <p className={styles.authGuideText}>
                            ✉ 인증번호가 전송되었습니다. 이메일을 확인해주세요.
                        </p>
                    )}
                </div>

                <div className={styles.authFormGroup}>
                    <label htmlFor="signup-code" className={styles.authLabel}>
                        인증번호
                    </label>

                    <div className={styles.authInputRow}>
                        <input
                            id="signup-code"
                            type="text"
                            className={styles.authInput}
                            placeholder="인증번호 6자리"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(event) =>
                                setVerificationCode(
                                    event.target.value.replace(/[^0-9]/g, "")
                                )
                            }
                        />

                        <button
                            type="button"
                            className={styles.authVerifyBtn}
                            onClick={handleVerifyEmail}
                            disabled={isVerifyingCode || !isEmailLocked}
                        >
                            {isVerifyingCode ? "확인 중..." : "확인"}
                        </button>
                    </div>

                    {emailVerified && verifiedEmail === email.trim() && (
                        <p className={styles.authVerified}>
                            ✓ 이메일 인증이 완료되었습니다.
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    className={styles.authSubmitBtn}
                    onClick={handleRegister}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "가입 처리 중..." : "가입 완료"}
                </button>

                <div className={styles.authLinks}>
                    <Link to="/login" className={styles.authTextLink}>
                        이미 계정이 있으신가요? 로그인
                    </Link>
                </div>
            </div>
        </div>
    );
}