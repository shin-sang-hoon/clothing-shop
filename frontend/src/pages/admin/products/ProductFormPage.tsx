import RichTextEditor from "@/components/admin/common/RichTextEditor";
import AdminBrandPickerModal from "@/components/admin/product/AdminBrandPickerModal";
import CategorySelectorModal from "@/components/admin/product/CategorySelectorModal";
import ProductBasicInfoSection from "@/components/admin/product/ProductBasicInfoSection";
import ProductFilterSection from "@/components/admin/product/ProductFilterSection";
import ProductImageSection from "@/components/admin/product/ProductImageSection";
import { SUB_IMG_SLOTS } from "@/components/admin/product/productFormTypes";
import { useProductFormPage } from "@/components/admin/product/useProductFormPage";
import styles from "../admin.module.css";
import formStyles from "./ProductFormPage.module.css";
import blockStyles from "./UnsavedBlockModal.module.css";

interface ProductFormPageProps {
  mode: "create" | "edit";
}

export default function ProductFormPage({ mode }: ProductFormPageProps) {
  const formPage = useProductFormPage({ mode });
  const { blocker } = formPage;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{mode === "create" ? "상품 등록" : "상품 수정"}</h1>
        </div>
      </div>

      <div className={formStyles.formCard}>
        <div className={formStyles.sectionTitle}>기본 정보</div>

        <ProductBasicInfoSection
          form={formPage.form}
          errors={formPage.errors}
          setField={formPage.setField}
          onOpenBrandModal={() => formPage.setShowBrandModal(true)}
          onOpenCategoryModal={() => formPage.setShowCategoryModal(true)}
        />

        <ProductImageSection
          mainImg={formPage.form.mainImg}
          subImgs={formPage.form.subImgs}
          imgUploading={formPage.imgUploading}
          subImgSlots={SUB_IMG_SLOTS}
          onMainImgChange={formPage.handleMainImgChange}
          onSubImgChange={formPage.handleSubImgChange}
          onMainImgRemove={() => formPage.setField("mainImg", "")}
          onSubImgRemove={formPage.handleSubImgRemove}
        />

        <ProductFilterSection
          filterGroupsLoading={formPage.filterGroupsLoading}
          filterGroups={formPage.filterGroups}
          attributeGroups={formPage.attributeGroups}
          optionGroups={formPage.optionGroups}
          generalGroups={formPage.generalGroups}
          attributeFilterIds={formPage.form.attributeTagIds}
          optionItems={formPage.form.optionItems}
          optionItemsError={formPage.errors.optionItems}
          colorOptions={formPage.form.colorOptions}
          colorOptionsError={formPage.errors.colorOptions}
          itemMode={formPage.form.itemMode}
          infoChips={formPage.infoChips}
          selectedAttributeNames={formPage.selectedAttributeNames}
          selectedOptionSummaries={formPage.selectedOptionSummaries}
          selectedFilterNames={formPage.selectedFilterNames}
          parentCategory={formPage.form.parentCategory}
          brandName={formPage.form.brandName}
          onToggleAttributeFilter={formPage.toggleAttributeFilter}
          onToggleOptionFilter={formPage.toggleOptionFilter}
          onToggleGeneralFilter={formPage.toggleAttributeFilter}
          onUpdateOptionQuantity={formPage.updateOptionQuantity}
          onAddColorOption={formPage.addColorOption}
          onUpdateColorOption={formPage.updateColorOption}
          onRemoveColorOption={formPage.removeColorOption}
        />

        <div className={formStyles.sectionTitle} style={{ marginTop: 28 }}>
          상품 설명
        </div>

        <RichTextEditor
          value={formPage.form.description}
          onChange={(html) => formPage.setField("description", html)}
          placeholder="상품 설명을 입력해 주세요."
          minHeight={280}
        />
      </div>

      <div className={formStyles.actionRow}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => formPage.navigate("/admin/products")}
        >
          취소
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={formPage.handleSubmit}
          disabled={formPage.submitting}
        >
          {formPage.submitting ? "저장 중..." : mode === "create" ? "등록" : "수정 완료"}
        </button>
      </div>

      {formPage.showBrandModal && (
        <AdminBrandPickerModal
          onClose={() => formPage.setShowBrandModal(false)}
          onSelect={formPage.onSelectBrand}
        />
      )}

      {formPage.showCategoryModal && (
        <CategorySelectorModal
          onClose={() => formPage.setShowCategoryModal(false)}
          onConfirm={formPage.onSelectCategory}
          initialParent={formPage.form.parentCategory}
          initialCategoryId={formPage.form.categoryId}
        />
      )}

      {/* 미저장 이탈 확인 다이얼로그 */}
      {blocker.state === "blocked" && (
        <div className={blockStyles.backdrop}>
          <div className={blockStyles.modal}>
            <div className={blockStyles.icon}>⚠️</div>
            <h3 className={blockStyles.title}>변경사항이 저장되지 않았습니다</h3>
            <p className={blockStyles.message}>
              아직 상품의 변경사항이 저장되지 않았습니다.
              <br />
              페이지를 이동하시겠습니까?
            </p>
            <div className={blockStyles.actions}>
              <button
                type="button"
                className={blockStyles.btnCancel}
                onClick={() => blocker.reset()}
              >
                취소
              </button>
              <button
                type="button"
                className={blockStyles.btnConfirm}
                onClick={() => blocker.proceed()}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
