import type { FilterFormValue } from "@/components/admin/filter/types";
import type { AdminFilterGroupRow } from "@/shared/api/admin/filterGroupApi";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface FilterFormModalProps {
  visible: boolean;
  mode: "create" | "detail";
  form: FilterFormValue;
  formError: string;
  filterGroups: AdminFilterGroupRow[];
  onClose: () => void;
  onChange: <Key extends keyof FilterFormValue>(
    key: Key,
    value: FilterFormValue[Key],
  ) => void;
  onSave: () => void;
}

export default function FilterFormModal({
  visible,
  mode,
  form,
  formError,
  filterGroups,
  onClose,
  onChange,
  onSave,
}: FilterFormModalProps) {
  if (!visible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "필터 등록" : "필터 상세 수정"}
          </p>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formStack}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>필터 그룹 *</label>
              <select
                className={`${styles.formSelect} ${formError ? styles.inputError : ""}`}
                value={form.filterGroupId}
                onChange={(event) => onChange("filterGroupId", Number(event.target.value))}
              >
                <option value={0}>필터 그룹 선택</option>
                {filterGroups.map((filterGroup) => (
                  <option key={filterGroup.id} value={filterGroup.id}>
                    {filterGroup.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>필터명 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  placeholder="예: 블랙"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>필터 코드 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.code}
                  onChange={(event) => onChange("code", event.target.value)}
                  placeholder="예: COLOR_BLACK"
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
              <label className={styles.formLabel}>색상 HEX</label>
              <input
                className={styles.formInput}
                value={form.colorHex}
                onChange={(event) => onChange("colorHex", event.target.value)}
                placeholder="#000000"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>아이콘 이미지 URL</label>
              <input
                className={styles.formInput}
                value={form.iconImageUrl}
                onChange={(event) => onChange("iconImageUrl", event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>설명</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="필터 설명을 입력해 주세요."
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
