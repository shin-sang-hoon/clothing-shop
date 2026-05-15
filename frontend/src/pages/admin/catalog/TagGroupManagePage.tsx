import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPagination from "@/components/admin/common/AdminPagination";
import TagGroupFormModal from "@/components/admin/tagGroup/TagGroupFormModal";
import TagGroupSearchSection from "@/components/admin/tagGroup/TagGroupSearchSection";
import TagGroupTableSection from "@/components/admin/tagGroup/TagGroupTableSection";
import type {
  TagGroupFormValue,
  TagGroupRowEditValue,
  TagGroupSearchForm,
} from "@/components/admin/tagGroup/types";
import {
  apiCreateAdminTagGroup,
  apiDeleteAdminTagGroup,
  apiGetAdminTagGroups,
  apiUpdateAdminTagGroup,
  apiUpdateAdminTagGroupUse,
  type AdminTagGroupCreateRequest,
  type AdminTagGroupRow,
} from "@/shared/api/admin/tagGroupApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

const INITIAL_SEARCH: TagGroupSearchForm = {
  keyword: "",
  multiSelectYnFilter: "",
  useYnFilter: "",
};

const INITIAL_FORM: TagGroupFormValue = {
  name: "",
  code: "",
  multiSelectYn: true,
  role: "ALL",
  sortOrder: 0,
  useYn: true,
  description: "",
};

export default function TagGroupManagePage() {
  const navigate = useNavigate();
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const [tagGroups, setTagGroups] = useState<AdminTagGroupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [multiSelectYnFilter, setMultiSelectYnFilter] = useState<"" | "true" | "false">("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");
  const [appliedSearch, setAppliedSearch] = useState<TagGroupSearchForm>(INITIAL_SEARCH);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  const [rowEdits, setRowEdits] = useState<Record<number, TagGroupRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminTagGroupRow | null>(null);
  const [form, setForm] = useState<TagGroupFormValue>(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  function applyTagGroupList(nextTagGroups: AdminTagGroupRow[]) {
    setTagGroups(nextTagGroups);

    const nextRowEdits: Record<number, TagGroupRowEditValue> = {};
    nextTagGroups.forEach((tagGroup) => {
      nextRowEdits[tagGroup.id] = {
        name: tagGroup.name,
        multiSelectYn: tagGroup.multiSelectYn,
        role: tagGroup.role,
        sortOrder: tagGroup.sortOrder,
        useYn: tagGroup.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
  }

  async function loadTagGroups(targetPage: number, targetSize: number, search: TagGroupSearchForm) {
    try {
      setIsLoading(true);
      const response = await apiGetAdminTagGroups({
        page: targetPage,
        size: targetSize,
        keyword: search.keyword,
        multiSelectYn: search.multiSelectYnFilter === "" ? "" : search.multiSelectYnFilter === "true",
        useYn: search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });

      applyTagGroupList(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } catch (error) {
      console.error("태그그룹 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "태그그룹 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTagGroups(0, size, appliedSearch);
  }, []);

  function handleSearch() {
    const nextAppliedSearch = { keyword, multiSelectYnFilter, useYnFilter };
    setAppliedSearch(nextAppliedSearch);
    void loadTagGroups(0, size, nextAppliedSearch);
  }

  function handleReset() {
    setKeyword("");
    setMultiSelectYnFilter("");
    setUseYnFilter("");
    setAppliedSearch(INITIAL_SEARCH);
    void loadTagGroups(0, size, INITIAL_SEARCH);
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }
    void loadTagGroups(nextPage, size, appliedSearch);
  }

  function handleChangePageSize(nextSize: number) {
    setSize(nextSize);
    void loadTagGroups(0, nextSize, appliedSearch);
  }

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(tagGroup: AdminTagGroupRow) {
    setModalMode("detail");
    setSelectedItem(tagGroup);
    setForm({
      name: tagGroup.name,
      code: tagGroup.code,
      multiSelectYn: tagGroup.multiSelectYn,
      role: tagGroup.role,
      sortOrder: tagGroup.sortOrder,
      useYn: tagGroup.useYn,
      description: tagGroup.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof TagGroupFormValue>(key: Key, value: TagGroupFormValue[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRowChange<Key extends keyof TagGroupRowEditValue>(
    tagGroupId: number,
    key: Key,
    value: TagGroupRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [tagGroupId]: {
        ...prev[tagGroupId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(tagGroupId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(tagGroupId) ? prev : [...prev, tagGroupId];
      }
      return prev.filter((id) => id !== tagGroupId);
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? tagGroups.map((tagGroup) => tagGroup.id) : []);
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 태그그룹을 선택해주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);

      for (const tagGroup of tagGroups.filter((entry) => selectedIds.includes(entry.id))) {
        const row = rowEdits[tagGroup.id];
        if (!row || !row.name.trim()) {
          throw new Error("태그그룹명을 입력해주세요.");
        }

        await apiUpdateAdminTagGroup(tagGroup.id, {
          name: row.name.trim(),
          code: tagGroup.code,
          multiSelectYn: row.multiSelectYn,
          role: row.role,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          description: tagGroup.description ?? null,
        });
      }

      await loadTagGroups(page, size, appliedSearch);
      openAlert("success", "수정 완료", "선택한 태그그룹 정보를 수정했습니다.");
    } catch (error) {
      console.error("태그그룹 선택 수정 실패:", error);
      openAlert("error", "수정 실패", "태그그룹 선택 수정에 실패했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(tagGroup: AdminTagGroupRow) {
    const row = rowEdits[tagGroup.id];
    if (!row || !row.name.trim()) {
      openAlert("warning", "입력 필요", "태그그룹명을 입력해주세요.");
      return;
    }

    try {
      setSavingRowId(tagGroup.id);
      await apiUpdateAdminTagGroup(tagGroup.id, {
        name: row.name.trim(),
        code: tagGroup.code,
        multiSelectYn: row.multiSelectYn,
        role: row.role,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        description: tagGroup.description ?? null,
      });

      await loadTagGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("태그그룹 빠른저장 실패:", error);
      openAlert("error", "저장 실패", "태그그룹 저장에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  }

  function handleDelete(tagGroup: AdminTagGroupRow) {
    openConfirm(
      "warning",
      "태그그룹 삭제",
      `"${tagGroup.name}" 태그그룹을 삭제하시겠습니까?\n하위 태그와 연결 데이터도 함께 정리됩니다.`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminTagGroup(tagGroup.id);
            await loadTagGroups(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `"${tagGroup.name}" 태그그룹을 삭제했습니다.`);
          } catch (error) {
            console.error("태그그룹 삭제 실패:", error);
            openAlert("error", "삭제 실패", "태그그룹 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 태그그룹을 선택해주세요.");
      return;
    }

    openConfirm(
      "warning",
      "선택 삭제",
      `선택한 태그그룹 ${selectedIds.length}건을 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            for (const id of selectedIds) {
              await apiDeleteAdminTagGroup(id);
            }
            await loadTagGroups(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `${selectedIds.length}건의 태그그룹을 삭제했습니다.`);
          } catch (error) {
            console.error("태그그룹 선택 삭제 실패:", error);
            openAlert("error", "삭제 실패", "태그그룹 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  async function handleQuickToggleUse(tagGroup: AdminTagGroupRow, checked: boolean) {
    try {
      setRowEdits((prev) => ({
        ...prev,
        [tagGroup.id]: {
          ...prev[tagGroup.id],
          useYn: checked,
        },
      }));

      await apiUpdateAdminTagGroupUse(tagGroup.id, { useYn: checked });
      await loadTagGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("태그그룹 사용 여부 변경 실패:", error);
      openAlert("error", "변경 실패", "태그그룹 사용 여부 변경에 실패했습니다.");
    }
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      setFormError("태그그룹명을 입력해주세요.");
      return;
    }
    if (!form.code.trim()) {
      setFormError("태그그룹 코드를 입력해주세요.");
      return;
    }

    try {
      const payload: AdminTagGroupCreateRequest = {
        name: form.name.trim(),
        code: form.code.trim(),
        multiSelectYn: form.multiSelectYn,
        role: form.role,
        sortOrder: Number(form.sortOrder ?? 0),
        useYn: form.useYn,
        description: form.description.trim() || null,
      };

      if (modalMode === "create") {
        await apiCreateAdminTagGroup(payload);
        openAlert("success", "등록 완료", "태그그룹을 등록했습니다.");
      } else if (selectedItem) {
        await apiUpdateAdminTagGroup(selectedItem.id, payload);
        openAlert("success", "수정 완료", "태그그룹을 수정했습니다.");
      }

      handleCloseForm();
      await loadTagGroups(page, size, appliedSearch);
    } catch (error) {
      console.error("태그그룹 저장 실패:", error);
      setFormError("태그그룹 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className={styles.page}>
      <TagGroupFormModal
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
          <h1 className={styles.pageTitle}>태그 그룹 관리</h1>
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
            {isBatchSaving ? "수정 중.." : "선택수정"}
          </button>

          <button type="button" className={styles.primaryButton} onClick={handleOpenCreate}>
            + 태그그룹 등록
          </button>
        </div>
      </div>

      <TagGroupSearchSection
        keyword={keyword}
        multiSelectYnFilter={multiSelectYnFilter}
        useYnFilter={useYnFilter}
        onChangeKeyword={setKeyword}
        onChangeMultiSelectYnFilter={setMultiSelectYnFilter}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <TagGroupTableSection
        tagGroups={tagGroups}
        rowEdits={rowEdits}
        selectedIds={selectedIds}
        isLoading={isLoading}
        savingRowId={savingRowId}
        size={size}
        onChangePageSize={handleChangePageSize}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickToggleUse={(tagGroup, checked) => {
          void handleQuickToggleUse(tagGroup, checked);
        }}
        onQuickSave={(tagGroup) => {
          void handleQuickSave(tagGroup);
        }}
        onOpenDetail={handleOpenDetail}
        onMoveTags={(tagGroup) => {
          navigate(`/admin/tags?tagGroupId=${tagGroup.id}`);
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
