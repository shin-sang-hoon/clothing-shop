import { useState } from "react";
import { BACKEND_ORIGIN } from "@/shared/config/env";
import { apiUploadMainBannerImage } from "@/shared/api/admin/uploadApi";
import styles from "@/pages/admin/admin.module.css";

export interface MainBannerFormValue {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  useYn: boolean;
  description: string;
}

interface MainBannerFormModalProps {
  visible: boolean;
  mode: "create" | "edit";
  form: MainBannerFormValue;
  formError: string;
  onClose: () => void;
  onChange: <Key extends keyof MainBannerFormValue>(
    key: Key,
    value: MainBannerFormValue[Key],
  ) => void;
  onSave: () => void;
}

function resolveImageUrl(url: string): string {
  if (!url.trim()) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_ORIGIN}/${url.replace(/^\/+/, "")}`;
}

export default function MainBannerFormModal({
  visible,
  mode,
  form,
  formError,
  onClose,
  onChange,
  onSave,
}: MainBannerFormModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await apiUploadMainBannerImage(file);
      onChange("imageUrl", url);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  if (!visible) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <p className={styles.modalTitle}>
            {mode === "create" ? "메인 배너 등록" : "메인 배너 수정"}
          </p>
          <button type="button" className={styles.btnIcon} onClick={onClose}>
            x
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div>
              <label className={styles.formLabel}>제목 *</label>
              <input
                className={styles.formInput}
                value={form.title}
                onChange={(event) => onChange("title", event.target.value)}
              />
            </div>

            <div>
              <label className={styles.formLabel}>부제목</label>
              <input
                className={styles.formInput}
                value={form.subtitle}
                onChange={(event) => onChange("subtitle", event.target.value)}
              />
            </div>

            <div className={styles.formFull}>
              <label className={styles.formLabel}>배너 이미지 *</label>
              {form.imageUrl ? (
                <div style={{ marginBottom: 10 }}>
                  <img
                    src={resolveImageUrl(form.imageUrl)}
                    alt="메인 배너 미리보기"
                    style={{
                      width: "100%",
                      maxHeight: 220,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                className={styles.formInput}
                onChange={handleFileChange}
                disabled={isUploading}
              />

              {isUploading ? (
                <p style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>이미지 업로드 중...</p>
              ) : null}
            </div>

            <div className={styles.formFull}>
              <label className={styles.formLabel}>링크</label>
              <input
                className={styles.formInput}
                value={form.linkUrl}
                onChange={(event) => onChange("linkUrl", event.target.value)}
                placeholder="/shop 또는 https://..."
              />
            </div>

            <div>
              <label className={styles.formLabel}>정렬 순서</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.sortOrder}
                onChange={(event) => onChange("sortOrder", Number(event.target.value))}
              />
            </div>

            <div>
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

            <div className={styles.formFull}>
              <label className={styles.formLabel}>설명</label>
              <textarea
                className={styles.formTextarea}
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
              />
            </div>
          </div>

          {formError ? (
            <p style={{ marginTop: 12, color: "#dc2626", fontSize: 12 }}>{formError}</p>
          ) : null}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            취소
          </button>
          <button type="button" className={styles.btnPrimary} onClick={onSave}>
            {mode === "create" ? "등록" : "수정"}
          </button>
        </div>
      </div>
    </div>
  );
}
