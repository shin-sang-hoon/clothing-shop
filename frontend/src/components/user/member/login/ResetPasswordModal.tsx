import { useEffect, useState } from "react";
import { http } from "@/shared/api/http";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./LoginForm.module.css";

interface ResetPasswordModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface MessageResponse {
    message: string;
}

/**
 * ResetPasswordModal
 * - 인증 완료된 이메일 기준 비밀번호 재설정
 */
export default function ResetPasswordModal({
    isOpen,
    email,
    onClose,
    onSuccess,
}: ResetPasswordModalProps) {
    const openModal = useModalStore((state) => state.openModal);

    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * 모달 내부 검증 메시지
     */
    const [validationMessage, setValidationMessage] = useState("");

    /**
     * 모달 내부 상태 초기화
     */
    const resetState = (): void => {
        setNewPassword("");
        setNewPasswordConfirm("");
        setValidationMessage("");
        setIsSubmitting(false);
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

    const validatePassword = (): string | null => {
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!newPassword) {
            return "새 비밀번호를 입력해주세요.";
        }

        if (!passwordRegex.test(newPassword)) {
            return "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.";
        }

        if (!newPasswordConfirm) {
            return "새 비밀번호 확인을 입력해주세요.";
        }

        if (newPassword !== newPasswordConfirm) {
            return "비밀번호와 비밀번호 확인이 일치하지 않습니다.";
        }

        return null;
    };

    const handleResetPassword = async (): Promise<void> => {
        const passwordError = validatePassword();

        if (passwordError) {
            setValidationMessage(passwordError);
            return;
        }

        try {
            setIsSubmitting(true);
            setValidationMessage("");

            await http.post<MessageResponse>("/auth/password/reset", {
                email,
                newPassword,
            });

            setNewPassword("");
            setNewPasswordConfirm("");
            setValidationMessage("");

            onSuccess();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "비밀번호 변경에 실패했습니다.";

            setValidationMessage(String(message));
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * 닫기 시 내부 값 초기화
     */
    const handleClose = (): void => {
        resetState();
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div
                className={styles.modalBox}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>비밀번호 변경</h2>
                    <button
                        type="button"
                        className={styles.modalCloseButton}
                        onClick={handleClose}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.resultBox}>
                        <p className={styles.resultLabel}>대상 이메일</p>
                        <p className={styles.resultValue}>{email}</p>
                    </div>

                    <div className={styles.authFormGroup}>
                        <label className={styles.authLabel}>새 비밀번호</label>
                        <input
                            type="password"
                            className={styles.authInput}
                            placeholder="새 비밀번호를 입력하세요"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                        />
                    </div>

                    <div className={styles.authFormGroup}>
                        <label className={styles.authLabel}>새 비밀번호 확인</label>
                        <input
                            type="password"
                            className={styles.authInput}
                            placeholder="새 비밀번호를 다시 입력하세요"
                            value={newPasswordConfirm}
                            onChange={(event) => setNewPasswordConfirm(event.target.value)}
                        />
                    </div>

                    {validationMessage && (
                        <p className={styles.modalErrorText}>{validationMessage}</p>
                    )}

                    <button
                        type="button"
                        className={styles.modalSubmitBtn}
                        onClick={handleResetPassword}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "변경 중..." : "비밀번호 변경"}
                    </button>
                </div>
            </div>
        </div>
    );
}