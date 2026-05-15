import type { FilterGroupFormValue } from "@/components/admin/filterGroup/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface FilterGroupFormModalProps {
  visible: boolean;
  mode: "create" | "detail";
  form: FilterGroupFormValue;
  formError: string;
  onClose: () => void;
  onChange: <Key extends keyof FilterGroupFormValue>(
    key: Key,
    value: FilterGroupFormValue[Key],
  ) => void;
  onSave: () => void;
}

export default function FilterGroupFormModal({
  visible,
  mode,
  form,
  formError,
  onClose,
  onChange,
  onSave,
}: FilterGroupFormModalProps) {
  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "필터 그룹 등록" : "필터 그룹 상세 수정"}
          </p>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formStack}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>그룹명 *</label>
              <input
                className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="예: 색상"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>그룹 코드 *</label>
              <input
                className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                value={form.code}
                onChange={(event) => onChange("code", event.target.value)}
                placeholder="예: COLOR"
              />
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>선택 방식</label>
                <select
                  className={styles.formSelect}
                  value={String(form.multiSelectYn)}
                  onChange={(event) => onChange("multiSelectYn", event.target.value === "true")}
                >
                  <option value="true">다중 선택</option>
                  <option value="false">단일 선택</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>역할</label>
                <select
                  className={styles.formSelect}
                  value={form.role}
                  onChange={(event) =>
                    onChange("role", event.target.value as FilterGroupFormValue["role"])
                  }
                >
                  <option value="ATTRIBUTE">속성</option>
                  <option value="OPTION">옵션</option>
                  <option value="ALL">공통</option>
                </select>
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
                placeholder="필터 그룹 설명을 입력해 주세요."
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
