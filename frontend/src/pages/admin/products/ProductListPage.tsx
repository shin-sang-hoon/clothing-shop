import { useMemo, useState } from "react";
import styles from "../admin.module.css";
import ProductListFilterBar from "@/components/admin/product/ProductListFilterBar";
import ProductListTable from "@/components/admin/product/ProductListTable";
import ProductListPagination from "@/components/admin/product/ProductListPagination";
import {
  PRODUCT_KIND_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  useProductListPage,
} from "@/components/admin/product/useProductListPage";
import { apiAdminSyncBoutique } from "@/shared/api/itemApi";
import { apiInitRentalStock } from "@/shared/api/adminApi";
import { useModalStore } from "@/shared/store/modalStore";

export default function ProductListPage() {
  const pageState = useProductListPage();
  const [syncing, setSyncing] = useState(false);
  const [initingStock, setInitingStock] = useState(false);
  const { openAlert, openConfirm } = useModalStore();

  const hasSelection = pageState.selectedIds.size > 0;
  const boutiqueCategory = useMemo(
    () => pageState.categories.find((category) => category.name === "부티크"),
    [pageState.categories],
  );

  async function doSyncBoutique(categoryCode: string) {
    setSyncing(true);
    try {
      const result = await apiAdminSyncBoutique(categoryCode);
      openAlert(
        "success",
        "동기화 완료",
        `전체 상품: ${result.totalCount}개\nRENTAL 변경: ${result.modeToRental}개\nAUCTION 변경: ${result.modeToAuction}개`,
        "확인",
        () => pageState.handleSearch(),
      );
    } catch {
      openAlert("error", "오류", "부티크 태그 동기화에 실패했습니다.");
    } finally {
      setSyncing(false);
    }
  }

  async function doInitRentalStock() {
    setInitingStock(true);
    try {
      const result = await apiInitRentalStock();
      openAlert(
        "success",
        "재고 초기화 완료",
        `옵션이 없던 렌탈 상품 ${result.initialized}건에 기본 재고(5개)를 추가했습니다.`,
        "확인",
        () => pageState.handleSearch(),
      );
    } catch {
      openAlert("error", "오류", "렌탈 재고 초기화 중 오류가 발생했습니다.");
    } finally {
      setInitingStock(false);
    }
  }

  function handleInitRentalStock() {
    openConfirm(
      "warning",
      "렌탈 재고 초기화",
      "옵션(색상/재고)이 없는 모든 렌탈 상품에 기본 재고 5개를 추가합니다.\n계속 진행할까요?",
      () => doInitRentalStock(),
    );
  }

  function handleSyncBoutique() {
    if (!boutiqueCategory) {
      openAlert("error", "카테고리 없음", "부티크 카테고리를 찾을 수 없습니다.");
      return;
    }

    openConfirm(
      "warning",
      "부티크 태그 동기화",
      `부티크 카테고리(${boutiqueCategory.code})에 아래 룰을 적용합니다.\n500,000원 이상: RENTAL\n500,000원 미만: AUCTION\n\n진행할까요?`,
      () => doSyncBoutique(boutiqueCategory.code),
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>상품 조회</h1>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={pageState.hasFilter ? styles.btnPrimary : styles.btnSecondary}
            onClick={pageState.toggleHasFilter}
          >
            필터가 있는 아이템
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleInitRentalStock}
            disabled={initingStock}
          >
            {initingStock ? "초기화 중..." : "렌탈 재고 초기화"}
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSyncBoutique}
            disabled={syncing}
          >
            {syncing ? "동기화 중..." : "부티크 태그 동기화"}
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={pageState.crawlSelectedImages}
            disabled={!hasSelection || pageState.isCrawlingImages}
          >
            {pageState.isCrawlingImages ? "이미지 가져오는 중..." : "선택이미지 가져오기"}
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={pageState.crawlAllThumbnails}
            disabled={pageState.isCrawlingAllThumbnails}
          >
            {pageState.isCrawlingAllThumbnails ? "전체 썸네일 가져오는 중..." : "전체 썸네일 가져오기"}
          </button>

          <button type="button" className={styles.btnPrimary} onClick={pageState.goToRegister}>
            + 상품등록
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={pageState.deleteSelected}
            disabled={!hasSelection}
          >
            선택삭제
          </button>
        </div>
      </div>

      <ProductListFilterBar
        keyword={pageState.keyword}
        kindFilter={pageState.kindFilter}
        statusFilter={pageState.statusFilter}
        itemModeFilter={pageState.itemModeFilter}
        kindOptions={PRODUCT_KIND_OPTIONS}
        statusOptions={PRODUCT_STATUS_OPTIONS}
        onKeywordChange={pageState.setKeyword}
        onKindFilterChange={pageState.setKindFilter}
        onStatusFilterChange={pageState.setStatusFilter}
        onItemModeFilterChange={pageState.setItemModeFilter}
        onSearch={pageState.handleSearch}
        onReset={pageState.handleReset}
        categories={pageState.categories}
        categoryId={pageState.categoryId}
        onCategoryChange={pageState.setCategoryId}
        filterGroups={pageState.filterGroups}
        filterGroupId={pageState.filterGroupId}
        onFilterGroupChange={pageState.setFilterGroupId}
        tagId={pageState.tagId}
        onTagChange={pageState.setTagId}
        selectedFilterGroup={pageState.selectedFilterGroup}
      />

      <ProductListTable
        items={pageState.items}
        total={pageState.total}
        loading={pageState.loading}
        onEdit={pageState.goToEdit}
        onDelete={pageState.handleDelete}
        statusClass={pageState.statusClass}
        kindBadgeClass={pageState.kindBadgeClass}
        selectedIds={pageState.selectedIds}
        onToggleSelect={pageState.toggleSelect}
        onToggleSelectAll={pageState.toggleSelectAll}
      />

      <ProductListPagination
        page={pageState.page}
        totalPages={pageState.totalPages}
        total={pageState.total}
        size={pageState.size}
        onChangeSize={pageState.setPageSize}
        onChangePage={pageState.setPage}
      />
    </div>
  );
}
