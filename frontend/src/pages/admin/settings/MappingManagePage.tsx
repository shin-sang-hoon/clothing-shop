import { useEffect, useMemo, useRef, useState } from "react";
import AdminBrandPickerModal from "@/components/admin/product/AdminBrandPickerModal";
import CategorySelectorModal from "@/components/admin/product/CategorySelectorModal";
import FilterPickerModal from "@/components/admin/product/FilterPickerModal";
import {
  apiAutoSyncAdminBrandMapping,
  apiAutoSyncAdminCategoryMapping,
  apiAutoSyncAllAdminBrandMappings,
  apiAutoSyncAllAdminCategoryMappings,
  apiGetAdminBrandMapping,
  apiGetAdminCategoryMapping,
  apiGetAdminMappingJobStatus,
  apiUpdateAdminBrandMapping,
  apiUpdateAdminCategoryMapping,
} from "@/shared/api/admin/mappingApi";
import { apiGetAdminCategories, type AdminCategoryRow } from "@/shared/api/admin/categoryApi";
import { apiGetAdminBrands, type AdminBrandRow } from "@/shared/api/admin/brandApi";
import { apiGetAdminFilters, type AdminFilterRow } from "@/shared/api/admin/filterApi";
import { apiGetAdminTags, type AdminTagRow } from "@/shared/api/admin/tagApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";
import formStyles from "@/pages/admin/products/ProductFormPage.module.css";
import pageStyles from "./MappingManagePage.module.css";
import type { PublicCategoryItem } from "@/shared/api/categoryApi";

interface MappingManagePageProps {
  mode: "category" | "brand";
}

type FilterGroupSection = {
  id: number;
  name: string;
  filters: AdminFilterRow[];
};

export default function MappingManagePage({ mode }: MappingManagePageProps) {
  const openAlert = useModalStore((state) => state.openAlert);

  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [filters, setFilters] = useState<AdminFilterRow[]>([]);
  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | "">("");
  const [selectedOwnerNameState, setSelectedOwnerNameState] = useState("");
  const [selectedFilterIds, setSelectedFilterIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [autoSyncingAll, setAutoSyncingAll] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const autoSyncAllTimerRef = useRef<number | null>(null);

  const title = mode === "category" ? "카테고리 매핑 관리" : "브랜드 매핑 관리";
  const ownerLabel = mode === "category" ? "카테고리" : "브랜드";

  const selectedOwnerName = useMemo(() => {
    if (selectedOwnerNameState) {
      return selectedOwnerNameState;
    }
    if (!selectedOwnerId) {
      return "";
    }
    if (mode === "category") {
      return categories.find((item) => item.id === selectedOwnerId)?.name ?? "";
    }
    return brands.find((item) => item.id === selectedOwnerId)?.nameKo ?? "";
  }, [brands, categories, mode, selectedOwnerId, selectedOwnerNameState]);

  const filterGroups = useMemo<FilterGroupSection[]>(() => {
    const map = new Map<number, FilterGroupSection>();
    for (const filter of filters) {
      if (!map.has(filter.filterGroupId)) {
        map.set(filter.filterGroupId, {
          id: filter.filterGroupId,
          name: filter.filterGroupName,
          filters: [],
        });
      }
      map.get(filter.filterGroupId)?.filters.push(filter);
    }

    return Array.from(map.values()).map((group) => ({
      ...group,
      filters: [...group.filters].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    }));
  }, [filters]);

  const categoryModalItems = useMemo<PublicCategoryItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        code: category.code,
        depth: category.depth,
        parentId: category.parentId ?? null,
        imageUrl: category.imageUrl ?? null,
        sortOrder: category.sortOrder,
        useYn: category.useYn,
      })),
    [categories],
  );

  const selectedFilterNames = useMemo(
    () =>
      filters
        .filter((filter) => selectedFilterIds.includes(filter.id))
        .map((filter) => `${filter.filterGroupName}: ${filter.name}`),
    [filters, selectedFilterIds],
  );

  const selectedTagNames = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)).map((tag) => tag.name),
    [selectedTagIds, tags],
  );

  useEffect(() => {
    return () => {
      if (autoSyncAllTimerRef.current) {
        window.clearTimeout(autoSyncAllTimerRef.current);
        autoSyncAllTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    void loadOwners();
    void loadFilters();
    void loadTags();
  }, []);

  useEffect(() => {
    if (!selectedOwnerId) {
      setSelectedFilterIds([]);
      setSelectedTagIds([]);
      setSelectedOwnerNameState("");
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        const response =
          mode === "category"
            ? await apiGetAdminCategoryMapping(selectedOwnerId)
            : await apiGetAdminBrandMapping(selectedOwnerId);

        setSelectedOwnerNameState(response.ownerName);
        setSelectedFilterIds(response.filters.map((filter) => filter.id));
        setSelectedTagIds(response.tags.map((tag) => tag.id));
      } catch (error) {
        console.error("매핑 조회 실패:", error);
        setSelectedFilterIds([]);
        setSelectedTagIds([]);
        openAlert("error", "조회 실패", "매핑 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, openAlert, selectedOwnerId]);

  function toggleSelection(ids: number[], id: number, setter: (value: number[]) => void) {
    setter(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  async function loadOwners() {
    try {
      const [categoryRes, brandRes] = await Promise.all([
        apiGetAdminCategories({ page: 0, size: 200, keyword: "", useYn: true }),
        apiGetAdminBrands({ page: 0, size: 200, keyword: "", exclusiveYn: "", useYn: true }),
      ]);
      setCategories(categoryRes.content);
      setBrands(brandRes.content);
    } catch (error) {
      console.error("매핑 대상 조회 실패:", error);
      openAlert("error", "조회 실패", "카테고리 또는 브랜드 목록을 불러오지 못했습니다.");
    }
  }

  async function loadFilters(force = false) {
    if (filtersLoaded && !force) {
      return;
    }

    try {
      const filterRes = await apiGetAdminFilters({
        page: 0,
        size: 300,
        filterGroupId: "",
        keyword: "",
        useYn: true,
      });
      setFilters(filterRes.content);
      setFiltersLoaded(true);
    } catch (error) {
      console.error("필터 목록 조회 실패:", error);
      setFilters([]);
      setFiltersLoaded(false);
      openAlert("error", "조회 실패", "필터 목록을 불러오지 못했습니다.");
    }
  }

  async function loadTags(force = false) {
    if (tagsLoaded && !force) {
      return;
    }

    try {
      const tagRes = await apiGetAdminTags({
        page: 0,
        size: 300,
        keyword: "",
        useYn: true,
      });
      setTags(tagRes.content);
      setTagsLoaded(true);
    } catch (error) {
      console.error("태그 목록 조회 실패:", error);
      setTags([]);
      setTagsLoaded(false);
      openAlert("error", "조회 실패", "태그 목록을 불러오지 못했습니다.");
    }
  }

  async function handleSave() {
    if (!selectedOwnerId) {
      openAlert("warning", "선택 필요", `${ownerLabel}를 먼저 선택해 주세요.`);
      return;
    }

    try {
      setSaving(true);
      if (mode === "category") {
        await apiUpdateAdminCategoryMapping(selectedOwnerId, {
          filterIds: selectedFilterIds,
          tagIds: selectedTagIds,
        });
      } else {
        await apiUpdateAdminBrandMapping(selectedOwnerId, {
          filterIds: selectedFilterIds,
          tagIds: selectedTagIds,
        });
      }
      openAlert("success", "저장 완료", `${selectedOwnerName} 매핑이 저장되었습니다.`);
    } catch (error) {
      console.error("매핑 저장 실패:", error);
      openAlert("error", "저장 실패", "매핑 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoSync() {
    if (!selectedOwnerId) {
      openAlert("warning", "선택 필요", `${ownerLabel}를 먼저 선택해 주세요.`);
      return;
    }

    try {
      setAutoSyncing(true);
      const response =
        mode === "category"
          ? await apiAutoSyncAdminCategoryMapping(selectedOwnerId)
          : await apiAutoSyncAdminBrandMapping(selectedOwnerId);

      setSelectedOwnerNameState(response.ownerName);
      setSelectedFilterIds(response.filters.map((filter) => filter.id));
      setSelectedTagIds(response.tags.map((tag) => tag.id));

      openAlert("success", "자동 매핑 완료", `${selectedOwnerName} 기준 연결 데이터가 반영되었습니다.`);
    } catch (error) {
      console.error("자동 매핑 실패:", error);
      openAlert("error", "자동 매핑 실패", "연결 데이터를 기준으로 자동 매핑하지 못했습니다.");
    } finally {
      setAutoSyncing(false);
    }
  }

  async function handleAutoSyncAll() {
    try {
      setAutoSyncingAll(true);
      const startResponse =
        mode === "category"
          ? await apiAutoSyncAllAdminCategoryMappings()
          : await apiAutoSyncAllAdminBrandMappings();

      openAlert(
        "success",
        "실행됨",
        "전체 자동 매핑이 실행되었습니다. 완료되면 결과를 알려드립니다.",
      );

      const pollJobStatus = async (): Promise<void> => {
        try {
          const status = await apiGetAdminMappingJobStatus(startResponse.jobId);

          if (status.status === "RUNNING") {
            autoSyncAllTimerRef.current = window.setTimeout(() => {
              void pollJobStatus();
            }, 3000);
            return;
          }

          autoSyncAllTimerRef.current = null;

          if (status.status === "SUCCESS") {
            if (selectedOwnerId) {
              const detail =
                mode === "category"
                  ? await apiGetAdminCategoryMapping(selectedOwnerId)
                  : await apiGetAdminBrandMapping(selectedOwnerId);
              setSelectedOwnerNameState(detail.ownerName);
              setSelectedFilterIds(detail.filters.map((filter) => filter.id));
              setSelectedTagIds(detail.tags.map((tag) => tag.id));
            }

            if (status.result) {
              openAlert(
                "success",
                "자동 매핑 완료",
                `${status.result.totalCount}개의 ${mode === "category" ? "카테고리" : "브랜드"} 매핑이 갱신되었습니다.`,
              );
            } else {
              openAlert("success", "자동 매핑 완료", "전체 자동 매핑이 완료되었습니다.");
            }
            setAutoSyncingAll(false);
            return;
          }

          openAlert("error", "자동 매핑 실패", status.message || "전체 자동 매핑 작업이 실패했습니다.");
          setAutoSyncingAll(false);
        } catch (pollError) {
          console.error("자동 매핑 상태 조회 실패:", pollError);
          openAlert("error", "자동 매핑 실패", "작업 상태 조회 중 오류가 발생했습니다.");
          autoSyncAllTimerRef.current = null;
          setAutoSyncingAll(false);
        }
      };

      await pollJobStatus();
    } catch (error) {
      console.error("전체 자동 매핑 실패:", error);
      openAlert("error", "전체 자동 매핑 실패", "전체 매핑을 자동 생성하지 못했습니다.");
      setAutoSyncingAll(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleAutoSyncAll()}
            disabled={autoSyncingAll || autoSyncing || saving}
          >
            {autoSyncingAll ? "전체 자동 매핑 중..." : "전체 자동 매핑"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleAutoSync()}
            disabled={autoSyncingAll || autoSyncing || saving}
          >
            {autoSyncing ? "자동 매핑 중..." : "자동 매핑"}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "저장 중..." : "매핑 저장"}
          </button>
        </div>
      </div>

      <div className={formStyles.formCard}>
        <div className={formStyles.grid2}>
          <div className={formStyles.fieldWrap}>
            <label className={formStyles.label}>
              {ownerLabel}
              <span className={formStyles.required}>*</span>
            </label>
            <button
              type="button"
              className={formStyles.catSelectBtn}
              onClick={() =>
                mode === "category" ? setShowCategoryModal(true) : setShowBrandModal(true)
              }
            >
              {selectedOwnerId ? (
                <span className={formStyles.catSub}>{selectedOwnerName}</span>
              ) : (
                <span className={formStyles.catPlaceholder}>{ownerLabel} 선택...</span>
              )}
              <span className={formStyles.catArrow}>▾</span>
            </button>
          </div>

          <div className={formStyles.fieldWrap}>
            <label className={formStyles.label}>필터 선택</label>
            <button
              type="button"
              className={formStyles.catSelectBtn}
              onClick={() => {
                void loadFilters(true);
                setShowFilterModal(true);
              }}
            >
              {selectedFilterIds.length > 0 ? (
                <span className={formStyles.catSub}>{selectedFilterIds.length}개 선택됨</span>
              ) : (
                <span className={formStyles.catPlaceholder}>필터 선택...</span>
              )}
              <span className={formStyles.catArrow}>▾</span>
            </button>
          </div>

          <div className={formStyles.fieldWrap} style={{ gridColumn: "1 / -1" }}>
            <label className={formStyles.label}>태그 선택</label>
            <button
              type="button"
              className={formStyles.catSelectBtn}
              onClick={() => {
                void loadTags(true);
                setShowTagModal(true);
              }}
            >
              {selectedTagIds.length > 0 ? (
                <span className={formStyles.catSub}>{selectedTagIds.length}개 선택됨</span>
              ) : (
                <span className={formStyles.catPlaceholder}>태그 선택...</span>
              )}
              <span className={formStyles.catArrow}>▾</span>
            </button>
          </div>
        </div>

        <div className={formStyles.selectionSummary} style={{ marginTop: 24 }}>
          <div className={formStyles.selectionSummaryRow}>
            <div className={formStyles.selectionSummaryLabel}>{ownerLabel}</div>
            <div className={formStyles.selectionSummaryChips}>
              {selectedOwnerName ? (
                <span className={formStyles.summaryChip}>{selectedOwnerName}</span>
              ) : (
                <span className={`${formStyles.summaryChip} ${formStyles.summaryChipMuted}`}>
                  아직 선택하지 않았습니다.
                </span>
              )}
            </div>
          </div>

          <div className={formStyles.selectionSummaryRow}>
            <div className={formStyles.selectionSummaryLabel}>필터</div>
            <div className={formStyles.selectionSummaryChips}>
              {loading ? (
                <span className={`${formStyles.summaryChip} ${formStyles.summaryChipMuted}`}>
                  불러오는 중...
                </span>
              ) : selectedFilterNames.length > 0 ? (
                selectedFilterNames.map((name) => (
                  <span key={name} className={formStyles.summaryChip}>
                    {name}
                  </span>
                ))
              ) : (
                <span className={`${formStyles.summaryChip} ${formStyles.summaryChipMuted}`}>
                  선택된 필터가 없습니다.
                </span>
              )}
            </div>
          </div>

          <div className={formStyles.selectionSummaryRow}>
            <div className={formStyles.selectionSummaryLabel}>태그</div>
            <div className={formStyles.selectionSummaryChips}>
              {loading ? (
                <span className={`${formStyles.summaryChip} ${formStyles.summaryChipMuted}`}>
                  불러오는 중...
                </span>
              ) : selectedTagNames.length > 0 ? (
                selectedTagNames.map((name) => (
                  <span key={name} className={formStyles.summaryChip}>
                    {name}
                  </span>
                ))
              ) : (
                <span className={`${formStyles.summaryChip} ${formStyles.summaryChipMuted}`}>
                  선택된 태그가 없습니다.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <CategorySelectorModal
          categories={categoryModalItems}
          onClose={() => setShowCategoryModal(false)}
          onConfirm={(selected) => {
            const matched = categories.find((category) => category.id === selected.categoryId);
            setSelectedOwnerId(matched?.id ?? selected.categoryId);
            setSelectedOwnerNameState(selected.categoryName);
            setShowCategoryModal(false);
          }}
        />
      )}

      {showBrandModal && (
        <AdminBrandPickerModal
          onClose={() => setShowBrandModal(false)}
          onSelect={(brandId, brandName) => {
            setSelectedOwnerId(brandId);
            setSelectedOwnerNameState(brandName);
            setShowBrandModal(false);
          }}
        />
      )}

      {showFilterModal && (
        <FilterPickerModal title="필터 선택" onClose={() => setShowFilterModal(false)}>
          <div className={pageStyles.sectionStack}>
            {filterGroups.length === 0 ? (
              <div className={pageStyles.emptyText}>표시할 필터가 없습니다.</div>
            ) : (
              filterGroups.map((group) => (
                <div key={group.id} className={pageStyles.groupSection}>
                  <div className={pageStyles.groupTitle}>{group.name}</div>
                  <div className={pageStyles.optionGrid}>
                    {group.filters.map((filter) => {
                      const active = selectedFilterIds.includes(filter.id);
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          className={`${pageStyles.optionButton} ${
                            active ? pageStyles.optionButtonActive : ""
                          }`}
                          onClick={() =>
                            toggleSelection(selectedFilterIds, filter.id, setSelectedFilterIds)
                          }
                        >
                          {filter.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </FilterPickerModal>
      )}

      {showTagModal && (
        <FilterPickerModal title="태그 선택" onClose={() => setShowTagModal(false)}>
          <div className={pageStyles.sectionStack}>
            {tags.length === 0 ? (
              <div className={pageStyles.emptyText}>표시할 태그가 없습니다.</div>
            ) : (
              <div className={pageStyles.optionGrid}>
                {tags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`${pageStyles.optionButton} ${
                        active ? pageStyles.optionButtonActive : ""
                      }`}
                      onClick={() => toggleSelection(selectedTagIds, tag.id, setSelectedTagIds)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </FilterPickerModal>
      )}
    </div>
  );
}

