import { resolveUrl } from "@/shared/config/env";
import formStyles from "@/pages/admin/products/ProductFormPage.module.css";

interface Props {
  mainImg: string;
  subImgs: string[];
  imgUploading: boolean;
  subImgSlots: number;
  onMainImgChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubImgChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onMainImgRemove: () => void;
  onSubImgRemove: (index: number) => void;
}

export default function ProductImageSection({
  mainImg,
  subImgs,
  imgUploading,
  subImgSlots,
  onMainImgChange,
  onSubImgChange,
  onMainImgRemove,
  onSubImgRemove,
}: Props) {
  return (
    <>
      <div className={formStyles.sectionTitle} style={{ marginTop: 28 }}>
        상품 이미지
        {imgUploading && (
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
            업로드 중...
          </span>
        )}
      </div>

      <div className={formStyles.imageSection}>
        <div className={formStyles.mainImgBlock}>
          <div className={formStyles.imgBlockLabel}>메인 이미지</div>
          <label className={formStyles.imgBox} data-large>
            {mainImg ? (
              <>
                <img
                  src={resolveUrl(mainImg)}
                  alt="메인 이미지"
                  className={formStyles.imgPreview}
                />
                <button
                  type="button"
                  className={formStyles.imgRemoveBtn}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onMainImgRemove();
                  }}
                >
                  X
                </button>
              </>
            ) : (
              <div className={formStyles.imgPlaceholder}>
                <span className={formStyles.imgPlus}>+</span>
                <span className={formStyles.imgHint}>메인 이미지</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className={formStyles.imgFileInput}
              onChange={onMainImgChange}
            />
          </label>
        </div>

        <div className={formStyles.subImgsBlock}>
          <div className={formStyles.imgBlockLabel}>서브 이미지 (최대 {subImgSlots}개)</div>
          <div className={formStyles.subImgsRow}>
            {Array.from({ length: subImgSlots }).map((_, index) => (
              <label key={index} className={formStyles.imgBox}>
                {subImgs[index] ? (
                  <>
                    <img
                      src={resolveUrl(subImgs[index])}
                      alt={`서브 이미지 ${index + 1}`}
                      className={formStyles.imgPreview}
                    />
                    <button
                      type="button"
                      className={formStyles.imgRemoveBtn}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSubImgRemove(index);
                      }}
                    >
                      X
                    </button>
                  </>
                ) : (
                  <div className={formStyles.imgPlaceholder}>
                    <span className={formStyles.imgPlus}>+</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className={formStyles.imgFileInput}
                  onChange={(e) => onSubImgChange(e, index)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
