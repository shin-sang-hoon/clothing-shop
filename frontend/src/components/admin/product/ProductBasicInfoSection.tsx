import type { FormState } from "./productFormTypes";
import { STATUS_OPTIONS } from "./productFormTypes";
import formStyles from "@/pages/admin/products/ProductFormPage.module.css";

interface Props {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onOpenBrandModal: () => void;
  onOpenCategoryModal: () => void;
}

/**
 * 상품 기본 정보 섹션
 * - 상품명 / 브랜드 / 카테고리 / 상태 / 정가 / 대여가격 / 거래유형 입력 영역
 * - 거래유형(itemMode)에 따라 대여가격 노출 여부를 제어한다.
 */
export default function ProductBasicInfoSection({
  form,
  errors,
  setField,
  onOpenBrandModal,
  onOpenCategoryModal,
}: Props) {
  return (
    <div className={formStyles.grid2}>
      <div className={formStyles.fieldWrap}>
        <label className={formStyles.label}>
          상품명 <span className={formStyles.required}>*</span>
        </label>
        <input
          className={`${formStyles.input} ${errors.name ? formStyles.inputError : ""}`}
          placeholder="예: Air Force 1 Low"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
        {errors.name && <span className={formStyles.errorMsg}>{errors.name}</span>}
      </div>

      <div className={formStyles.fieldWrap}>
        <label className={formStyles.label}>
          브랜드 <span className={formStyles.required}>*</span>
        </label>
        <button
          type="button"
          className={`${formStyles.catSelectBtn} ${errors.brandId ? formStyles.inputError : ""}`}
          onClick={onOpenBrandModal}
        >
          {form.brandName ? (
            <span className={formStyles.catSub}>{form.brandName}</span>
          ) : (
            <span className={formStyles.catPlaceholder}>브랜드 선택...</span>
          )}
          <span className={formStyles.catArrow}>▾</span>
        </button>
        {errors.brandId && <span className={formStyles.errorMsg}>{errors.brandId}</span>}
      </div>

      <div className={formStyles.fieldWrap}>
        <label className={formStyles.label}>
          카테고리 <span className={formStyles.required}>*</span>
        </label>
        <button
          type="button"
          className={`${formStyles.catSelectBtn} ${errors.categoryId ? formStyles.inputError : ""}`}
          onClick={onOpenCategoryModal}
        >
          {form.categoryId ? (
            <>
              <span className={formStyles.catParent}>{form.parentCategory}</span>
              <span className={formStyles.catSub}> / {form.categoryName}</span>
            </>
          ) : (
            <span className={formStyles.catPlaceholder}>카테고리 선택...</span>
          )}
          <span className={formStyles.catArrow}>▾</span>
        </button>
        {errors.categoryId && <span className={formStyles.errorMsg}>{errors.categoryId}</span>}
      </div>

      <div className={formStyles.fieldWrap}>
        <label className={formStyles.label}>
          상태 <span className={formStyles.required}>*</span>
        </label>
        <div className={formStyles.radioGroup}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`${formStyles.radioBtn} ${form.status === status ? formStyles.radioBtnActive : ""}`}
              onClick={() => setField("status", status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className={formStyles.fieldWrap}>
        <label className={formStyles.label}>
          정가 <span className={formStyles.required}>*</span>
        </label>
        <div className={formStyles.inputAddon}>
          <input
            type="text"
            inputMode="numeric"
            className={`${formStyles.input} ${errors.retailPrice ? formStyles.inputError : ""}`}
            placeholder="예: 129000"
            value={form.retailPrice}
            onChange={(e) => {
              /**
               * 숫자만 허용
               */
              const raw = e.target.value.replace(/[^\d]/g, "");
              setField("retailPrice", raw);

              /**
               * 대여 가격이 아직 비어 있으면
               * 정가의 0.5%를 기본 제안값으로 자동 입력한다.
               */
              if (!form.rentalPrice && raw) {
                const suggested = Math.round(Number(raw) * 0.005);
                if (suggested > 0) {
                  setField("rentalPrice", String(suggested));
                }
              }
            }}
          />
          <span className={formStyles.addonText}>원</span>
        </div>
        {errors.retailPrice && <span className={formStyles.errorMsg}>{errors.retailPrice}</span>}
      </div>

      {/* 
        거래유형이 AUCTION 전용이면 대여 가격 입력창은 숨긴다.
        RENTAL 또는 BOTH 인 경우에만 노출한다.
      */}
      {form.itemMode !== "AUCTION" && (
        <div className={formStyles.fieldWrap}>
          <label className={formStyles.label}>
            대여 가격 <span className={formStyles.required}>*</span>
          </label>
          <div className={formStyles.inputAddon}>
            <input
              type="text"
              inputMode="numeric"
              className={`${formStyles.input} ${errors.rentalPrice ? formStyles.inputError : ""}`}
              placeholder="예: 5000"
              value={form.rentalPrice}
              onChange={(e) => setField("rentalPrice", e.target.value.replace(/[^\d]/g, ""))}
            />
            <span className={formStyles.addonText}>원</span>
          </div>
          {errors.rentalPrice && <span className={formStyles.errorMsg}>{errors.rentalPrice}</span>}
        </div>
      )}

      {/* 거래 유형 선택 영역 */}
      <div className={formStyles.fieldWrap} style={{ gridColumn: "1 / -1" }}>
        <label className={formStyles.label}>
          거래 유형 <span className={formStyles.required}>*</span>
        </label>

        <div className={formStyles.radioGroup}>
          {(["AUCTION", "RENTAL", "BOTH"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${formStyles.radioBtn} ${form.itemMode === mode ? formStyles.radioBtnActive : ""}`}
              onClick={() => setField("itemMode", mode)}
            >
              {mode === "AUCTION" ? "입찰" : mode === "RENTAL" ? "렌탈" : "입찰 + 렌탈"}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
          입찰: 사용자 간 거래 | 렌탈: 관리자 상품 대여 | 입찰 + 렌탈: 두 페이지 모두 노출
        </div>
      </div>
    </div>
  );
}