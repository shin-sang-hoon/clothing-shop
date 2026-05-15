import { useState } from "react";
import type {
  CategoryFilterGroupResponse,
  FilterInGroupResponse,
} from "@/shared/api/categoryApi";
import type { OptionDraft, ColorOptionDraft } from "./productFormTypes";
import ColorPickerModal from "./ColorPickerModal";
import LineupPickerModal from "./LineupPickerModal";
import FilterPickerModal from "./FilterPickerModal";
import TagPickerModal from "./TagPickerModal";
import formStyles from "@/pages/admin/products/ProductFormPage.module.css";
import styles from "./ProductFilterSection.module.css";

const HIDDEN_GROUPS = new Set([
  "스타일팁",
  "판매유형",
  "코디핏",
  "캠페인",
  "라인 유형",
  "라인유형",
  "배송선택",
  "무신사추천",
  "핏",
  "무신사 혜택",
  "무신사혜택",
  "배송혜택",
  "배송 혜택",
  "할인 유형",
  "할인유형",
  "테마",
]);

const SHOE_CATEGORY = "신발";

function shouldHideGroup(name: string, parentCategory: string): boolean {
  if (HIDDEN_GROUPS.has(name)) return true;

  const isShoe = parentCategory === SHOE_CATEGORY;

  if (name === "신발 사이즈" && !isShoe) return true;
  if (name === "의류 사이즈" && isShoe) return true;
  if (name.includes("신발") && name.includes("라인") && !isShoe) return true;
  if ((name.includes("의류") || name.includes("옵션")) && name.includes("라인") && isShoe) {
    return true;
  }

  return false;
}

const isColorGroup = (name: string) => name === "색상" || name === "컬러";
const isLineupGroup = (name: string) => name.includes("라인");
const isBrandGroup = (name: string) => name === "브랜드";
const POPUP_SEARCH_GROUPS = new Set([
  "상세옵션",
  "상세 옵션",
  "패턴/무늬",
  "패턴",
  "무늬",
  "주요소재",
  "주요 소재",
  "소재",
  "스타일",
]);

const isDetailOptionGroup = (name: string) => POPUP_SEARCH_GROUPS.has(name);

// 속성 선택 모달에 표시할 그룹과 순서 (여기 없는 그룹은 숨김)
const ATTRIBUTE_FILTER_ORDER: string[] = [
  "표준 사이즈",
  "표준사이즈",
  "성별",
  "가격",
  "라인업",
  "주요소재",
  "주요 소재",
  "소재",
  "스타일",
  "패턴/무늬",
  "패턴",
  "무늬",
  "추천",
];

function getAttributeGroupOrder(name: string): number {
  const idx = ATTRIBUTE_FILTER_ORDER.indexOf(name);
  return idx === -1 ? 9999 : idx;
}

function isAllowedAttributeGroup(name: string): boolean {
  return ATTRIBUTE_FILTER_ORDER.includes(name);
}

type PopupState = {
  group: CategoryFilterGroupResponse;
  mode: "attribute" | "option";
} | null;

function AccordionGroup({
  label,
  multiSelect,
  selectedCount,
  children,
}: {
  label: string;
  multiSelect: boolean;
  selectedCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(selectedCount > 0);

  return (
    <div className={formStyles.tagGroupSection}>
      <div className={formStyles.tagGroupHeader} onClick={() => setOpen((prev) => !prev)}>
        <div className={formStyles.tagGroupHeaderLeft}>
          <span className={formStyles.tagGroupLabel}>{label}</span>
          {!multiSelect && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>(단일 선택)</span>
          )}
          {selectedCount > 0 && (
            <span className={formStyles.tagGroupBadge}>{selectedCount}</span>
          )}
        </div>
        <span
          className={`${formStyles.tagGroupArrow} ${open ? formStyles.tagGroupArrowOpen : ""}`}
        >
          ▾
        </span>
      </div>
      {open && <div className={formStyles.tagGroupBody}>{children}</div>}
    </div>
  );
}

function PopupGroupTrigger({
  label,
  selectedCount,
  onOpen,
}: {
  label: string;
  selectedCount: number;
  onOpen: () => void;
}) {
  return (
    <div className={formStyles.tagGroupSection} style={{ cursor: "pointer" }} onClick={onOpen}>
      <div className={formStyles.tagGroupHeader}>
        <div className={formStyles.tagGroupHeaderLeft}>
          <span className={formStyles.tagGroupLabel}>{label}</span>
          {selectedCount > 0 && (
            <span className={formStyles.tagGroupBadge}>{selectedCount}</span>
          )}
        </div>
        <span className={formStyles.tagGroupTriggerText}>
          {selectedCount > 0 ? "변경하기" : "선택하기"}
        </span>
      </div>
    </div>
  );
}

interface Props {
  filterGroupsLoading: boolean;
  filterGroups: CategoryFilterGroupResponse[];
  attributeGroups: CategoryFilterGroupResponse[];
  optionGroups: CategoryFilterGroupResponse[];
  generalGroups: CategoryFilterGroupResponse[];
  attributeFilterIds: number[];
  optionItems: OptionDraft[];
  optionItemsError?: string;
  colorOptions: ColorOptionDraft[];
  colorOptionsError?: string;
  itemMode: "AUCTION" | "RENTAL" | "BOTH";
  infoChips: string[];
  selectedAttributeNames: string[];
  selectedOptionSummaries: string[];
  selectedFilterNames: string[];
  parentCategory: string;
  brandName: string;
  onToggleAttributeFilter: (
    filterId: number,
    filterGroupId: number,
    multiSelectYn: boolean,
  ) => void;
  onToggleOptionFilter: (
    filterId: number,
    filterGroupId: number,
    multiSelectYn: boolean,
  ) => void;
  onToggleGeneralFilter: (
    filterId: number,
    filterGroupId: number,
    multiSelectYn: boolean,
  ) => void;
  onUpdateOptionQuantity: (filterId: number, quantity: string) => void;
  onAddColorOption: () => void;
  onUpdateColorOption: (index: number, field: keyof ColorOptionDraft, value: string) => void;
  onRemoveColorOption: (index: number) => void;
}

export default function ProductFilterSection({
  filterGroupsLoading,
  filterGroups,
  attributeGroups,
  optionGroups,
  generalGroups,
  attributeFilterIds,
  optionItems,
  optionItemsError,
  colorOptions,
  colorOptionsError,
  itemMode,
  infoChips,
  selectedAttributeNames,
  selectedOptionSummaries,
  selectedFilterNames,
  parentCategory,
  brandName,
  onToggleAttributeFilter,
  onToggleOptionFilter,
  onToggleGeneralFilter,
  onUpdateOptionQuantity,
  onAddColorOption,
  onUpdateColorOption,
  onRemoveColorOption,
}: Props) {
  const [colorPopup, setColorPopup] = useState<PopupState>(null);
  const [lineupPopup, setLineupPopup] = useState<PopupState>(null);
  const [tagPickerPopup, setTagPickerPopup] = useState<PopupState>(null);
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  function getVisibleFilters(group: CategoryFilterGroupResponse): FilterInGroupResponse[] | null {
    let filters = group.filters.filter((filter) => filter.name !== "직접입력");

    if (isBrandGroup(group.filterGroupName)) {
      if (!brandName) return null;
      const normalizedBrand = brandName.replace(/\s+/g, "").toLowerCase();
      filters = filters.filter(
        (filter) => filter.name.replace(/\s+/g, "").toLowerCase() === normalizedBrand,
      );
      if (filters.length === 0) return null;
    }

    return filters.length > 0 ? filters : null;
  }

  function renderAttributeGroup(group: CategoryFilterGroupResponse) {
    if (shouldHideGroup(group.filterGroupName, parentCategory)) return null;

    const visibleFilters = getVisibleFilters(group);
    if (!visibleFilters) return null;

    const selectedCount = visibleFilters.filter((filter) =>
      attributeFilterIds.includes(filter.id),
    ).length;

    if (isColorGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`attribute-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setColorPopup({ group, mode: "attribute" })}
        />
      );
    }

    if (isLineupGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`attribute-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setLineupPopup({ group, mode: "attribute" })}
        />
      );
    }

    if (isDetailOptionGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`attribute-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setTagPickerPopup({ group, mode: "attribute" })}
        />
      );
    }

    return (
      <AccordionGroup
        key={`attribute-${group.filterGroupId}`}
        label={group.filterGroupName}
        multiSelect={group.multiSelectYn}
        selectedCount={selectedCount}
      >
        <div className={formStyles.tagGrid}>
          {visibleFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${formStyles.tagBtn} ${
                attributeFilterIds.includes(filter.id) ? formStyles.tagBtnActive : ""
              }`}
              onClick={() =>
                onToggleAttributeFilter(filter.id, group.filterGroupId, group.multiSelectYn)
              }
            >
              {filter.name}
            </button>
          ))}
        </div>
      </AccordionGroup>
    );
  }

  function renderOptionGroup(group: CategoryFilterGroupResponse) {
    if (shouldHideGroup(group.filterGroupName, parentCategory)) return null;

    const visibleFilters = getVisibleFilters(group);
    if (!visibleFilters) return null;

    const selectedCount = visibleFilters.filter((filter) =>
      optionItems.some((entry) => entry.tagId === filter.id),
    ).length;

    if (isColorGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`option-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setColorPopup({ group, mode: "option" })}
        />
      );
    }

    if (isLineupGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`option-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setLineupPopup({ group, mode: "option" })}
        />
      );
    }

    return (
      <AccordionGroup
        key={`option-${group.filterGroupId}`}
        label={group.filterGroupName}
        multiSelect={group.multiSelectYn}
        selectedCount={selectedCount}
      >
        <div className={formStyles.optionGrid}>
          {visibleFilters.map((filter) => {
            const selected = optionItems.find((entry) => entry.tagId === filter.id);
            return (
              <div
                key={filter.id}
                className={`${formStyles.optionRow} ${
                  selected ? formStyles.optionRowActive : ""
                }`}
              >
                <label className={formStyles.optionCheck}>
                  <input
                    type="checkbox"
                    checked={Boolean(selected)}
                    onChange={() =>
                      onToggleOptionFilter(filter.id, group.filterGroupId, group.multiSelectYn)
                    }
                  />
                  <span>{filter.name}</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={formStyles.optionQtyInput}
                  value={selected?.quantity ?? ""}
                  placeholder="수량"
                  disabled={!selected}
                  onChange={(e) => onUpdateOptionQuantity(filter.id, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </AccordionGroup>
    );
  }

  function renderGeneralGroup(group: CategoryFilterGroupResponse) {
    if (shouldHideGroup(group.filterGroupName, parentCategory)) return null;

    const visibleFilters = getVisibleFilters(group);
    if (!visibleFilters) return null;

    const selectedCount = visibleFilters.filter((filter) =>
      attributeFilterIds.includes(filter.id),
    ).length;

    if (isColorGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`general-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setColorPopup({ group, mode: "attribute" })}
        />
      );
    }

    if (isLineupGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`general-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setLineupPopup({ group, mode: "attribute" })}
        />
      );
    }

    if (isDetailOptionGroup(group.filterGroupName)) {
      return (
        <PopupGroupTrigger
          key={`general-${group.filterGroupId}`}
          label={group.filterGroupName}
          selectedCount={selectedCount}
          onOpen={() => setTagPickerPopup({ group, mode: "attribute" })}
        />
      );
    }

    return (
      <AccordionGroup
        key={`general-${group.filterGroupId}`}
        label={group.filterGroupName}
        multiSelect={group.multiSelectYn}
        selectedCount={selectedCount}
      >
        <div className={formStyles.tagGrid}>
          {visibleFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${formStyles.tagBtn} ${
                attributeFilterIds.includes(filter.id) ? formStyles.tagBtnActive : ""
              }`}
              onClick={() =>
                onToggleGeneralFilter(filter.id, group.filterGroupId, group.multiSelectYn)
              }
            >
              {filter.name}
            </button>
          ))}
        </div>
      </AccordionGroup>
    );
  }

  function getPopupSelectedIds(popup: PopupState): number[] {
    if (!popup) return [];

    if (popup.mode === "attribute") {
      return popup.group.filters
        .filter((filter) => attributeFilterIds.includes(filter.id))
        .map((filter) => filter.id);
    }

    return popup.group.filters
      .filter((filter) => optionItems.some((entry) => entry.tagId === filter.id))
      .map((filter) => filter.id);
  }

  function handlePopupToggle(popup: PopupState, filterId: number) {
    if (!popup) return;

    if (popup.mode === "attribute") {
      onToggleAttributeFilter(filterId, popup.group.filterGroupId, popup.group.multiSelectYn);
      return;
    }

    onToggleOptionFilter(filterId, popup.group.filterGroupId, popup.group.multiSelectYn);
  }

  const totalAttributeCount = selectedAttributeNames.length;
  const totalOptionCount = selectedOptionSummaries.length;
  const totalFilterCount = selectedFilterNames.length;

  function renderTriggerCard(
    label: string,
    count: number,
    chips: string[],
    hint: string,
    maxChips: number,
    onClick: () => void,
  ) {
    return (
      <button
        type="button"
        className={`${styles.triggerCard} ${count > 0 ? styles.triggerCardActive : ""}`}
        onClick={onClick}
      >
        <div className={styles.triggerCardTop}>
          <span className={styles.triggerCardLabel}>{label}</span>
          {count > 0 ? (
            <span className={styles.triggerCardBadge}>{count}개 선택</span>
          ) : (
            <span className={styles.triggerCardBadgeMuted}>미선택</span>
          )}
        </div>
        {count > 0 ? (
          <div className={styles.triggerCardChips}>
            {chips.slice(0, maxChips).map((name) => (
              <span key={name} className={styles.triggerChip}>
                {name}
              </span>
            ))}
            {count > maxChips && (
              <span className={styles.triggerChipMore}>+{count - maxChips}</span>
            )}
          </div>
        ) : (
          <p className={styles.triggerCardHint}>{hint}</p>
        )}
        <span className={styles.triggerCardArrow}>열기</span>
      </button>
    );
  }

  return (
    <>
      {infoChips.length > 0 && (
        <div className={formStyles.infoChipRow}>
          {infoChips.map((chip) => (
            <span key={chip} className={formStyles.infoChip}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {filterGroupsLoading ? (
        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
          필터 그룹을 불러오는 중입니다.
        </div>
      ) : filterGroups.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
          사용 가능한 필터 그룹이 없습니다.
        </div>
      ) : (
        <>
          {/* ── 속성 구성 ── */}
          <div className={formStyles.sectionTitle} style={{ marginTop: 28 }}>
            속성 구성
          </div>
          <p className={formStyles.sectionGuide}>
            상품의 기본 속성(색상, 소재, 핏 등)을 선택합니다.
          </p>
          <div className={styles.triggerRow}>
            {renderTriggerCard(
              "속성 선택",
              totalAttributeCount,
              selectedAttributeNames,
              "클릭해서 상품 속성을 선택하세요.",
              4,
              () => setShowAttributeModal(true),
            )}
          </div>

          {/* ── 옵션 구성 (렌탈/렌탈+입찰만) ── */}
          {(itemMode === "RENTAL" || itemMode === "BOTH") && (
            <>
              <div className={formStyles.sectionTitle} style={{ marginTop: 28 }}>
                옵션 구성
              </div>
              <p className={formStyles.sectionGuide}>
                색상별 재고를 등록합니다. 색상명을 입력하고 보유 수량을 설정하세요.
              </p>

              {colorOptions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {colorOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 12px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="text"
                        placeholder="색상명 (예: 블랙, 화이트)"
                        value={opt.colorName}
                        onChange={(e) => onUpdateColorOption(idx, "colorName", e.target.value)}
                        style={{
                          flex: 1, height: 36, padding: "0 10px",
                          border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>수량</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="1"
                          value={opt.quantity}
                          onChange={(e) => onUpdateColorOption(idx, "quantity", e.target.value)}
                          style={{
                            width: 64, height: 36, padding: "0 8px", textAlign: "center",
                            border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none",
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveColorOption(idx)}
                        style={{
                          width: 28, height: 28, border: "none", background: "none",
                          color: "#9ca3af", fontSize: 16, cursor: "pointer", borderRadius: 4,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {colorOptionsError && (
                <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{colorOptionsError}</p>
              )}

              <button
                type="button"
                onClick={onAddColorOption}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", border: "1px dashed #6366f1",
                  background: "#f5f3ff", color: "#6366f1",
                  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                + 색상 추가
              </button>
            </>
          )}

          {/* ── 필터 구성 ── */}
          <div className={formStyles.sectionTitle} style={{ marginTop: 28 }}>
            필터 구성
          </div>
          <p className={formStyles.sectionGuide}>
            검색·카탈로그 노출에 사용되는 공통 필터를 선택합니다.
          </p>
          <div className={styles.triggerRow}>
            {renderTriggerCard(
              "필터 선택",
              totalFilterCount,
              selectedFilterNames,
              "클릭해서 필터를 선택하세요.",
              4,
              () => setShowFilterModal(true),
            )}
          </div>
        </>
      )}

      {showAttributeModal && (
        <FilterPickerModal title="속성 선택" onClose={() => setShowAttributeModal(false)}>
          <p className={formStyles.sectionGuide} style={{ marginBottom: 12 }}>
            상품의 기본 속성으로 사용할 필터를 선택하세요.
          </p>
          {[...attributeGroups]
            .filter((g) => isAllowedAttributeGroup(g.filterGroupName))
            .sort((a, b) => getAttributeGroupOrder(a.filterGroupName) - getAttributeGroupOrder(b.filterGroupName))
            .map(renderAttributeGroup)}
        </FilterPickerModal>
      )}


      {showFilterModal && (
        <FilterPickerModal title="필터 선택" onClose={() => setShowFilterModal(false)}>
          <p className={formStyles.sectionGuide} style={{ marginBottom: 12 }}>
            검색·카탈로그 노출에 사용할 공통 필터를 선택하세요.
          </p>
          {generalGroups.map(renderGeneralGroup)}
        </FilterPickerModal>
      )}

      {tagPickerPopup && (
        <TagPickerModal
          title={tagPickerPopup.group.filterGroupName}
          filters={tagPickerPopup.group.filters.filter((f) => f.name !== "직접입력")}
          selectedIds={getPopupSelectedIds(tagPickerPopup)}
          onToggle={(filterId) => handlePopupToggle(tagPickerPopup, filterId)}
          onClose={() => setTagPickerPopup(null)}
        />
      )}

      {colorPopup && (
        <ColorPickerModal
          filters={colorPopup.group.filters.filter((filter) => filter.name !== "직접입력")}
          selectedIds={getPopupSelectedIds(colorPopup)}
          onToggle={(filterId) => handlePopupToggle(colorPopup, filterId)}
          onClose={() => setColorPopup(null)}
        />
      )}

      {lineupPopup && (
        <LineupPickerModal
          filters={lineupPopup.group.filters.filter((filter) => filter.name !== "직접입력")}
          selectedIds={getPopupSelectedIds(lineupPopup)}
          onToggle={(filterId) => handlePopupToggle(lineupPopup, filterId)}
          onClose={() => setLineupPopup(null)}
        />
      )}
    </>
  );
}
