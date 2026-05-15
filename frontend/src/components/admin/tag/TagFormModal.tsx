import type { TagFormValue } from "@/components/admin/tag/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface TagFormModalProps {
  visible: boolean;
  mode: "create" | "detail";
  form: TagFormValue;
  formError: string;
  onClose: () => void;
  onChange: <Key extends keyof TagFormValue>(
    key: Key,
    value: TagFormValue[Key],
  ) => void;
  onSave: () => void;
}

export default function TagFormModal({
  visible,
  mode,
  form,
  formError,
  onClose,
  onChange,
  onSave,
}: TagFormModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "태그 등록" : "태그 상세수정"}
          </p>

          <button type="button" className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formStack}>
            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>태그명 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  placeholder="예: 하객룩"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>태그 코드 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.code}
                  onChange={(event) => onChange("code", event.target.value)}
                  placeholder="예: GUEST_LOOK"
                />
              </div>
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>정렬순서</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.sortOrder}
                  onChange={(event) => onChange("sortOrder", Number(event.target.value))}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>사용 여부</label>
                <select
                  className={styles.formSelect}
                  value={String(form.useYn)}
                  onChange={(event) => onChange("useYn", event.target.value === "true")}
                >
                  <option value="true">사용</option>
                  <option value="false">미사용</option>
                </select>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>설명</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="태그 설명을 입력하세요."
              />
            </div>

            {formError ? <p className={styles.errorMsg}>{formError}</p> : null}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            취소
          </button>

          <button type="button" className={styles.saveButton} onClick={onSave}>
            {mode === "create" ? "등록" : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
