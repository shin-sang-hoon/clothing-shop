import { useRef, useState } from "react";
import styles from "./ReviewModal.module.css";

interface ReviewModalProps {
  isOpen: boolean;
  productName: string;
  productSizes: string[];
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => void | Promise<void>;
}

export interface ReviewFormData {
  rating: number;
  text: string;
  photo: File;
  size?: string;
  height?: number;
  weight?: number;
}

const SIZE_OPTIONS_CLOTHES = ["XS", "S", "M", "L", "XL", "2XL", "Free"];
const SIZE_OPTIONS_SHOES   = ["230", "240", "250", "260", "270", "280", "Free"];
const SIZE_OPTIONS = [...SIZE_OPTIONS_CLOTHES, ...SIZE_OPTIONS_SHOES];

export default function ReviewModal({ isOpen, productName, productSizes, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableSizes = productSizes.length > 0 ? productSizes : SIZE_OPTIONS;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (rating === 0) newErrors.rating = "별점을 선택해주세요.";
    if (!text.trim()) newErrors.text = "리뷰 내용을 입력해주세요.";
    else if (text.trim().length < 10) newErrors.text = "리뷰는 10자 이상 입력해주세요.";
    if (!photo) newErrors.photo = "사진을 첨부해주세요.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !photo) return;
    await onSubmit({
      rating,
      text,
      photo,
      size: size || undefined,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
    });
    handleReset();
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setText("");
    setPhoto(null);
    setPhotoPreview(null);
    setSize("");
    setHeight("");
    setWeight("");
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div className={styles.header}>
          <span className={styles.title}>리뷰 작성</span>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="닫기">✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.productName}>{productName}</p>

          {/* 별점 (필수) */}
          <div className={styles.field}>
            <label className={styles.label}>
              별점 <span className={styles.required}>*</span>
            </label>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.star} ${star <= (hoverRating || rating) ? styles.starFilled : ""}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => { setRating(star); setErrors((p) => ({ ...p, rating: "" })); }}
                  aria-label={`${star}점`}
                >
                  ★
                </button>
              ))}
              <span className={styles.ratingText}>
                {rating > 0 ? ["", "별로에요", "아쉬워요", "보통이에요", "좋아요", "최고예요"][rating] : ""}
              </span>
            </div>
            {errors.rating && <p className={styles.error}>{errors.rating}</p>}
          </div>

          {/* 리뷰 내용 (필수) */}
          <div className={styles.field}>
            <label className={styles.label}>
              리뷰 내용 <span className={styles.required}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.text ? styles.inputError : ""}`}
              placeholder="구매하신 상품에 대한 솔직한 리뷰를 남겨주세요. (10자 이상)"
              value={text}
              rows={5}
              maxLength={1000}
              onChange={(e) => { setText(e.target.value); setErrors((p) => ({ ...p, text: "" })); }}
            />
            <div className={styles.textCount}>{text.length} / 1000</div>
            {errors.text && <p className={styles.error}>{errors.text}</p>}
          </div>

          {/* 사진 첨부 (필수) */}
          <div className={styles.field}>
            <label className={styles.label}>
              사진 첨부 <span className={styles.required}>*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              id="review-photo"
              onChange={handlePhotoChange}
            />
            {photoPreview ? (
              <div className={styles.photoPreviewWrap}>
                <img src={photoPreview} alt="첨부 사진 미리보기" className={styles.photoPreview} />
                <button type="button" className={styles.photoRemoveBtn} onClick={handleRemovePhoto}>
                  ✕ 사진 삭제
                </button>
              </div>
            ) : (
              <label htmlFor="review-photo" className={`${styles.photoUploadLabel} ${errors.photo ? styles.inputError : ""}`}>
                <span className={styles.photoIcon}>📷</span>
                <span>사진을 추가해주세요</span>
                <span className={styles.photoHint}>JPG, PNG, WEBP · 최대 10MB</span>
              </label>
            )}
            {errors.photo && <p className={styles.error}>{errors.photo}</p>}
          </div>

          {/* 구분선 */}
          <div className={styles.divider} />
          <p className={styles.optionalLabel}>선택 정보 (미입력 시 제외됩니다)</p>

          {/* 사이즈 (선택) */}
          <div className={styles.field}>
            <label className={styles.label}>구매 사이즈</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[SIZE_OPTIONS_CLOTHES, SIZE_OPTIONS_SHOES].map((group, gi) => (
                <div key={gi} className={styles.sizeOptions}>
                  {(availableSizes.length > 0
                    ? group.filter((s) => availableSizes.includes(s))
                    : group
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.sizeBtn} ${size === s ? styles.sizeBtnActive : ""}`}
                      onClick={() => setSize((prev) => (prev === s ? "" : s))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 키 / 몸무게 (선택) */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>키</label>
              <div className={styles.inputUnit}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 175"
                  min={100}
                  max={250}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
                <span className={styles.unit}>cm</span>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>몸무게</label>
              <div className={styles.inputUnit}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 68"
                  min={30}
                  max={200}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <span className={styles.unit}>kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>취소</button>
          <button type="button" className={styles.submitBtn} onClick={handleSubmit}>리뷰 등록</button>
        </div>
      </div>
    </div>
  );
}
