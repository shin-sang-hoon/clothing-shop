import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminPagination from "@/components/admin/common/AdminPagination";
import FilterFormModal from "@/components/admin/filter/FilterFormModal";
import FilterSearchSection from "@/components/admin/filter/FilterSearchSection";
import FilterTableSection from "@/components/admin/filter/FilterTableSection";
import type {
  FilterFormValue,
  FilterRowEditValue,
  FilterSearchForm,
} from "@/components/admin/filter/types";
import {
  apiCreateAdminFilter,
  apiDeleteAdminFilter,
  apiGetAdminFilters,
  apiUpdateAdminFilter,
  apiUpdateAdminFilterUse,
  type AdminFilterCreateRequest,
  type AdminFilterRow,
} from "@/shared/api/admin/filterApi";
import {
  apiGetAdminFilterGroups,
  type AdminFilterGroupRow,
} from "@/shared/api/admin/filterGroupApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

export default function FilterManagePage() {
  const [searchParams] = useSearchParams();
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const requestedFilterGroupId = Number(searchParams.get("filterGroupId") ?? "");
  const initialFilterGroupId =
    Number.isFinite(requestedFilterGroupId) && requestedFilterGroupId > 0
      ? requestedFilterGroupId
      : "";

  const [filters, setFilters] = useState<AdminFilterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterGroups, setFilterGroups] = useState<AdminFilterGroupRow[]>([]);

  const [filterGroupIdFilter, setFilterGroupIdFilter] = useState<number | "">(
    initialFilterGroupId,
  );
  const [keyword, setKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");
  const [appliedSearch, setAppliedSearch] = useState<FilterSearchForm>({
    filterGroupIdFilter: initialFilterGroupId,
    keyword: "",
    useYnFilter: "",
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  const [rowEdits, setRowEdits] = useState<Record<number, FilterRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminFilterRow | null>(null);
  const [form, setForm] = useState<FilterFormValue>({
    filterGroupId: 0,
    name: "",
    code: "",
    sortOrder: 0,
    useYn: true,
    colorHex: "",
    iconImageUrl: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  function applyFilterList(nextFilters: AdminFilterRow[]) {
    setFilters(nextFilters);

    const nextRowEdits: Record<number, FilterRowEditValue> = {};
    nextFilters.forEach((filter) => {
      nextRowEdits[filter.id] = {
        name: filter.name,
        sortOrder: filter.sortOrder,
        useYn: filter.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
  }

  async function loadFilterGroups() {
    try {
      const response = await apiGetAdminFilterGroups({
        page: 0,
        size: 100,
        keyword: "",
        multiSelectYn: "",
        useYn: "",
      });
      setFilterGroups(response.content);
    } catch (error) {
      console.error("필터 그룹 옵션 조회 실패:", error);
    }
  }

  async function loadFilters(
    targetPage: number,
    targetSize: number,
    search: FilterSearchForm,
  ) {
    try {
      setIsLoading(true);
      const response = await apiGetAdminFilters({
        page: targetPage,
        size: targetSize,
        filterGroupId: search.filterGroupIdFilter,
        keyword: search.keyword,
        useYn: search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });

      applyFilterList(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } catch (error) {
      console.error("필터 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "필터 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadFilterGroups();
  }, []);

  useEffect(() => {
    const nextRequestedFilterGroupId = Number(searchParams.get("filterGroupId") ?? "");
    const nextFilterGroupId =
      Number.isFinite(nextRequestedFilterGroupId) && nextRequestedFilterGroupId > 0
        ? nextRequestedFilterGroupId
        : "";

    const nextSearch: FilterSearchForm = {
      filterGroupIdFilter: nextFilterGroupId,
      keyword: "",
      useYnFilter: "",
    };

    setFilterGroupIdFilter(nextFilterGroupId);
    setKeyword("");
    setUseYnFilter("");
    setAppliedSearch(nextSearch);
    void loadFilters(0, size, nextSearch);
  }, [searchParams]);

  function handleSearch() {
    const nextSearch: FilterSearchForm = {
      filterGroupIdFilter,
      keyword,
      useYnFilter,
    };
    setAppliedSearch(nextSearch);
    void loadFilters(0, size, nextSearch);
  }

  function handleReset() {
    const nextSearch: FilterSearchForm = {
      filterGroupIdFilter: "",
      keyword: "",
      useYnFilter: "",
    };
    setFilterGroupIdFilter("");
    setKeyword("");
    setUseYnFilter("");
    setAppliedSearch(nextSearch);
    void loadFilters(0, size, nextSearch);
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) return;
    void loadFilters(nextPage, size, appliedSearch);
  }

  function handleChangePageSize(nextSize: number) {
    setSize(nextSize);
    void loadFilters(0, nextSize, appliedSearch);
  }

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedItem(null);
    setForm({
      filterGroupId: 0,
      name: "",
      code: "",
      sortOrder: 0,
      useYn: true,
      colorHex: "",
      iconImageUrl: "",
      description: "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(filter: AdminFilterRow) {
    setModalMode("detail");
    setSelectedItem(filter);
    setForm({
      filterGroupId: filter.filterGroupId,
      name: filter.name,
      code: filter.code,
      sortOrder: filter.sortOrder,
      useYn: filter.useYn,
      colorHex: filter.colorHex ?? "",
      iconImageUrl: filter.iconImageUrl ?? "",
      description: filter.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof FilterFormValue>(
    key: Key,
    value: FilterFormValue[Key],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRowChange<Key extends keyof FilterRowEditValue>(
    filterId: number,
    key: Key,
    value: FilterRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [filterId]: {
        ...prev[filterId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(filterId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(filterId) ? prev : [...prev, filterId];
      }
      return prev.filter((id) => id !== filterId);
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? filters.map((filter) => filter.id) : []);
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 필터를 선택해 주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);
      const selectedFilters = filters.filter((filter) => selectedIds.includes(filter.id));

      for (const filter of selectedFilters) {
        const row = rowEdits[filter.id];
        if (!row || !row.name.trim()) {
          throw new Error("필터명을 입력해 주세요.");
        }

        await apiUpdateAdminFilter(filter.id, {
          filterGroupId: filter.filterGroupId,
          name: row.name.trim(),
          code: filter.code,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          colorHex: filter.colorHex ?? null,
          iconImageUrl: filter.iconImageUrl ?? null,
          description: filter.description ?? null,
        });
      }

      await loadFilters(page, size, appliedSearch);
      openAlert("success", "수정 완료", "선택한 필터 정보를 수정했습니다.");
    } catch (error) {
      console.error("필터 선택 수정 실패:", error);
      openAlert("error", "수정 실패", "필터 선택 수정에 실패했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(filter: AdminFilterRow) {
    const row = rowEdits[filter.id];
    if (!row || !row.name.trim()) {
      openAlert("warning", "입력 필요", "필터명을 입력해 주세요.");
      return;
    }

    try {
      setSavingRowId(filter.id);
      await apiUpdateAdminFilter(filter.id, {
        filterGroupId: filter.filterGroupId,
        name: row.name.trim(),
        code: filter.code,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        colorHex: filter.colorHex ?? null,
        iconImageUrl: filter.iconImageUrl ?? null,
        description: filter.description ?? null,
      });
      await loadFilters(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 빠른 저장 실패:", error);
      openAlert("error", "저장 실패", "필터 저장에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  }

  function handleDelete(filter: AdminFilterRow) {
    openConfirm(
      "warning",
      "필터 삭제",
      `"${filter.name}" 필터를 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminFilter(filter.id);
            await loadFilters(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `"${filter.name}" 필터를 삭제했습니다.`);
          } catch (error) {
            console.error("필터 삭제 실패:", error);
            openAlert("error", "삭제 실패", "필터 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 필터를 선택해 주세요.");
      return;
    }

    openConfirm(
      "warning",
      "선택 삭제",
      `선택한 필터 ${selectedIds.length}건을 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            for (const id of selectedIds) {
              await apiDeleteAdminFilter(id);
            }
            await loadFilters(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `${selectedIds.length}건의 필터를 삭제했습니다.`);
          } catch (error) {
            console.error("필터 선택 삭제 실패:", error);
            openAlert("error", "삭제 실패", "필터 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  async function handleQuickToggleUse(filter: AdminFilterRow, checked: boolean) {
    try {
      setRowEdits((prev) => ({
        ...prev,
        [filter.id]: {
          ...prev[filter.id],
          useYn: checked,
        },
      }));

      await apiUpdateAdminFilterUse(filter.id, { useYn: checked });
      await loadFilters(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 사용 여부 변경 실패:", error);
      openAlert("error", "변경 실패", "필터 사용 여부 변경에 실패했습니다.");
    }
  }

  async function handleSaveForm() {
    if (form.filterGroupId <= 0) {
      setFormError("필터 그룹을 선택해 주세요.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("필터명을 입력해 주세요.");
      return;
    }
    if (!form.code.trim()) {
      setFormError("필터 코드를 입력해 주세요.");
      return;
    }

    try {
      const payload: AdminFilterCreateRequest = {
        filterGroupId: form.filterGroupId,
        name: form.name.trim(),
        code: form.code.trim(),
        sortOrder: Number(form.sortOrder ?? 0),
        useYn: form.useYn,
        colorHex: form.colorHex.trim() || null,
        iconImageUrl: form.iconImageUrl.trim() || null,
        description: form.description.trim() || null,
      };

      if (modalMode === "create") {
        await apiCreateAdminFilter(payload);
        openAlert("success", "등록 완료", "필터를 등록했습니다.");
      } else if (selectedItem) {
        await apiUpdateAdminFilter(selectedItem.id, payload);
        openAlert("success", "수정 완료", "필터를 수정했습니다.");
      }

      handleCloseForm();
      await loadFilters(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 저장 실패:", error);
      setFormError("필터 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className={styles.page}>
      <FilterFormModal
        visible={showForm}
        mode={modalMode}
        form={form}
        formError={formError}
        filterGroups={filterGroups}
        onClose={handleCloseForm}
        onChange={handleFormChange}
        onSave={() => void handleSaveForm()}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>필터 관리</h1>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.deleteButton} onClick={handleDeleteSelected}>
            선택삭제
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleBatchSave()}
            disabled={isBatchSaving}
          >
            {isBatchSaving ? "수정 중..." : "선택수정"}
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleOpenCreate}>
            + 필터 등록
          </button>
        </div>
      </div>

      <FilterSearchSection
        filterGroups={filterGroups}
        filterGroupIdFilter={filterGroupIdFilter}
        keyword={keyword}
        useYnFilter={useYnFilter}
        onChangeFilterGroupIdFilter={setFilterGroupIdFilter}
        onChangeKeyword={setKeyword}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <FilterTableSection
        filters={filters}
        rowEdits={rowEdits}
        selectedIds={selectedIds}
        isLoading={isLoading}
        savingRowId={savingRowId}
        size={size}
        onChangePageSize={handleChangePageSize}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickToggleUse={(filter, checked) => {
          void handleQuickToggleUse(filter, checked);
        }}
        onQuickSave={(filter) => {
          void handleQuickSave(filter);
        }}
        onOpenDetail={handleOpenDetail}
        onDelete={handleDelete}
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
