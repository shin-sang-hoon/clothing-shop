import type {
  CategoryDisplayFilterGroup,
  CategoryDisplayTag,
  PublicCategoryItem,
} from "@/shared/api/categoryApi";
import styles from "@/pages/ShopPage.module.css";

type SortOption = string;

type ActiveChip = {
  key: string;
  id: number;
  name: string;
  type: "filter" | "tag";
};

interface Props {
  modeLabel: string;
  parentCategories: PublicCategoryItem[];
  currentParent: PublicCategoryItem | null;
  currentCategory: PublicCategoryItem | null;
  childCategories: PublicCategoryItem[];
  onNavigateHome: () => void;
  onNavigateMode: () => void;
  onSelectParent: (parent: PublicCategoryItem) => void;
  onSelectSub: (code?: string) => void;
  displayFilterGroups: CategoryDisplayFilterGroup[];
  displayTags: CategoryDisplayTag[];
  mappingLoading: boolean;
  selectedFilterIds: number[];
  selectedTagIds: number[];
  onOpenAttrPopup: () => void;
  onOpenTagPopup: () => void;
  onClearAllFilters: () => void;
  brand: string;
  onOpenBrandPopup: () => void;
  sortBy: SortOption;
  sortOptions: readonly SortOption[];
  onSortByChange: (value: SortOption) => void;
  gridCols: 2 | 4;
  onChangeGridCols: (cols: 2 | 4) => void;
  activeChips: ActiveChip[];
  onRemoveChip: (chip: { id: number; type: "filter" | "tag" }) => void;
}

export default function ShopListingHeader({
  modeLabel,
  parentCategories,
  currentParent,
  currentCategory,
  childCategories,
  onNavigateHome,
  onNavigateMode,
  onSelectParent,
  onSelectSub,
  displayFilterGroups,
  displayTags,
  mappingLoading,
  selectedFilterIds,
  selectedTagIds,
  onOpenAttrPopup,
  onOpenTagPopup,
  onClearAllFilters,
  brand,
  onOpenBrandPopup,
  sortBy,
  sortOptions,
  onSortByChange,
  gridCols,
  onChangeGridCols,
  activeChips,
  onRemoveChip,
}: Props) {
  return (
    <>
      <div className={styles.breadcrumb}>
        <span className={styles.breadLink} role="button" tabIndex={0} onClick={onNavigateHome}>홈</span>
        <span className={styles.breadSep}>&gt;</span>
        <span className={styles.breadLink} role="button" tabIndex={0} onClick={onNavigateMode}>{modeLabel}</span>
        {currentParent && (
          <>
            <span className={styles.breadSep}>&gt;</span>
            {currentCategory?.depth === 2 ? (
              <span className={styles.breadLink} role="button" tabIndex={0} onClick={() => onSelectSub(currentParent.code)}>
                {currentParent.name}
              </span>
            ) : (
              <span className={styles.breadCurrent}>{currentParent.name}</span>
            )}
          </>
        )}
        {currentCategory?.depth === 2 && (
          <>
            <span className={styles.breadSep}>&gt;</span>
            <span className={styles.breadCurrent}>{currentCategory.name}</span>
          </>
        )}
      </div>

      <div className={styles.categoryRow}>
        {parentCategories.map((parent) => (
          <button
            key={parent.id}
            type="button"
            className={`${styles.categoryTab} ${currentParent?.id === parent.id ? styles.categoryTabActive : ""}`}
            onClick={() => onSelectParent(parent)}
          >
            {parent.name}
          </button>
        ))}
      </div>

      {currentParent && (
        <div className={styles.subCategoryRow}>
          <button
            type="button"
            className={`${styles.subTab} ${currentCategory?.depth === 1 ? styles.subTabActive : ""}`}
            onClick={() => onSelectSub()}
          >
            전체
          </button>
          {childCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.subTab} ${currentCategory?.id === category.id ? styles.subTabActive : ""}`}
              onClick={() => onSelectSub(category.code)}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {(displayFilterGroups.length > 0 || displayTags.length > 0 || mappingLoading) && (
        <div className={styles.filterBar}>
          <div className={styles.filterBtns}>
            <button
              type="button"
              className={`${styles.filterBtn} ${brand ? styles.filterBtnActive : ""}`}
              onClick={onOpenBrandPopup}
            >
              {brand || "브랜드"}
              <span className={styles.filterArrow}>▾</span>
            </button>

            {displayFilterGroups.length > 0 && (
              <button
                type="button"
                className={`${styles.filterBtn} ${selectedFilterIds.length > 0 ? styles.filterBtnActive : ""}`}
                onClick={onOpenAttrPopup}
              >
                속성
                {selectedFilterIds.length > 0 && <span className={styles.filterCount}>{selectedFilterIds.length}</span>}
                <span className={styles.filterArrow}>▾</span>
              </button>
            )}

            {displayTags.length > 0 && (
              <button
                type="button"
                className={`${styles.filterBtn} ${selectedTagIds.length > 0 ? styles.filterBtnActive : ""}`}
                onClick={onOpenTagPopup}
              >
                태그
                {selectedTagIds.length > 0 && <span className={styles.filterCount}>{selectedTagIds.length}</span>}
                <span className={styles.filterArrow}>▾</span>
              </button>
            )}
          </div>

          <div className={styles.filterRight}>
            {(selectedFilterIds.length > 0 || selectedTagIds.length > 0) && (
              <button type="button" className={styles.clearBtn} onClick={onClearAllFilters}>초기화</button>
            )}
            <select className={styles.sortSelect} value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className={styles.gridControlRow}>
        <div className={styles.gridToggleWrap}>
          <button
            type="button"
            className={`${styles.gridToggleBtn} ${gridCols === 2 ? styles.gridToggleBtnActive : ""}`}
            onClick={() => onChangeGridCols(2)}
            title="2열 보기"
            aria-label="2열 보기"
          >
            <span className={`${styles.gridIcon} ${styles.gridIcon2}`} aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <i key={`g2-${index}`} />
              ))}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.gridToggleBtn} ${gridCols === 4 ? styles.gridToggleBtnActive : ""}`}
            onClick={() => onChangeGridCols(4)}
            title="4열 보기"
            aria-label="4열 보기"
          >
            <span className={`${styles.gridIcon} ${styles.gridIcon4}`} aria-hidden="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <i key={`g4-${index}`} />
              ))}
            </span>
          </button>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className={styles.activeChips}>
          {activeChips.map((chip) => (
            <span key={chip.key} className={styles.chip}>
              {chip.name}
              <button type="button" className={styles.chipRemove} onClick={() => onRemoveChip(chip)}>X</button>
            </span>
          ))}
          <button type="button" className={styles.chipClearAll} onClick={onClearAllFilters}>전체 초기화</button>
        </div>
      )}

      {displayFilterGroups.length === 0 && displayTags.length === 0 && !mappingLoading && (
        <div className={styles.sortOnlyRow}>
          <select className={styles.sortSelect} value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}

    </>
  );
}
