import { useEffect } from "react";
import styles from "./CommonModal.module.css";
import { ModalActionType, ModalType } from "@/shared/store/modalStore";

/**
 * CommonModalProps
 * - 전역 공통 모달 props
 */
interface CommonModalProps {
    isOpen: boolean;
    type: ModalType;
    actionType: ModalActionType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    closeOnOverlay?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * CommonModal
 * - alert / confirm 공용 모달
 */
export default function CommonModal({
    isOpen,
    type,
    actionType,
    title,
    message,
    confirmText = "확인",
    cancelText = "취소",
    closeOnOverlay = true,
    onConfirm,
    onClose,
}: CommonModalProps) {
    /**
     * ESC 닫기 처리
     * - alert: 닫기
     * - confirm: 취소 처리
     */
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    /**
     * 타입별 아이콘 텍스트 반환
     */
    function getIconText(): string {
        switch (type) {
            case "success":
                return "✓";
            case "warning":
                return "!";
            case "error":
                return "✕";
            default:
                return "!";
        }
    }

    /**
     * 오버레이 클릭 처리
     * - 허용된 경우에만 닫기
     */
    function handleOverlayClick(): void {
        if (!closeOnOverlay) {
            return;
        }

        onClose();
    }

    const typeClassName =
        type === "success"
            ? styles.success
            : type === "warning"
                ? styles.warning
                : styles.error;

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div
                className={styles.modal}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="common-modal-title"
                aria-describedby="common-modal-message"
            >
                <div className={`${styles.iconWrap} ${typeClassName}`}>
                    <span className={styles.iconText}>{getIconText()}</span>
                </div>

                <h2 id="common-modal-title" className={styles.title}>
                    {title}
                </h2>

                <p id="common-modal-message" className={styles.message}>
                    {message}
                </p>

                <div className={styles.buttonArea}>
                    {actionType === "confirm" ? (
                        <>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>

                            <button
                                type="button"
                                className={styles.confirmButton}
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className={styles.confirmButtonFull}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}