import { useEffect, useState } from "react";
import { http } from "@/shared/api/http";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./LoginForm.module.css";

interface FindIdModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FindEmailResponse {
    email: string;
}

/**
 * FindIdModal
 * - 이름 + 전화번호로 이메일(아이디) 찾기
 */
export default function FindIdModal({
    isOpen,
    onClose,
}: FindIdModalProps) {
    const openModal = useModalStore((state) => state.openModal);

    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [foundEmail, setFoundEmail] = useState("");

    /**
     * 모달 내부 상태 초기화
     */
    const resetState = (): void => {
        setName("");
        setPhoneNumber("");
        setFoundEmail("");
        setIsLoading(false);
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

    const handleFindId = async (): Promise<void> => {
        const normalizedName = name.trim();
        const normalizedPhoneNumber = phoneNumber.replace(/[^0-9]/g, "");

        if (!normalizedName) {
            openModal("warning", "입력 확인", "이름을 입력해주세요.");
            return;
        }

        if (!/^\d{10,11}$/.test(normalizedPhoneNumber)) {
            openModal("warning", "입력 확인", "전화번호는 숫자 10~11자리여야 합니다.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await http.post<FindEmailResponse>("/auth/find-email", {
                name: normalizedName,
                phoneNumber: normalizedPhoneNumber,
            });

            setFoundEmail(response.data.email);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "아이디 찾기에 실패했습니다.";

            openModal("error", "아이디 찾기 실패", String(message));
        } finally {
            setIsLoading(false);
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
        <div className={styles.modalOverlay} >
            <div
                className={styles.modalBox}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>아이디 찾기</h2>
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
                        <label className={styles.authLabel}>이름</label>
                        <input
                            type="text"
                            className={styles.authInput}
                            placeholder="이름을 입력하세요"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>

                    <div className={styles.authFormGroup}>
                        <label className={styles.authLabel}>전화번호</label>
                        <input
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

                    {foundEmail && (
                        <div className={styles.resultBox}>
                            <p className={styles.resultLabel}>가입된 아이디</p>
                            <p className={styles.resultValue}>{foundEmail}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        className={styles.modalSubmitBtn}
                        onClick={handleFindId}
                        disabled={isLoading}
                    >
                        {isLoading ? "조회 중..." : "아이디 찾기"}
                    </button>
                </div>
            </div>
        </div>
    );
}