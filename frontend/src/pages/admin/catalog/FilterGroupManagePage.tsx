import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPagination from "@/components/admin/common/AdminPagination";
import FilterGroupFormModal from "@/components/admin/filterGroup/FilterGroupFormModal";
import FilterGroupSearchSection from "@/components/admin/filterGroup/FilterGroupSearchSection";
import FilterGroupTableSection from "@/components/admin/filterGroup/FilterGroupTableSection";
import type {
  FilterGroupFormValue,
  FilterGroupRowEditValue,
  FilterGroupSearchForm,
} from "@/components/admin/filterGroup/types";
import {
  apiCreateAdminFilterGroup,
  apiDeleteAdminFilterGroup,
  apiGetAdminFilterGroups,
  apiUpdateAdminFilterGroup,
  apiUpdateAdminFilterGroupUse,
  type AdminFilterGroupCreateRequest,
  type AdminFilterGroupRow,
} from "@/shared/api/admin/filterGroupApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

const INITIAL_SEARCH: FilterGroupSearchForm = {
  keyword: "",
  multiSelectYnFilter: "",
  useYnFilter: "",
};

const INITIAL_FORM: FilterGroupFormValue = {
  name: "",
  code: "",
  multiSelectYn: true,
  role: "ALL",
  sortOrder: 0,
  useYn: true,
  description: "",
};

export default function FilterGroupManagePage() {
  const navigate = useNavigate();
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const [filterGroups, setFilterGroups] = useState<AdminFilterGroupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [multiSelectYnFilter, setMultiSelectYnFilter] = useState<"" | "true" | "false">("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");
  const [appliedSearch, setAppliedSearch] = useState<FilterGroupSearchForm>(INITIAL_SEARCH);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  const [rowEdits, setRowEdits] = useState<Record<number, FilterGroupRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminFilterGroupRow | null>(null);
  const [form, setForm] = useState<FilterGroupFormValue>(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  function applyFilterGroupList(nextFilterGroups: AdminFilterGroupRow[]) {
    setFilterGroups(nextFilterGroups);

    const nextRowEdits: Record<number, FilterGroupRowEditValue> = {};
    nextFilterGroups.forEach((filterGroup) => {
      nextRowEdits[filterGroup.id] = {
        name: filterGroup.name,
        multiSelectYn: filterGroup.multiSelectYn,
        role: filterGroup.role,
        sortOrder: filterGroup.sortOrder,
        useYn: filterGroup.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
  }

  async function loadFilterGroups(
    targetPage: number,
    targetSize: number,
    search: FilterGroupSearchForm,
  ) {
    try {
      setIsLoading(true);
      const response = await apiGetAdminFilterGroups({
        page: targetPage,
        size: targetSize,
        keyword: search.keyword,
        multiSelectYn: search.multiSelectYnFilter === "" ? "" : search.multiSelectYnFilter === "true",
        useYn: search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });

      applyFilterGroupList(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } catch (error) {
      console.error("필터 그룹 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "필터 그룹 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadFilterGroups(0, size, appliedSearch);
  }, []);

  function handleSearch() {
    const nextSearch = { keyword, multiSelectYnFilter, useYnFilter };
    setAppliedSearch(nextSearch);
    void loadFilterGroups(0, size, nextSearch);
  }

  function handleReset() {
    setKeyword("");
    setMultiSelectYnFilter("");
    setUseYnFilter("");
    setAppliedSearch(INITIAL_SEARCH);
    void loadFilterGroups(0, size, INITIAL_SEARCH);
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) return;
    void loadFilterGroups(nextPage, size, appliedSearch);
  }

  function handleChangePageSize(nextSize: number) {
    setSize(nextSize);
    void loadFilterGroups(0, nextSize, appliedSearch);
  }

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(filterGroup: AdminFilterGroupRow) {
    setModalMode("detail");
    setSelectedItem(filterGroup);
    setForm({
      name: filterGroup.name,
      code: filterGroup.code,
      multiSelectYn: filterGroup.multiSelectYn,
      role: filterGroup.role,
      sortOrder: filterGroup.sortOrder,
      useYn: filterGroup.useYn,
      description: filterGroup.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof FilterGroupFormValue>(
    key: Key,
    value: FilterGroupFormValue[Key],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRowChange<Key extends keyof FilterGroupRowEditValue>(
    filterGroupId: number,
    key: Key,
    value: FilterGroupRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [filterGroupId]: {
        ...prev[filterGroupId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(filterGroupId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(filterGroupId) ? prev : [...prev, filterGroupId];
      }
      return prev.filter((id) => id !== filterGroupId);
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? filterGroups.map((filterGroup) => filterGroup.id) : []);
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 필터 그룹을 선택해 주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);
      for (const filterGroup of filterGroups.filter((entry) => selectedIds.includes(entry.id))) {
        const row = rowEdits[filterGroup.id];
        if (!row || !row.name.trim()) {
          throw new Error("필터 그룹명을 입력해 주세요.");
        }

        await apiUpdateAdminFilterGroup(filterGroup.id, {
          name: row.name.trim(),
          code: filterGroup.code,
          multiSelectYn: row.multiSelectYn,
          role: row.role,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          description: filterGroup.description ?? null,
        });
      }

      await loadFilterGroups(page, size, appliedSearch);
      openAlert("success", "수정 완료", "선택한 필터 그룹 정보를 수정했습니다.");
    } catch (error) {
      console.error("필터 그룹 선택 수정 실패:", error);
      openAlert("error", "수정 실패", "필터 그룹 선택 수정에 실패했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(filterGroup: AdminFilterGroupRow) {
    const row = rowEdits[filterGroup.id];
    if (!row || !row.name.trim()) {
      openAlert("warning", "입력 필요", "필터 그룹명을 입력해 주세요.");
      return;
    }

    try {
      setSavingRowId(filterGroup.id);
      await apiUpdateAdminFilterGroup(filterGroup.id, {
        name: row.name.trim(),
        code: filterGroup.code,
        multiSelectYn: row.multiSelectYn,
        role: row.role,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        description: filterGroup.description ?? null,
      });

      await loadFilterGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 그룹 빠른 저장 실패:", error);
      openAlert("error", "저장 실패", "필터 그룹 저장에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  }

  function handleDelete(filterGroup: AdminFilterGroupRow) {
    openConfirm(
      "warning",
      "필터 그룹 삭제",
      `"${filterGroup.name}" 필터 그룹을 삭제하시겠습니까?\n하위 필터와 연결 데이터도 함께 정리됩니다.`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminFilterGroup(filterGroup.id);
            await loadFilterGroups(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `"${filterGroup.name}" 필터 그룹을 삭제했습니다.`);
          } catch (error) {
            console.error("필터 그룹 삭제 실패:", error);
            openAlert("error", "삭제 실패", "필터 그룹 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 필터 그룹을 선택해 주세요.");
      return;
    }

    openConfirm(
      "warning",
      "선택 삭제",
      `선택한 필터 그룹 ${selectedIds.length}건을 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            for (const id of selectedIds) {
              await apiDeleteAdminFilterGroup(id);
            }
            await loadFilterGroups(page, size, appliedSearch);
            openAlert(
              "success",
              "삭제 완료",
              `${selectedIds.length}건의 필터 그룹을 삭제했습니다.`,
            );
          } catch (error) {
            console.error("필터 그룹 선택 삭제 실패:", error);
            openAlert("error", "삭제 실패", "필터 그룹 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  async function handleQuickToggleUse(filterGroup: AdminFilterGroupRow, checked: boolean) {
    try {
      setRowEdits((prev) => ({
        ...prev,
        [filterGroup.id]: {
          ...prev[filterGroup.id],
          useYn: checked,
        },
      }));

      await apiUpdateAdminFilterGroupUse(filterGroup.id, { useYn: checked });
      await loadFilterGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 그룹 사용 여부 변경 실패:", error);
      openAlert("error", "변경 실패", "필터 그룹 사용 여부 변경에 실패했습니다.");
    }
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      setFormError("필터 그룹명을 입력해 주세요.");
      return;
    }
    if (!form.code.trim()) {
      setFormError("필터 그룹 코드를 입력해 주세요.");
      return;
    }

    try {
      const payload: AdminFilterGroupCreateRequest = {
        name: form.name.trim(),
        code: form.code.trim(),
        multiSelectYn: form.multiSelectYn,
        role: form.role,
        sortOrder: Number(form.sortOrder ?? 0),
        useYn: form.useYn,
        description: form.description.trim() || null,
      };

      if (modalMode === "create") {
        await apiCreateAdminFilterGroup(payload);
        openAlert("success", "등록 완료", "필터 그룹을 등록했습니다.");
      } else if (selectedItem) {
        await apiUpdateAdminFilterGroup(selectedItem.id, payload);
        openAlert("success", "수정 완료", "필터 그룹을 수정했습니다.");
      }

      handleCloseForm();
      await loadFilterGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("필터 그룹 저장 실패:", error);
      setFormError("필터 그룹 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className={styles.page}>
      <FilterGroupFormModal
        visible={showForm}
        mode={modalMode}
        form={form}
        formError={formError}
        onClose={handleCloseForm}
        onChange={handleFormChange}
        onSave={() => void handleSaveForm()}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>필터 그룹 관리</h1>
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
            + 필터 그룹 등록
          </button>
        </div>
      </div>

      <FilterGroupSearchSection
        keyword={keyword}
        multiSelectYnFilter={multiSelectYnFilter}
        useYnFilter={useYnFilter}
        onChangeKeyword={setKeyword}
        onChangeMultiSelectYnFilter={setMultiSelectYnFilter}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <FilterGroupTableSection
        filterGroups={filterGroups}
        rowEdits={rowEdits}
        selectedIds={selectedIds}
        isLoading={isLoading}
        savingRowId={savingRowId}
        size={size}
        onChangePageSize={handleChangePageSize}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickToggleUse={(filterGroup, checked) => {
          void handleQuickToggleUse(filterGroup, checked);
        }}
        onQuickSave={(filterGroup) => {
          void handleQuickSave(filterGroup);
        }}
        onOpenDetail={handleOpenDetail}
        onMoveFilters={(filterGroup) => {
          navigate(`/admin/filters?filterGroupId=${filterGroup.id}`);
        }}
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
