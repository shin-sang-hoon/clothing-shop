import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiBulkCrawlAdminItemImages,
  apiCrawlAllAdminItemThumbnails,
  apiGetBulkCrawlAdminItemImagesJob,
  apiBulkDeleteAdminItems,
  apiDeleteAdminItem,
  apiListAdminItems,
  type AdminItemResponse,
} from "@/shared/api/adminApi";
import { useModalStore } from "@/shared/store/modalStore";
import type { ProductKind, ProductStatus } from "@/pages/admin/mock/adminMockData";
import { apiGetCategories, apiGetCategoryFilterGroups } from "@/shared/api/categoryApi";
import type { CategoryFilterGroupResponse, PublicCategoryItem } from "@/shared/api/categoryApi";

const DEFAULT_PAGE_SIZE = 10;

export const PRODUCT_KIND_OPTIONS: ProductKind[] = ["신발", "의류", "액세서리"];
export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = [
  "판매중" as ProductStatus,
  "임시" as ProductStatus,
  "비노출" as ProductStatus,
];

type FetchOverrides = {
  categoryId?: number;
  tagId?: number;
  hasFilter?: boolean;
  hasTag?: boolean;
  size?: number;
  clearCategoryId?: boolean;
  clearTagId?: boolean;
};

export function useProductListPage() {
  const navigate = useNavigate();
  const { openConfirm, openAlert } = useModalStore();

  const [items, setItems] = useState<AdminItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [itemModeFilter, setItemModeFilter] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasFilter, setHasFilter] = useState(false);
  const [hasTag, setHasTag] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isCrawlingImages, setIsCrawlingImages] = useState(false);
  const [isCrawlingAllThumbnails, setIsCrawlingAllThumbnails] = useState(false);

  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [filterGroups, setFilterGroups] = useState<CategoryFilterGroupResponse[]>([]);
  const [filterGroupId, setFilterGroupId] = useState<number | "">("");
  const [tagId, setTagId] = useState<number | "">("");

  useEffect(() => {
    apiGetCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setFilterGroups([]);
      setFilterGroupId("");
      setTagId("");
      return;
    }

    apiGetCategoryFilterGroups(categoryId as number)
      .then(setFilterGroups)
      .catch(() => setFilterGroups([]));

    setFilterGroupId("");
    setTagId("");
  }, [categoryId]);

  useEffect(() => {
    setTagId("");
  }, [filterGroupId]);

  async function fetchItems(nextPage = page, overrides: FetchOverrides = {}) {
    setLoading(true);

    try {
      const resolvedCategoryId = overrides.clearCategoryId
        ? undefined
        : overrides.categoryId !== undefined
          ? overrides.categoryId
          : categoryId || undefined;

      const resolvedTagId = overrides.clearTagId || overrides.clearCategoryId
        ? undefined
        : overrides.tagId !== undefined
          ? overrides.tagId
          : tagId || undefined;

      const resolvedSize = overrides.size ?? size;

      const response = await apiListAdminItems({
        page: nextPage,
        size: resolvedSize,
        keyword,
        kind: kindFilter,
        status: statusFilter,
        categoryId: resolvedCategoryId,
        tagId: resolvedTagId,
        hasFilter: overrides.hasFilter !== undefined ? overrides.hasFilter : hasFilter ? true : undefined,
        hasTag: overrides.hasTag !== undefined ? overrides.hasTag : hasTag ? true : undefined,
        itemMode: itemModeFilter || undefined,
      });

      setItems(response.content);
      setTotal(response.totalElements);
      setTotalPages(Math.max(1, response.totalPages));
      setSelectedIds(new Set());

      if (nextPage > 0 && response.content.length === 0 && response.totalElements > 0) {
        setPage(nextPage - 1);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearch() {
    setPage(0);
    fetchItems(0);
  }

  function toggleHasFilter() {
    const next = !hasFilter;
    setHasFilter(next);
    setPage(0);
    fetchItems(0, { hasFilter: next });
  }

  function toggleHasTag() {
    const next = !hasTag;
    setHasTag(next);
    setPage(0);
    fetchItems(0, { hasTag: next });
  }

  function handleCategoryChange(value: number | "") {
    setCategoryId(value);
    setFilterGroupId("");
    setTagId("");
    setPage(0);
    setSelectedIds(new Set());

    if (value) {
      fetchItems(0, { categoryId: value as number, clearTagId: true });
    } else {
      fetchItems(0, { clearCategoryId: true });
    }
  }

  function handleTagChange(value: number | "") {
    setTagId(value);
    setPage(0);
    setSelectedIds(new Set());

    if (value) {
      fetchItems(0, { tagId: value as number });
    } else {
      fetchItems(0, { clearTagId: true });
    }
  }

  async function handleReset() {
    setKeyword("");
    setKindFilter("");
    setStatusFilter("");
    setItemModeFilter("");
    setCategoryId("");
    setFilterGroupId("");
    setTagId("");
    setHasFilter(false);
    setHasTag(false);
    setSelectedIds(new Set());
    setPage(0);

    setLoading(true);
    try {
      const response = await apiListAdminItems({
        page: 0,
        size,
      });
      setItems(response.content);
      setTotal(response.totalElements);
      setTotalPages(Math.max(1, response.totalPages));
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: number) {
    openConfirm("warning", "상품 삭제", "상품을 삭제하시겠습니까?", async () => {
      try {
        await apiDeleteAdminItem(id);
        await fetchItems(page);
      } catch {
        openAlert("error", "오류", "상품 삭제에 실패했습니다.");
      }
    });
  }

  function setPageSize(nextSize: number) {
    const normalized = nextSize > 0 ? nextSize : DEFAULT_PAGE_SIZE;
    setSize(normalized);
    setPage(0);
    fetchItems(0, { size: normalized });
  }

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(items.map((item) => item.id)));
  }

  function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      openAlert("error", "선택 없음", "삭제할 상품을 선택해주세요.");
      return;
    }

    openConfirm("warning", "선택 삭제", `${ids.length}개 상품을 삭제하시겠습니까?`, async () => {
      try {
        await apiBulkDeleteAdminItems(ids);
        openAlert("success", "삭제 완료", `${ids.length}개 상품을 삭제했습니다.`, "확인", () =>
          fetchItems(page),
        );
      } catch {
        openAlert("error", "오류", "선택 삭제에 실패했습니다.");
      }
    });
  }

  function crawlSelectedImages() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      openAlert("error", "선택 없음", "이미지를 가져올 상품을 선택해주세요.");
      return;
    }

    openConfirm("warning", "선택이미지 가져오기", `${ids.length}개 상품 이미지 재크롤링을 진행할까요?`, async () => {
      try {
        setIsCrawlingImages(true);
        const started = await apiBulkCrawlAdminItemImages(ids);
        openAlert("success", "실행됨", "아이템 이미지를 가져옵니다. 작업 완료 후 결과를 알려드립니다.");
        void pollBulkImageCrawlJob(started.jobId);
      } catch {
        setIsCrawlingImages(false);
        openAlert("error", "오류", "선택이미지 가져오기에 실패했습니다.");
      }
    });
  }

  async function pollBulkImageCrawlJob(jobId: string) {
    const maxAttempts = 240; // up to ~8 minutes
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const status = await apiGetBulkCrawlAdminItemImagesJob(jobId);
        if (status.status === "RUNNING") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        setIsCrawlingImages(false);

        if (status.status === "SUCCESS") {
          const result = (status.result ?? {}) as {
            requested?: number;
            refreshed?: number;
            failed?: number;
          };
          openAlert(
            "success",
            "이미지 가져오기 완료",
            `요청 ${result.requested ?? 0}건 / 성공 ${result.refreshed ?? 0}건 / 실패 ${result.failed ?? 0}건`,
            "확인",
            () => fetchItems(page),
          );
        } else {
          openAlert("error", "작업 실패", status.message || "선택이미지 가져오기에 실패했습니다.");
        }
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsCrawlingImages(false);
    openAlert("error", "시간 초과", "이미지 가져오기 작업 상태를 확인하지 못했습니다.");
  }

  function crawlAllThumbnails() {
    openConfirm("warning", "전체 썸네일 가져오기", "전체 아이템의 썸네일 이미지를 가져옵니다. 진행할까요?", async () => {
      try {
        setIsCrawlingAllThumbnails(true);
        const started = await apiCrawlAllAdminItemThumbnails();
        openAlert("success", "실행됨", "전체 아이템의 썸네일 이미지를 가져옵니다. 완료 후 결과를 알려드립니다.");
        void pollAllThumbnailCrawlJob(started.jobId);
      } catch {
        setIsCrawlingAllThumbnails(false);
        openAlert("error", "오류", "전체 썸네일 가져오기에 실패했습니다.");
      }
    });
  }

  async function pollAllThumbnailCrawlJob(jobId: string) {
    const maxAttempts = 600; // up to ~20 minutes
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const status = await apiGetBulkCrawlAdminItemImagesJob(jobId);
        if (status.status === "RUNNING") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        setIsCrawlingAllThumbnails(false);

        if (status.status === "SUCCESS") {
          const result = (status.result ?? {}) as {
            requested?: number;
            refreshed?: number;
            failed?: number;
          };
          openAlert(
            "success",
            "전체 썸네일 가져오기 완료",
            `요청 ${result.requested ?? 0}건 / 성공 ${result.refreshed ?? 0}건 / 실패 ${result.failed ?? 0}건`,
            "확인",
            () => fetchItems(page),
          );
        } else {
          openAlert("error", "작업 실패", status.message || "전체 썸네일 가져오기에 실패했습니다.");
        }
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsCrawlingAllThumbnails(false);
    openAlert("error", "시간 초과", "전체 썸네일 가져오기 작업 상태를 확인하지 못했습니다.");
  }

  function goToRegister() {
    navigate("/admin/products/register");
  }

  function goToEdit(id: number) {
    navigate(`/admin/products/edit/${id}`);
  }

  function statusClass(status: string) {
    if (status === "판매중") return "statusOn";
    if (status === "임시") return "statusOff";
    return "statusHidden";
  }

  function kindBadgeClass(kind: string) {
    if (kind === "신발") return "kindShoes";
    if (kind === "의류") return "kindClothes";
    return "kindAcc";
  }

  const selectedFilterGroup = filterGroups.find((group) => group.filterGroupId === filterGroupId);

  return {
    items,
    total,
    totalPages,
    loading,
    keyword,
    kindFilter,
    statusFilter,
    itemModeFilter,
    page,
    size,
    setPageSize,

    setKeyword,
    setKindFilter,
    setStatusFilter,
    setItemModeFilter,
    setPage,

    handleSearch,
    handleReset,
    handleDelete,

    hasFilter,
    hasTag,
    toggleHasFilter,
    toggleHasTag,

    selectedIds,
    isCrawlingImages,
    isCrawlingAllThumbnails,
    toggleSelect,
    toggleSelectAll,
    deleteSelected,
    crawlSelectedImages,
    crawlAllThumbnails,

    goToRegister,
    goToEdit,

    statusClass,
    kindBadgeClass,

    categories,
    categoryId,
    setCategoryId: handleCategoryChange,

    filterGroups,
    filterGroupId,
    setFilterGroupId,

    tagId,
    setTagId: handleTagChange,

    selectedFilterGroup,
  };
}
