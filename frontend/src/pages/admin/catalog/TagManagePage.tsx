import { useEffect, useState } from "react";
import AdminPagination from "@/components/admin/common/AdminPagination";
import TagFormModal from "@/components/admin/tag/TagFormModal";
import TagSearchSection from "@/components/admin/tag/TagSearchSection";
import TagTableSection from "@/components/admin/tag/TagTableSection";
import type {
  TagFormValue,
  TagRowEditValue,
  TagSearchForm,
} from "@/components/admin/tag/types";
import {
  apiCreateAdminTag,
  apiDeleteAdminTag,
  apiGetAdminTags,
  apiUpdateAdminTag,
  apiUpdateAdminTagUse,
  type AdminTagCreateRequest,
  type AdminTagRow,
} from "@/shared/api/admin/tagApi";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

export default function TagManagePage() {
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const [tags, setTags] = useState<AdminTagRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");
  const [appliedSearch, setAppliedSearch] = useState<TagSearchForm>({
    keyword: "",
    useYnFilter: "",
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  const [rowEdits, setRowEdits] = useState<Record<number, TagRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminTagRow | null>(null);
  const [form, setForm] = useState<TagFormValue>({
    name: "",
    code: "",
    sortOrder: 0,
    useYn: true,
    description: "",
  });
  const [formError, setFormError] = useState("");

  function applyTagList(nextTags: AdminTagRow[]) {
    setTags(nextTags);

    const nextRowEdits: Record<number, TagRowEditValue> = {};
    nextTags.forEach((tag) => {
      nextRowEdits[tag.id] = {
        name: tag.name,
        sortOrder: tag.sortOrder,
        useYn: tag.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
  }

  async function loadTags(targetPage: number, targetSize: number, search: TagSearchForm) {
    try {
      setIsLoading(true);

      const response = await apiGetAdminTags({
        page: targetPage,
        size: targetSize,
        keyword: search.keyword,
        useYn: search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });

      applyTagList(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } catch (error) {
      console.error("태그 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "태그 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTags(0, size, appliedSearch);
  }, []);

  function handleSearch() {
    const nextAppliedSearch: TagSearchForm = {
      keyword,
      useYnFilter,
    };

    setAppliedSearch(nextAppliedSearch);
    void loadTags(0, size, nextAppliedSearch);
  }

  function handleReset() {
    const resetSearch: TagSearchForm = {
      keyword: "",
      useYnFilter: "",
    };

    setKeyword("");
    setUseYnFilter("");
    setAppliedSearch(resetSearch);
    void loadTags(0, size, resetSearch);
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }

    void loadTags(nextPage, size, appliedSearch);
  }

  function handleChangePageSize(nextSize: number) {
    setSize(nextSize);
    void loadTags(0, nextSize, appliedSearch);
  }

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedItem(null);
    setForm({
      name: "",
      code: "",
      sortOrder: 0,
      useYn: true,
      description: "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(tag: AdminTagRow) {
    setModalMode("detail");
    setSelectedItem(tag);
    setForm({
      name: tag.name,
      code: tag.code,
      sortOrder: tag.sortOrder,
      useYn: tag.useYn,
      description: tag.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof TagFormValue>(
    key: Key,
    value: TagFormValue[Key],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleRowChange<Key extends keyof TagRowEditValue>(
    tagId: number,
    key: Key,
    value: TagRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [tagId]: {
        ...prev[tagId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(tagId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(tagId) ? prev : [...prev, tagId];
      }
      return prev.filter((id) => id !== tagId);
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? tags.map((tag) => tag.id) : []);
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 태그를 선택해주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);
      const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));

      for (const tag of selectedTags) {
        const row = rowEdits[tag.id];
        if (!row || !row.name.trim()) {
          throw new Error("태그명을 입력해주세요.");
        }

        await apiUpdateAdminTag(tag.id, {
          name: row.name.trim(),
          code: tag.code,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          description: tag.description ?? null,
        });
      }

      await loadTags(page, size, appliedSearch);
      openAlert("success", "수정 완료", "선택한 태그 정보가 수정되었습니다.");
    } catch (error) {
      console.error("태그 선택수정 실패:", error);
      openAlert("error", "수정 실패", "태그 선택수정에 실패했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(tag: AdminTagRow) {
    const row = rowEdits[tag.id];

    if (!row || !row.name.trim()) {
      openAlert("warning", "입력 필요", "태그명을 입력해주세요.");
      return;
    }

    try {
      setSavingRowId(tag.id);
      await apiUpdateAdminTag(tag.id, {
        name: row.name.trim(),
        code: tag.code,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        description: tag.description ?? null,
      });
      await loadTags(page, size, appliedSearch);
    } catch (error) {
      console.error("태그 빠른저장 실패:", error);
      openAlert("error", "저장 실패", "태그 저장에 실패했습니다.");
    } finally {
      setSavingRowId(null);
    }
  }

  function handleDelete(tag: AdminTagRow) {
    openConfirm(
      "warning",
      "태그 삭제",
      `"${tag.name}" 태그를 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminTag(tag.id);
            await loadTags(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `"${tag.name}" 태그가 삭제되었습니다.`);
          } catch (error) {
            console.error("태그 삭제 실패:", error);
            openAlert("error", "삭제 실패", "태그 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 태그를 선택해주세요.");
      return;
    }

    openConfirm(
      "warning",
      "선택 삭제",
      `선택한 태그 ${selectedIds.length}건을 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            for (const id of selectedIds) {
              await apiDeleteAdminTag(id);
            }
            await loadTags(page, size, appliedSearch);
            openAlert("success", "삭제 완료", `${selectedIds.length}건의 태그가 삭제되었습니다.`);
          } catch (error) {
            console.error("태그 일괄 삭제 실패:", error);
            openAlert("error", "삭제 실패", "태그 삭제에 실패했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  async function handleQuickToggleUse(tag: AdminTagRow, checked: boolean) {
    try {
      setRowEdits((prev) => ({
        ...prev,
        [tag.id]: {
          ...prev[tag.id],
          useYn: checked,
        },
      }));

      await apiUpdateAdminTagUse(tag.id, { useYn: checked });
      await loadTags(page, size, appliedSearch);
    } catch (error) {
      console.error("태그 사용여부 변경 실패:", error);
      openAlert("error", "변경 실패", "태그 사용여부 변경에 실패했습니다.");
    }
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      setFormError("태그명을 입력해주세요.");
      return;
    }

    if (!form.code.trim()) {
      setFormError("태그 코드를 입력해주세요.");
      return;
    }

    try {
      const payload: AdminTagCreateRequest = {
        name: form.name.trim(),
        code: form.code.trim(),
        sortOrder: Number(form.sortOrder ?? 0),
        useYn: form.useYn,
        description: form.description.trim() || null,
      };

      if (modalMode === "create") {
        await apiCreateAdminTag(payload);
        openAlert("success", "등록 완료", "태그가 등록되었습니다.");
      } else if (selectedItem) {
        await apiUpdateAdminTag(selectedItem.id, payload);
        openAlert("success", "수정 완료", "태그가 수정되었습니다.");
      }

      handleCloseForm();
      await loadTags(page, size, appliedSearch);
    } catch (error) {
      console.error("태그 저장 실패:", error);
      setFormError("태그 저장 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className={styles.page}>
      <TagFormModal
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
          <h1 className={styles.pageTitle}>태그 관리</h1>
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
            {isBatchSaving ? "수정중..." : "선택수정"}
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleOpenCreate}>
            + 태그 등록
          </button>
        </div>
      </div>

      <TagSearchSection
        keyword={keyword}
        useYnFilter={useYnFilter}
        onChangeKeyword={setKeyword}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <TagTableSection
        tags={tags}
        rowEdits={rowEdits}
        selectedIds={selectedIds}
        isLoading={isLoading}
        savingRowId={savingRowId}
        size={size}
        onChangePageSize={handleChangePageSize}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onQuickToggleUse={(tag, checked) => {
          void handleQuickToggleUse(tag, checked);
        }}
        onQuickSave={(tag) => {
          void handleQuickSave(tag);
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
