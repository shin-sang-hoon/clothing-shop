import { useState } from "react";
import { resolveUrl } from "@/shared/config/env";
import { apiUploadBrandImage } from "@/shared/api/admin/uploadApi";
import type { BrandFormValue } from "@/components/admin/brand/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface BrandFormModalProps {
  visible: boolean;
  mode: "create" | "detail";
  form: BrandFormValue;
  formError: string;
  onClose: () => void;
  onChange: <Key extends keyof BrandFormValue>(
    key: Key,
    value: BrandFormValue[Key],
  ) => void;
  onSave: () => void;
}

export default function BrandFormModal({
  visible,
  mode,
  form,
  formError,
  onClose,
  onChange,
  onSave,
}: BrandFormModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await apiUploadBrandImage(file);
      onChange("iconImageUrl", url);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "브랜드 등록" : "브랜드 상세수정"}
          </p>

          <button type="button" className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formStack}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>브랜드 코드 *</label>
              <input
                className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                value={form.code}
                onChange={(event) => onChange("code", event.target.value)}
                placeholder="예: NIKE"
              />
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>브랜드 국문명 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.nameKo}
                  onChange={(event) => onChange("nameKo", event.target.value)}
                  placeholder="예: 나이키"
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>브랜드 영문명 *</label>
                <input
                  className={`${styles.formInput} ${formError ? styles.inputError : ""}`}
                  value={form.nameEn}
                  onChange={(event) => onChange("nameEn", event.target.value)}
                  placeholder="예: Nike"
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>아이콘 이미지</label>
              {form.iconImageUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img
                    src={resolveUrl(form.iconImageUrl)}
                    alt="미리보기"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 4,
                      background: "#f8fafc",
                    }}
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
              {isUploading && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  업로드 중...
                </p>
              )}
            </div>

            <div className={styles.formRowTwo}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>단독 여부</label>
                <select
                  className={styles.formSelect}
                  value={String(form.exclusiveYn)}
                  onChange={(event) =>
                    onChange("exclusiveYn", event.target.value === "true")
                  }
                >
                  <option value="false">일반</option>
                  <option value="true">단독</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>정렬순서</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={form.sortOrder}
                  onChange={(event) => onChange("sortOrder", Number(event.target.value))}
                />
              </div>
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

            <div className={styles.formField}>
              <label className={styles.formLabel}>설명</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="브랜드 설명을 입력하세요."
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
