import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { dummyLikeBase } from "@/shared/utils/dummyLike";
import {
  apiGetCategoryDisplayMapping,
  type CategoryDisplayFilterGroup,
  type CategoryDisplayTag,
  type PublicCategoryItem,
} from "@/shared/api/categoryApi";
import { useCategoryStore } from "@/shared/store/categoryStore";
import { apiGetShopItems, type ShopItemResponse } from "@/shared/api/itemApi";

export type ShopListingMode = "shop" | "rental" | "auction";


const SERVER_PAGE_SIZE = 28;
const POPUP_FILTER_THRESHOLD = 4;
const EXCLUDED_FILTER_GROUP_NAMES = ["성별", "가격", "스타일", "주요소재", "패턴/무늬", "라인업"];
const SHOE_CATEGORY_NAME = "신발";
const SHOE_ALLOWED_SUBCATEGORIES = new Set(["스니커즈", "스포츠화", "구두", "부츠/워커", "샌들/슬리퍼", "패딩/퍼 신발", "신발용품", "신발 용품"]);

function sizeSortKey(name: string): number {
  if (name.includes("이하")) return (parseInt(name) || 0) - 0.5;
  if (name.includes("이상")) return (parseInt(name) || 9998) + 0.5;
  const num = parseInt(name);
  return isNaN(num) ? 9999 : num;
}
const SORT_OPTIONS = ["인기순", "최신순", "가격낮은순", "가격높은순"] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

function modeToItemMode(mode: ShopListingMode): string | undefined {
  if (mode === "rental") return "RENTAL";
  if (mode === "auction") return "AUCTION";
  return undefined;
}

function getSortPrice(mode: ShopListingMode, item: ShopItemResponse): number {
  return mode === "rental" ? (item.rentalPrice ?? 0) : item.retailPrice;
}

function sortProducts(mode: ShopListingMode, items: ShopItemResponse[], sortBy: SortOption) {
  return [...items].sort((a, b) => {
    if (sortBy === "인기순") return (dummyLikeBase(b.id) + (b.likeCnt ?? 0)) - (dummyLikeBase(a.id) + (a.likeCnt ?? 0));
    if (sortBy === "최신순") return b.id - a.id;
    if (sortBy === "가격낮은순") return getSortPrice(mode, a) - getSortPrice(mode, b);
    return getSortPrice(mode, b) - getSortPrice(mode, a);
  });
}

function filterProducts(params: {
  mode: ShopListingMode;
  items: ShopItemResponse[];
  appliedMin: number | null;
  appliedMax: number | null;
}) {
  const { mode, items, appliedMin, appliedMax } = params;
  let result = items.filter((item) => item.status === "판매중");

  if (appliedMin !== null || appliedMax !== null) {
    result = result.filter((item) => {
      const price = getSortPrice(mode, item);
      if (appliedMin !== null && price < appliedMin) return false;
      if (appliedMax !== null && price > appliedMax) return false;
      return true;
    });
  }

  return result;
}

export function useShopListing(mode: ShopListingMode) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryCode = searchParams.get("categoryCode") ?? "";
  const legacyParent = searchParams.get("parent") ?? "";
  const legacySub = searchParams.get("sub") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const brandCode = searchParams.get("brandCode") ?? "";
  const keyword = searchParams.get("keyword") ?? "";

  const categories = useCategoryStore((state) => state.categories);
  const [accumulatedItems, setAccumulatedItems] = useState<ShopItemResponse[]>([]);
  const [serverPage, setServerPage] = useState(0);
  const [serverTotal, setServerTotal] = useState(0);
  const [displayFilterGroups, setDisplayFilterGroups] = useState<CategoryDisplayFilterGroup[]>([]);
  const [displayTags, setDisplayTags] = useState<CategoryDisplayTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("인기순");
  const [selectedFilterIds, setSelectedFilterIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [openPopup, setOpenPopup] = useState<{
    type: "filter" | "tag";
    title: string;
    options: { id: number; name: string }[];
  } | null>(null);
  const [popupTempIds, setPopupTempIds] = useState<number[]>([]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const [gridCols, setGridCols] = useState<2 | 4>(4);
  const [brandInput, setBrandInput] = useState(brand);
  const [openBrandPopup, setOpenBrandPopup] = useState(false);
  const [attrPopupOpen, setAttrPopupOpen] = useState(false);


  const filterIdsKey = selectedFilterIds.join(",");
  const tagIdsKey = selectedTagIds.join(",");

  useEffect(() => {
    setLoading(true);
    setAccumulatedItems([]);
    setServerPage(0);
    apiGetShopItems({
      page: 0,
      size: SERVER_PAGE_SIZE,
      categoryCode: categoryCode || undefined,
      keyword: keyword || undefined,
      brand: brand || undefined,
      brandCode: brandCode || undefined,
      filterIds: selectedFilterIds.length > 0 ? selectedFilterIds : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      itemMode: modeToItemMode(mode),
    })
      .then((response) => {
        setAccumulatedItems(response.content);
        setServerTotal(response.totalElements);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, categoryCode, keyword, brand, brandCode, filterIdsKey, tagIdsKey]);

  useEffect(() => {
    setBrandInput(brand);
  }, [brand]);

  useEffect(() => {
    if (mode !== "shop" || !categories.length || categoryCode || (!legacyParent && !legacySub)) {
      return;
    }

    const matchedCategory =
      categories.find((category) => {
        if (legacySub) {
          const parentCategory = categories.find((entry) => entry.id === category.parentId);
          return category.depth === 2 && category.name === legacySub && parentCategory?.name === legacyParent;
        }
        return category.depth === 1 && category.name === legacyParent;
      }) ?? null;

    if (!matchedCategory) return;

    const next = new URLSearchParams(searchParams);
    next.delete("parent");
    next.delete("sub");
    next.set("categoryCode", matchedCategory.code);
    setSearchParams(next, { replace: true });
  }, [mode, categories, categoryCode, legacyParent, legacySub, searchParams, setSearchParams]);

  const currentCategory = useMemo(
    () => categories.find((category) => category.code === categoryCode) ?? null,
    [categories, categoryCode],
  );

  const currentParent = useMemo(() => {
    if (!currentCategory) return null;
    if (currentCategory.depth === 1) return currentCategory;
    return categories.find((category) => category.id === currentCategory.parentId) ?? null;
  }, [categories, currentCategory]);

  const parentCategories = useMemo(
    () => categories.filter((category) => category.depth === 1),
    [categories],
  );

  const childCategories = useMemo(() => {
    if (!currentParent) return [];
    const children = categories.filter((category) => category.depth === 2 && category.parentId === currentParent.id);
    if (currentParent.name.trim() === SHOE_CATEGORY_NAME) {
      return children.filter((c) => SHOE_ALLOWED_SUBCATEGORIES.has(c.name.trim()));
    }
    return children;
  }, [categories, currentParent]);

  useEffect(() => {
    if (!currentCategory?.code) {
      setDisplayFilterGroups([]);
      setDisplayTags([]);
      return;
    }

    setMappingLoading(true);
    apiGetCategoryDisplayMapping(currentCategory.code)
      .then((response) => {
        setDisplayFilterGroups(
          response.filterGroups
            .filter((group) => !EXCLUDED_FILTER_GROUP_NAMES.includes(group.filterGroupName))
            .map((group) => ({
              ...group,
              filters: group.filterGroupName.includes("사이즈")
                ? [...group.filters].sort((a, b) => sizeSortKey(a.name) - sizeSortKey(b.name))
                : group.filters,
            })),
        );
        setDisplayTags(
          mode === "auction"
            ? response.tags.filter((tag) => tag.name !== "부티크")
            : response.tags,
        );
      })
      .catch(() => {
        setDisplayFilterGroups([]);
        setDisplayTags([]);
      })
      .finally(() => setMappingLoading(false));
  }, [currentCategory?.code]);

  const popupFilterGroups = useMemo(
    () => displayFilterGroups.filter((group) => group.filters.length >= POPUP_FILTER_THRESHOLD),
    [displayFilterGroups],
  );

  const inlineFilterGroups = useMemo(
    () => displayFilterGroups.filter((group) => group.filters.length < POPUP_FILTER_THRESHOLD),
    [displayFilterGroups],
  );

  const filteredProducts = useMemo(
    () =>
      filterProducts({
        mode,
        items: accumulatedItems,
        appliedMin,
        appliedMax,
      }),
    [mode, accumulatedItems, appliedMin, appliedMax],
  );

  const products = useMemo(
    () => sortProducts(mode, filteredProducts, sortBy),
    [mode, filteredProducts, sortBy],
  );

  const hasMore = accumulatedItems.length < serverTotal;
  const hasPriceFilter = appliedMin !== null || appliedMax !== null;

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; id: number; name: string; type: "filter" | "tag" }> = [];
    displayFilterGroups.forEach((group) => {
      group.filters.forEach((filter) => {
        if (selectedFilterIds.includes(filter.id)) {
          chips.push({ key: `filter-${filter.id}`, id: filter.id, name: filter.name, type: "filter" });
        }
      });
    });
    displayTags.forEach((tag) => {
      if (selectedTagIds.includes(tag.id)) {
        chips.push({ key: `tag-${tag.id}`, id: tag.id, name: tag.name, type: "tag" });
      }
    });
    return chips;
  }, [displayFilterGroups, displayTags, selectedFilterIds, selectedTagIds]);

  const popupPreviewCount = useMemo(() => {
    if (!openPopup) return products.length;
    return products.length;
  }, [openPopup, products.length]);

  function updateCategory(code?: string) {
    const next = new URLSearchParams(searchParams);
    next.delete("parent");
    next.delete("sub");
    if (code) next.set("categoryCode", code);
    else next.delete("categoryCode");
    setSearchParams(next);
    setSelectedFilterIds([]);
    setSelectedTagIds([]);
  }

  function handleSelectParent(parent: PublicCategoryItem) {
    updateCategory(parent.code);
  }

  function handleSelectSub(childCode?: string) {
    updateCategory(childCode ?? currentParent?.code);
  }

  function toggleInlineFilter(filterId: number) {
    setSelectedFilterIds((prev) =>
      prev.includes(filterId) ? prev.filter((value) => value !== filterId) : [...prev, filterId],
    );
  }

  function openFilterPopup(group: CategoryDisplayFilterGroup) {
    setPopupTempIds(
      selectedFilterIds.filter((filterId) => group.filters.some((filter) => filter.id === filterId)),
    );
    setOpenPopup({
      type: "filter",
      title: group.filterGroupName,
      options: group.filters.map((filter) => ({ id: filter.id, name: filter.name })),
    });
  }

  function openTagPopup() {
    setPopupTempIds(selectedTagIds);
    setOpenPopup({
      type: "tag",
      title: "태그",
      options: displayTags.map((tag) => ({ id: tag.id, name: tag.name })),
    });
  }

  function openAttrPopup() {
    setPopupTempIds([...selectedFilterIds]);
    setAttrPopupOpen(true);
  }

  function confirmAttrPopup() {
    setSelectedFilterIds([...popupTempIds]);
    setAttrPopupOpen(false);
    setPopupTempIds([]);
  }

  function handleBrandSelect(brandName: string) {
    const next = new URLSearchParams(searchParams);
    if (brandName) next.set("brand", brandName);
    else next.delete("brand");
    setSearchParams(next);
    setOpenBrandPopup(false);
  }

  function togglePopupOption(optionId: number) {
    setPopupTempIds((prev) =>
      prev.includes(optionId) ? prev.filter((value) => value !== optionId) : [...prev, optionId],
    );
  }

  function selectAllPopupOptions() {
    if (!openPopup) return;
    setPopupTempIds(openPopup.options.map((option) => option.id));
  }

  function confirmPopup() {
    if (!openPopup) return;
    if (openPopup.type === "filter") {
      setSelectedFilterIds((prev) => {
        const otherIds = prev.filter((filterId) => !openPopup.options.some((option) => option.id === filterId));
        return Array.from(new Set([...otherIds, ...popupTempIds]));
      });
    } else {
      setSelectedTagIds(Array.from(new Set(popupTempIds)));
    }
    setOpenPopup(null);
    setPopupTempIds([]);
  }

  function clearAllFilters() {
    setSelectedFilterIds([]);
    setSelectedTagIds([]);
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMin(null);
    setAppliedMax(null);
  }

  function applyPriceFilter() {
    const nextMin = minPriceInput.trim() ? Number(minPriceInput) : null;
    const nextMax = maxPriceInput.trim() ? Number(maxPriceInput) : null;
    setAppliedMin(nextMin !== null && !Number.isNaN(nextMin) ? nextMin : null);
    setAppliedMax(nextMax !== null && !Number.isNaN(nextMax) ? nextMax : null);
  }

  function clearPriceFilter() {
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedMin(null);
    setAppliedMax(null);
  }

  function removeActiveChip(chip: { id: number; type: "filter" | "tag" }) {
    if (chip.type === "filter") {
      setSelectedFilterIds((prev) => prev.filter((value) => value !== chip.id));
      return;
    }
    setSelectedTagIds((prev) => prev.filter((value) => value !== chip.id));
  }

  function handleBrandSearch() {
    const next = new URLSearchParams(searchParams);
    next.delete("brandCode");
    if (brandInput.trim()) next.set("brand", brandInput.trim());
    else next.delete("brand");
    setSearchParams(next);
  }

  function handleBrandClear() {
    setBrandInput("");
    const next = new URLSearchParams(searchParams);
    next.delete("brand");
    next.delete("brandCode");
    setSearchParams(next);
  }

  function clearKeyword() {
    setSearchParams({});
  }

  async function loadMore() {
    if (loadingMore) return;
    const nextPage = serverPage + 1;
    setLoadingMore(true);
    try {
      const response = await apiGetShopItems({
        page: nextPage,
        size: SERVER_PAGE_SIZE,
        categoryCode: categoryCode || undefined,
        keyword: keyword || undefined,
        brand: brand || undefined,
        brandCode: brandCode || undefined,
        filterIds: selectedFilterIds.length > 0 ? selectedFilterIds : undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        itemMode: modeToItemMode(mode),
      });
      setAccumulatedItems((prev) => [...prev, ...response.content]);
      setServerTotal(response.totalElements);
      setServerPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }

  const modeLabel = mode === "shop" ? "샵" : mode === "rental" ? "렌탈" : "입찰";
  const modePath = mode === "shop" ? "/shop" : mode === "rental" ? "/rental" : "/auction";
  const resultText = mode === "shop" ? "총" : mode === "rental" ? "렌탈 총" : "입찰 총";
  const emptyMessage =
    mode === "shop" ? "해당 조건의 상품이 없습니다." : mode === "rental" ? "해당 조건의 렌탈 상품이 없습니다." : "해당 조건의 입찰 상품이 없습니다.";

  function priceText(item: ShopItemResponse) {
    return mode === "rental"
      ? `${(item.rentalPrice ?? 0).toLocaleString()}원/일`
      : `${item.retailPrice.toLocaleString()}원`;
  }

  return {
    searchParams,
    modeLabel,
    modePath,
    resultText,
    emptyMessage,
    keyword,
    brand,
    sortOptions: SORT_OPTIONS,
    loading,
    loadingMore,
    hasMore,
    mappingLoading,
    products,
    accumulatedItems,
    serverTotal,
    categories,
    currentCategory,
    currentParent,
    parentCategories,
    childCategories,
    displayFilterGroups,
    displayTags,
    inlineFilterGroups,
    popupFilterGroups,
    selectedFilterIds,
    selectedTagIds,
    sortBy,
    minPriceInput,
    maxPriceInput,
    hasPriceFilter,
    gridCols,
    brandInput,
    activeChips,
    openPopup,
    popupTempIds,
    popupPreviewCount,
    openBrandPopup,
    attrPopupOpen,
    priceText,
    setSortBy,
    setGridCols,
    setBrandInput,
    setMinPriceInput,
    setMaxPriceInput,
    setPopupTempIds,
    setOpenPopup,
    setSearchParams,
    setOpenBrandPopup,
    setAttrPopupOpen,
    clearKeyword,
    loadMore,
    updateCategory,
    handleSelectParent,
    handleSelectSub,
    toggleInlineFilter,
    openFilterPopup,
    openTagPopup,
    openAttrPopup,
    confirmAttrPopup,
    handleBrandSelect,
    togglePopupOption,
    selectAllPopupOptions,
    confirmPopup,
    clearAllFilters,
    applyPriceFilter,
    clearPriceFilter,
    removeActiveChip,
    handleBrandSearch,
    handleBrandClear,
    groupSelectedCount: (group: CategoryDisplayFilterGroup) =>
      group.filters.filter((filter) => selectedFilterIds.includes(filter.id)).length,
  };
}
