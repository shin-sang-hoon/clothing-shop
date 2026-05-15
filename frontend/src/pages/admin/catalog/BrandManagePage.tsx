import { useEffect, useState } from "react";
import CatalogImportButton from "@/components/admin/catalog/CatalogImportButton";
import BrandFormModal from "@/components/admin/brand/BrandFormModal";
import BrandSearchSection from "@/components/admin/brand/BrandSearchSection";
import BrandTableSection from "@/components/admin/brand/BrandTableSection";
import type {
  BrandFormValue,
  BrandRowEditValue,
  BrandSearchForm,
} from "@/components/admin/brand/types";
import AdminPagination from "@/components/admin/common/AdminPagination";
import {
  apiCreateAdminBrand,
  apiDeleteAdminBrand,
  apiDeleteEmptyBrands,
  apiGetAdminBrands,
  apiSeedBrandDummyLikes,
  apiUpdateAdminBrand,
  apiUpdateAdminBrandUse,
  type AdminBrandCreateRequest,
  type AdminBrandRow,
} from "@/shared/api/admin/brandApi";
import {
  apiImportBrands,
  type BrandImportResponse,
} from "@/shared/api/admin/catalogCrawlApi";
import { useCatalogCrawlJobPoller } from "@/shared/hooks/useCatalogCrawlJobPoller";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

export default function BrandManagePage() {
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const { schedulePoll } = useCatalogCrawlJobPoller();

  const [brands, setBrands] = useState<AdminBrandRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [keyword, setKeyword] = useState<string>("");
  const [exclusiveYnFilter, setExclusiveYnFilter] = useState<"" | "true" | "false">("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");

  const [appliedSearch, setAppliedSearch] = useState<BrandSearchForm>({
    keyword: "",
    exclusiveYnFilter: "",
    useYnFilter: "",
  });

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [first, setFirst] = useState<boolean>(true);
  const [last, setLast] = useState<boolean>(true);

  const [rowEdits, setRowEdits] = useState<Record<number, BrandRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminBrandRow | null>(null);

  const [form, setForm] = useState<BrandFormValue>({
    code: "",
    nameKo: "",
    nameEn: "",
    iconImageUrl: "",
    exclusiveYn: false,
    sortOrder: 0,
    useYn: true,
    description: "",
  });
  const [formError, setFormError] = useState<string>("");

  function applyBrandList(nextBrands: AdminBrandRow[]): void {
    setBrands(nextBrands);

    const nextRowEdits: Record<number, BrandRowEditValue> = {};
    nextBrands.forEach((brand) => {
      nextRowEdits[brand.id] = {
        nameKo: brand.nameKo,
        nameEn: brand.nameEn,
        exclusiveYn: brand.exclusiveYn,
        sortOrder: brand.sortOrder,
        useYn: brand.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
  }

  async function loadBrands(
    targetPage: number,
    targetSize: number,
    search: BrandSearchForm,
  ): Promise<void> {
    try {
      setIsLoading(true);

      const response = await apiGetAdminBrands({
        page: targetPage,
        size: targetSize,
        keyword: search.keyword,
        exclusiveYn:
          search.exclusiveYnFilter === ""
            ? ""
            : search.exclusiveYnFilter === "true",
        useYn:
          search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });

      applyBrandList(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } catch (error) {
      console.error("브랜드 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "브랜드 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBrands(0, size, appliedSearch);
  }, []);

  function handleSearch(): void {
    const nextAppliedSearch: BrandSearchForm = {
      keyword,
      exclusiveYnFilter,
      useYnFilter,
    };

    setAppliedSearch(nextAppliedSearch);
    void loadBrands(0, size, nextAppliedSearch);
  }

  function handleReset(): void {
    const resetSearch: BrandSearchForm = {
      keyword: "",
      exclusiveYnFilter: "",
      useYnFilter: "",
    };

    setKeyword("");
    setExclusiveYnFilter("");
    setUseYnFilter("");
    setAppliedSearch(resetSearch);
    void loadBrands(0, size, resetSearch);
  }

  function handleChangePage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }

    void loadBrands(nextPage, size, appliedSearch);
  }

  function handleChangePageSize(nextSize: number): void {
    setSize(nextSize);
    void loadBrands(0, nextSize, appliedSearch);
  }

  function handleOpenCreate(): void {
    setModalMode("create");
    setSelectedItem(null);
    setForm({
      code: "",
      nameKo: "",
      nameEn: "",
      iconImageUrl: "",
      exclusiveYn: false,
      sortOrder: 0,
      useYn: true,
      description: "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(brand: AdminBrandRow): void {
    setModalMode("detail");
    setSelectedItem(brand);
    setForm({
      code: brand.code,
      nameKo: brand.nameKo,
      nameEn: brand.nameEn,
      iconImageUrl: brand.iconImageUrl ?? "",
      exclusiveYn: brand.exclusiveYn,
      sortOrder: brand.sortOrder,
      useYn: brand.useYn,
      description: brand.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm(): void {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof BrandFormValue>(
    key: Key,
    value: BrandFormValue[Key],
  ): void {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleRowChange<Key extends keyof BrandRowEditValue>(
    brandId: number,
    key: Key,
    value: BrandRowEditValue[Key],
  ): void {
    setRowEdits((prev) => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(brandId: number, checked: boolean): void {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(brandId)) {
          return prev;
        }
        return [...prev, brandId];
      }

      return prev.filter((id) => id !== brandId);
    });
  }

  function handleToggleSelectAll(checked: boolean): void {
    if (checked) {
      setSelectedIds(brands.map((brand) => brand.id));
      return;
    }

    setSelectedIds([]);
  }

  async function handleBatchSave(): Promise<void> {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 브랜드를 선택해주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);

      const selectedBrands = brands.filter((brand) => selectedIds.includes(brand.id));

      for (const brand of selectedBrands) {
        const row = rowEdits[brand.id];

        if (!row || !row.nameKo.trim() || !row.nameEn.trim()) {
          throw new Error("브랜드 국문명과 영문명을 입력해주세요.");
        }

        await apiUpdateAdminBrand(brand.id, {
          code: brand.code,
          nameKo: row.nameKo.trim(),
          nameEn: row.nameEn.trim(),
          iconImageUrl: brand.iconImageUrl ?? null,
          exclusiveYn: row.exclusiveYn,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          description: brand.description ?? null,
        });
      }

      await loadBrands(page, size, appliedSearch);
      openAlert("success", "수정 완료", "선택한 브랜드 정보가 수정되었습니다.");
    } catch (error) {
      console.error("브랜드 선택수정 실패:", error);
      openAlert("error", "수정 실패", "브랜드 선택수정에 실패했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(brand: AdminBrandRow): Promise<void> {
    const row = rowEdits[brand.id];

    if (!row || !row.nameKo.trim() || !row.nameEn.trim()) {
      openAlert("warning", "입력 필요", "브랜드 국문명과 영문명을 입력해주세요.");
      return;
    }

    try {
      setSavingRowId(brand.id);

      await apiUpdateAdminBrand(brand.id, {
        code: brand.code,
        nameKo: row.nameKo.trim(),
        nameEn: row.nameEn.trim(),
        iconImageUrl: brand.iconImageUrl ?? null,
        exclusiveYn: row.exclusiveYn,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        description: brand.description ?? null,
      });

      await loadBrands(page, size, appliedSearch);
    } catch (error) {
      console.error("브랜드 빠른저장 실패:", error);
      openAlert("error", "저장 실패", "브랜드 저장에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  }

  async function deleteBrand(brand: AdminBrandRow): Promise<void> {
    try {
      await apiDeleteAdminBrand(brand.id);
      await loadBrands(page, size, appliedSearch);
      openAlert("success", "삭제 완료", `"${brand.nameKo}" 브랜드가 삭제되었습니다.`);
    } catch (error) {
      console.error("브랜드 삭제 실패:", error);
      openAlert("error", "삭제 실패", "브랜드 삭제에 실패했습니다.");
    }
  }

  function handleDelete(brand: AdminBrandRow): void {
    openConfirm(
      "warning",
      "삭제 확인",
      `브랜드 "${brand.nameKo}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      () => {
        void deleteBrand(brand);
      },
      "삭제",
      "취소",
    );
  }

  async function deleteSelectedBrands(ids: number[]): Promise<void> {
    try {
      for (const id of ids) {
        await apiDeleteAdminBrand(id);
      }
      await loadBrands(page, size, appliedSearch);
      openAlert("success", "삭제 완료", `${ids.length}건의 브랜드가 삭제되었습니다.`);
    } catch (error) {
      console.error("브랜드 일괄삭제 실패:", error);
      openAlert("error", "삭제 실패", "브랜드 삭제에 실패했습니다.");
    }
  }

  function handleDeleteSelected(): void {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 브랜드를 선택해주세요.");
      return;
    }

    const ids = [...selectedIds];
    openConfirm(
      "warning",
      "삭제 확인",
      `선택한 브랜드 ${ids.length}건을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      () => {
        void deleteSelectedBrands(ids);
      },
      "삭제",
      "취소",
    );
  }

  async function handleQuickToggleUse(
    brand: AdminBrandRow,
    checked: boolean,
  ): Promise<void> {
    try {
      setRowEdits((prev) => ({
        ...prev,
        [brand.id]: {
          ...prev[brand.id],
          useYn: checked,
        },
      }));

      await apiUpdateAdminBrandUse(brand.id, { useYn: checked });
      await loadBrands(page, size, appliedSearch);
    } catch (error) {
      console.error("브랜드 사용여부 변경 실패:", error);
      openAlert("error", "변경 실패", "브랜드 사용여부 변경에 실패했습니다.");
    }
  }

  async function handleSaveForm(): Promise<void> {
    if (!form.code.trim()) {
      setFormError("브랜드 코드를 입력해주세요.");
      return;
    }

    if (!form.nameKo.trim() || !form.nameEn.trim()) {
      setFormError("브랜드 국문명과 영문명을 입력해주세요.");
      return;
    }

    try {
      const payload: AdminBrandCreateRequest = {
        code: form.code.trim(),
        nameKo: form.nameKo.trim(),
        nameEn: form.nameEn.trim(),
        iconImageUrl: form.iconImageUrl.trim() || null,
        exclusiveYn: form.exclusiveYn,
        sortOrder: Number(form.sortOrder ?? 0),
        useYn: form.useYn,
        description: form.description.trim() || null,
      };

      if (modalMode === "create") {
        await apiCreateAdminBrand(payload);
        openAlert("success", "등록 완료", "브랜드가 등록되었습니다.");
      } else if (selectedItem) {
        await apiUpdateAdminBrand(selectedItem.id, payload);
        openAlert("success", "수정 완료", "브랜드가 수정되었습니다.");
      }

      handleCloseForm();
      await loadBrands(page, size, appliedSearch);
    } catch (error) {
      console.error("브랜드 저장 실패:", error);
      setFormError("브랜드 저장 중 오류가 발생했습니다.");
    }
  }

  function handleDeleteEmptyBrands(): void {
    openConfirm(
      "warning",
      "빈 브랜드 삭제",
      "상품이 없는 브랜드를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.",
      async () => {
        try {
          const res = await apiDeleteEmptyBrands();
          await loadBrands(0, size, appliedSearch);
          openAlert("success", "삭제 완료", `상품 없는 브랜드 ${res.deleted}건이 삭제되었습니다.`);
        } catch {
          openAlert("error", "삭제 실패", "빈 브랜드 삭제에 실패했습니다.");
        }
      },
      "삭제",
      "취소",
    );
  }

  async function handleSeedDummyLikes(): Promise<void> {
    try {
      const res = await apiSeedBrandDummyLikes();
      openAlert("success", "완료", `더미 좋아요 ${res.updated}건 부여 완료`);
    } catch {
      openAlert("error", "실패", "더미 좋아요 부여에 실패했습니다.");
    }
  }

  async function handleImportBrands(): Promise<void> {
    try {
      const response: any = await apiImportBrands();
      openAlert("success", "가져오는 중", "브랜드 크롤링 실행중입니다.");
      openAlert("success", "가져오는 중", "브랜드 크롤링 실행중입니다.");
      openAlert("success", "In Progress", "Brand import is running.");
      schedulePoll<BrandImportResponse>(
        response.jobId,
        async (status) => {
          if (status.status === "SUCCESS" && status.result) {
            const result = status.result;
            openAlert(
              "success",
              "Completed",
              `Job completed.\nTotal: ${result.totalCount}\nImported: ${result.importedCount}\nSkipped: ${result.skippedCount}`,
            );
            await loadBrands(page, size, appliedSearch);
            return;
            openAlert(
              "success",
              "작업 완료",
              `작업이 완료되었습니다.\n전체: ${result.totalCount}건\n신규: ${result.importedCount}건\n중복 건너뜀: ${result.skippedCount}건`,
            );
            await loadBrands(page, size, appliedSearch);
            return;
            openAlert(
              "success",
              "가져오기 완료",
              `브랜드 가져오기 완료\n전체: ${result.totalCount}건\n신규: ${result.importedCount}건\n중복 건너뜀: ${result.skippedCount}건`,
            );
            await loadBrands(page, size, appliedSearch);
            return;
          }
          openAlert("error", "가져오기 실패", status.message || "브랜드 가져오기에 실패했습니다.");
        },
        () => {
          openAlert("error", "상태 조회 실패", "브랜드 크롤링 상태를 조회하지 못했습니다.");
        },
      );
      return;
      /*
      openAlert(
        "success",
        "가져오기 완료",
        `브랜드 가져오기 완료\n전체: ${response.totalCount}건\n신규: ${response.importedCount}건\n중복 건너뜀: ${response.skippedCount}건`,
      );

      await loadBrands(page, size, appliedSearch);
      */
    } catch (error) {
      console.error("브랜드 가져오기 실패:", error);
      openAlert("error", "가져오기 실패", "브랜드 가져오기에 실패했습니다.");
    }
  }

  return (
    <div className={styles.page}>
      <BrandFormModal
        visible={showForm}
        mode={modalMode}
        form={form}
        formError={formError}
        onClose={handleCloseForm}
        onChange={handleFormChange}
        onSave={handleSaveForm}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>브랜드 관리</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => void handleDeleteSelected()}
          >
            선택삭제
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleBatchSave()}
            disabled={isBatchSaving}
          >
            {isBatchSaving ? "수정중..." : "선택수정"}
          </button>

          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteEmptyBrands}
          >
            빈 브랜드 삭제
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleSeedDummyLikes()}
          >
            더미 좋아요 부여
          </button>

          <CatalogImportButton label="브랜드 가져오기" onImport={handleImportBrands} />

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenCreate}
          >
            + 브랜드 등록
          </button>
        </div>
      </div>

      <BrandSearchSection
        keyword={keyword}
        exclusiveYnFilter={exclusiveYnFilter}
        useYnFilter={useYnFilter}
        onChangeKeyword={setKeyword}
        onChangeExclusiveYnFilter={setExclusiveYnFilter}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <BrandTableSection
        brands={brands}
        rowEdits={rowEdits}
        selectedIds={selectedIds}
        isLoading={isLoading}
        savingRowId={savingRowId}
        size={size}
        onChangePageSize={handleChangePageSize}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickToggleUse={(brand, checked) => {
          void handleQuickToggleUse(brand, checked);
        }}
        onQuickSave={(brand) => {
          void handleQuickSave(brand);
        }}
        onOpenDetail={handleOpenDetail}
        onDelete={(brand) => {
          void handleDelete(brand);
        }}
      />

      <AdminPagination
        totalElements={totalElements}
        page={page}
        size={size}
        totalPages={totalPages}
        first={first}
        last={last}
        onChangePage={handleChangePage}
        onChangePageSize={handleChangePageSize}
        className={styles.pagination}
        infoClassName={styles.paginationInfo}
      />
    </div>
  );
}
