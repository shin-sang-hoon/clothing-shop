import styles from "./FilterPickerModal.module.css";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function FilterPickerModal({ title, onClose, children }: Props) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
