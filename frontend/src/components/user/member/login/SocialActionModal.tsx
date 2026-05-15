import styles from "./SocialActionModal.module.css";

/**
 * SocialActionModalProps
 * - 소셜 로그인 후 추가 액션 선택용 모달
 * - 닫기는 X 버튼으로만 가능
 * - 회원가입 / 회원연결 버튼 클릭 시에만 페이지 이동
 */
interface SocialActionModalProps {
    isOpen: boolean;
    providerLabel: string;
    email: string;
    onClose: () => void;
    onSignup: () => void;
    onConnect: () => void;
}

/**
 * SocialActionModal
 * - 소셜 계정 추가 진행용 모달
 */
export default function SocialActionModal({
    isOpen,
    providerLabel,
    email,
    onClose,
    onSignup,
    onConnect,
}: SocialActionModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.overlay}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="social-action-title"
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="닫기"
                >
                    ×
                </button>

                <h2 id="social-action-title" className={styles.title}>
                    소셜 로그인 추가 진행
                </h2>

                <p className={styles.description}>
                    {providerLabel} 계정으로 로그인했습니다.
                </p>

                <div className={styles.infoBox}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>이메일</span>
                        <span className={styles.infoValue}>{email || "-"}</span>
                    </div>
                </div>

                <p className={styles.guideText}>
                    가입이 완료되지 않았거나 기존 회원 연결이 필요합니다.
                    <br />
                    원하는 작업을 선택해주세요.
                </p>

                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        className={`${styles.actionButton} ${styles.signupButton}`}
                        onClick={onSignup}
                    >
                        회원가입
                    </button>

                    <button
                        type="button"
                        className={`${styles.actionButton} ${styles.connectButton}`}
                        onClick={onConnect}
                    >
                        회원연결
                    </button>
                </div>
            </div>
        </div>
    );
}