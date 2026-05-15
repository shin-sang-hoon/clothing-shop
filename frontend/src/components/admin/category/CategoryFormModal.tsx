import { useState } from "react";
import type { AdminCategoryRow } from "@/shared/api/admin/categoryApi";
import type { CategoryFormValue } from "@/pages/admin/catalog/CategoryManagePage";
import { apiUploadCategoryImage } from "@/shared/api/admin/uploadApi";
import { resolveUrl } from "@/shared/config/env";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

/**
 * buildParentOptionLabel
 * - 부모 옵션 표시 문구 생성
 */
function buildParentOptionLabel(category: AdminCategoryRow): string {
  return `[${category.depth}뎁스] ${category.name}`;
}

/**
 * CategoryFormModalProps
 * - 카테고리 등록 / 상세수정 모달 props
 */
interface CategoryFormModalProps {
  visible: boolean;
  mode: "create" | "detail";
  form: CategoryFormValue;
  formError: string;
  parentOptions: AdminCategoryRow[];
  currentDepth: number;
  onClose: () => void;
  onChange: <Key extends keyof CategoryFormValue>(
    key: Key,
    value: CategoryFormValue[Key],
  ) => void;
  onSave: () => void;
}

/**
 * CategoryFormModal
 * - 카테고리 등록 / 상세수정 모달
 *
 * UI 원칙:
 * - 기본은 한 줄 1개 입력
 * - 짧은 필드만 2개 배치
 */
export default function CategoryFormModal({
  visible,
  mode,
  form,
  formError,
  parentOptions,
  currentDepth,
  onClose,
  onChange,
  onSave,
}: CategoryFormModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await apiUploadCategoryImage(file);
      onChange("imageUrl", url);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "카테고리 등록" : "카테고리 상세수정"}
          </p>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formStack}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>카테고리명 *</label>
              <input
                className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="예: 스킨케어"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>카테고리 코드 *</label>
              <input
                className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                value={form.code}
                onChange={(event) => onChange("code", event.target.value)}
                placeholder="예: 104001"
              />
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>상위 카테고리</label>
                <select
                  className={styles.formSelect}
                  value={form.parentId}
                  onChange={(event) =>
                    onChange("parentId", Number(event.target.value))
                  }
                >
                  <option value={0}>최상위(루트)</option>
                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {buildParentOptionLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>예상 뎁스</label>
                <div className={styles.formReadonlyBox}>{currentDepth}뎁스</div>
              </div>
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>정렬순서 *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.sortOrder}
                  onChange={(event) =>
                    onChange("sortOrder", Number(event.target.value))
                  }
                  placeholder="0"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>사용 여부 *</label>
                <select
                  className={styles.formSelect}
                  value={String(form.useYn)}
                  onChange={(event) =>
                    onChange("useYn", event.target.value === "true")
                  }
                >
                  <option value="true">사용</option>
                  <option value="false">미사용</option>
                </select>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>이미지</label>
              {form.imageUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={resolveUrl(form.imageUrl)}
                    alt="미리보기"
                    style={{ width: 80, height: 80, objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 8, padding: 4, background: "#f8fafc" }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className={styles.formInput}
                style={{ padding: "6px 8px" }}
                disabled={isUploading}
                onChange={handleImageFileChange}
              />
              {isUploading && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>업로드 중...</p>}
            </div>


            <div className={styles.formField}>
              <label className={styles.formLabel}>설명</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) =>
                  onChange("description", event.target.value)
                }
                placeholder="카테고리 설명"
              />
            </div>
          </div>

          {formError && <div className={styles.errorMsg}>{formError}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
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
