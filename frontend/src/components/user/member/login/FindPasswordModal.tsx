import { useEffect, useState } from "react";
import { http } from "@/shared/api/http";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./LoginForm.module.css";

interface FindPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: (email: string) => void;
}

interface MessageResponse {
    message: string;
}

/**
 * FindPasswordModal
 * - 이메일 입력
 * - 인증번호 전송
 * - 인증번호 확인
 * - 성공 시 비밀번호 재설정 모달로 이동
 */
export default function FindPasswordModal({
    isOpen,
    onClose,
    onVerified,
}: FindPasswordModalProps) {
    const openModal = useModalStore((state) => state.openModal);

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isEmailLocked, setIsEmailLocked] = useState(false);
    const [codeSent, setCodeSent] = useState(false);

    /**
     * 모달 내부 상태 초기화
     */
    const resetState = (): void => {
        setEmail("");
        setCode("");
        setIsSending(false);
        setIsVerifying(false);
        setIsEmailLocked(false);
        setCodeSent(false);
    };

    /**
     * 모달이 닫히는 순간 이전 상태 제거
     */
    useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

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

    const handleSendCode = async (): Promise<void> => {
        const emailError = validateEmail();

        if (emailError) {
            openModal("warning", "입력 확인", emailError);
            return;
        }

        try {
            setIsSending(true);

            const response = await http.post<MessageResponse>(
                "/auth/password/send-reset-code",
                {
                    email: email.trim(),
                },
            );

            setIsEmailLocked(true);
            setCodeSent(true);
            setCode("");
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "인증번호 전송에 실패했습니다.";

            openModal("error", "전송 실패", String(message));
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyCode = async (): Promise<void> => {
        const emailError = validateEmail();

        if (emailError) {
            openModal("warning", "입력 확인", emailError);
            return;
        }

        if (!/^\d{6}$/.test(code.trim())) {
            openModal("warning", "입력 확인", "인증번호는 6자리 숫자여야 합니다.");
            return;
        }

        try {
            setIsVerifying(true);

            await http.post<MessageResponse>(
                "/auth/password/verify-reset-code",
                {
                    email: email.trim(),
                    code: code.trim(),
                },
            );

            onVerified(email.trim());
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "인증번호 확인에 실패했습니다.";

            openModal("error", "인증 실패", String(message));
        } finally {
            setIsVerifying(false);
        }
    };

    /**
     * 이메일 잠금 해제
     */
    const handleUnlockEmail = (): void => {
        setIsEmailLocked(false);
        setCodeSent(false);
        setCode("");
    };

    /**
     * 닫기 시 내부 값 초기화
     */
    const handleClose = (): void => {
        resetState();
        onClose();
    };

    return (
        <div className={styles.modalOverlay} >
            <div
                className={styles.modalBox}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>비밀번호 찾기</h2>
                    <button
                        type="button"
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.authFormGroup}>
                        <label className={styles.authLabel}>이메일</label>

                        <div className={styles.authInputRow}>
                            <input
                                type="email"
                                className={`${styles.authInput} ${isEmailLocked ? styles.authInputDisabled : ""}`}
                                placeholder="이메일을 입력하세요"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                disabled={isEmailLocked}
                            />

                            {!isEmailLocked ? (
                                <button
                                    type="button"
                                    className={styles.authVerifyBtn}
                                    onClick={handleSendCode}
                                    disabled={isSending}
                                >
                                    {isSending ? "전송 중..." : "인증번호 전송"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.authChangeBtn}
                                    onClick={handleUnlockEmail}
                                >
                                    이메일 변경
                                </button>
                            )}
                        </div>

                        {isEmailLocked && (
                            <p className={styles.modalGuideText}>
                                인증번호가 전송되어 이메일 변경이 잠겨 있습니다.
                            </p>
                        )}
                    </div>

                    {codeSent && (
                        <div className={styles.authFormGroup}>
                            <label className={styles.authLabel}>인증번호</label>

                            <div className={styles.authInputRow}>
                                <input
                                    type="text"
                                    className={styles.authInput}
                                    placeholder="인증번호 6자리"
                                    value={code}
                                    onChange={(event) =>
                                        setCode(event.target.value.replace(/[^0-9]/g, ""))
                                    }
                                    maxLength={6}
                                />

                                <button
                                    type="button"
                                    className={styles.authVerifyBtn}
                                    onClick={handleVerifyCode}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? "확인 중..." : "확인"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}