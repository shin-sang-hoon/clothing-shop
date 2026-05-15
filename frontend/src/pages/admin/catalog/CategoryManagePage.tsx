import { useEffect, useMemo, useState } from "react";
import CatalogImportButton from "@/components/admin/catalog/CatalogImportButton";
import CategoryFormModal from "@/components/admin/category/CategoryFormModal";
import CategorySearchSection from "@/components/admin/category/CategorySearchSection";
import CategoryTableSection from "@/components/admin/category/CategoryTableSection";
import {
  buildParentChain,
  collectDescendantIds,
  getParentDepth,
  sortCategories,
} from "@/components/admin/category/categoryUtils";
import styles from "@/pages/admin/catalog/ManagePage.module.css";
import {
  apiCreateAdminCategory,
  apiDeleteAdminCategory,
  apiGetAdminCategories,
  apiUpdateAdminCategory,
  type AdminCategoryCreateRequest,
  type AdminCategoryRow,
  type CategorySearchType,
} from "@/shared/api/admin/categoryApi";
import {
  apiImportCategories,
  apiImportFiltersByCategory,
  apiImportItemsByCategory,
  type ItemImportResponse,
} from "@/shared/api/admin/catalogCrawlApi";
import { useCatalogCrawlJobPoller } from "@/shared/hooks/useCatalogCrawlJobPoller";
import { useModalStore } from "@/shared/store/modalStore";

const CATEGORY_FETCH_SIZE = 1000;
const TEXT = {
  pageTitle: "\uCE74\uD14C\uACE0\uB9AC \uAD00\uB9AC",
  root: "\uB8E8\uD2B8",
  moveUp: "\uC0C1\uC704\uB85C",
  moveRoot: "\uB8E8\uD2B8\uB85C",
  currentDepth: "\uD604\uC7AC",
  depthSuffix: "\uB381\uC2A4",
  rootList: "\uCD5C\uC0C1\uC704 \uCE74\uD14C\uACE0\uB9AC \uBAA9\uB85D",
  childList: "\uD558\uC704 \uBAA9\uB85D",
  deleteSelected: "\uC120\uD0DD\uC0AD\uC81C",
  batchSave: "\uC120\uD0DD\uC218\uC815",
  batchSaving: "\uC218\uC815 \uC911...",
  importCategories: "\uCE74\uD14C\uACE0\uB9AC \uAC00\uC838\uC624\uAE30",
  importTags: "\uC120\uD0DD \uD544\uD130 \uAC00\uC838\uC624\uAE30",
  importItems: "\uC120\uD0DD \uC544\uC774\uD15C \uAC00\uC838\uC624\uAE30",
  createCategory: "+ \uCE74\uD14C\uACE0\uB9AC \uB4F1\uB85D",
  warnSelectForSave: "\uC218\uC815\uD560 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
  warnSelectForDelete: "\uC0AD\uC81C\uD560 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
  warnSelectForTags: "\uD544\uD130\uB97C \uAC00\uC838\uC62C \uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
  warnSelectForItems: "\uC544\uC774\uD15C\uC744 \uAC00\uC838\uC62C \uCE74\uD14C\uACE0\uB9AC\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
  warnCodeMissing: "\uCE74\uD14C\uACE0\uB9AC \uCF54\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  warnUseYn: "\uBBF8\uC0AC\uC6A9 \uCE74\uD14C\uACE0\uB9AC\uB294 \uAC00\uC838\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  saveDone: "\uC800\uC7A5 \uC644\uB8CC",
  updateDone: "\uC218\uC815 \uC644\uB8CC",
  deleteDone: "\uC0AD\uC81C \uC644\uB8CC",
  createDone: "\uB4F1\uB85D \uC644\uB8CC",
  queryFail: "\uC870\uD68C \uC2E4\uD328",
  saveFail: "\uC800\uC7A5 \uC2E4\uD328",
  updateFail: "\uC218\uC815 \uC2E4\uD328",
  deleteFail: "\uC0AD\uC81C \uC2E4\uD328",
  importFail: "\uAC00\uC838\uC624\uAE30 \uC2E4\uD328",
  warnTitle: "\uC120\uD0DD \uD544\uC694",
  importDone: "\uAC00\uC838\uC624\uAE30 \uC644\uB8CC",
  deleteConfirm: "\uC0AD\uC81C",
  deleteSelectedConfirm: "\uC120\uD0DD \uC0AD\uC81C",
} as const;

export interface CategoryRowEditValue {
  name: string;
  sortOrder: number;
  useYn: boolean;
}

export interface CategoryFormValue {
  name: string;
  code: string;
  parentId: number;
  sortOrder: number;
  useYn: boolean;
  imageUrl: string;
  description: string;
}

interface CategorySearchForm {
  searchType: CategorySearchType;
  keyword: string;
  useYnFilter: "" | "true" | "false";
}

function buildInitialForm(parentId = 0): CategoryFormValue {
  return {
    name: "",
    code: "",
    parentId,
    sortOrder: 0,
    useYn: true,
    imageUrl: "",
    description: "",
  };
}

function buildTagImportMessage(categoryName: string, importedGroupCount: number, importedTagCount: number) {
  return [
    categoryName,
    `\uD544\uD130\uADF8\uB8F9 \uC2E0\uADDC ${importedGroupCount}\uAC74`,
    `\uD544\uD130 \uC2E0\uADDC ${importedTagCount}\uAC74`,
  ].join("\n");
}

function buildItemImportMessage(
  categoryName: string,
  listedCount: number,
  importedCount: number,
  skippedCount: number,
  failedCount: number,
) {
  return [
    categoryName,
    `\uBAA9\uB85D ${listedCount}\uAC74`,
    `\uC2E0\uADDC ${importedCount}\uAC74`,
    `\uC911\uBCF5 \uAC74\uB108\uB700 ${skippedCount}\uAC74`,
    `\uC2E4\uD328 ${failedCount}\uAC74`,
  ].join(", ");
}

export default function CategoryManagePage() {
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const { schedulePoll } = useCatalogCrawlJobPoller();

  const [categories, setCategories] = useState<AdminCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentParentId, setCurrentParentId] = useState(0);

  const [searchType, setSearchType] = useState<CategorySearchType>("name");
  const [keyword, setKeyword] = useState("");
  const [useYnFilter, setUseYnFilter] = useState<"" | "true" | "false">("");
  const [appliedSearch, setAppliedSearch] = useState<CategorySearchForm>({
    searchType: "name",
    keyword: "",
    useYnFilter: "",
  });

  const [rowEdits, setRowEdits] = useState<Record<number, CategoryRowEditValue>>(
    {},
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [tagImportingCategoryId, setTagImportingCategoryId] = useState<
    number | null
  >(null);
  const [itemImportingCategoryId, setItemImportingCategoryId] = useState<
    number | null
  >(null);

  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "detail">("create");
  const [selectedItem, setSelectedItem] = useState<AdminCategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormValue>(buildInitialForm());
  const [formError, setFormError] = useState("");

  function applyCategoryList(nextCategories: AdminCategoryRow[]) {
    setCategories(nextCategories);

    const nextRowEdits: Record<number, CategoryRowEditValue> = {};
    nextCategories.forEach((category) => {
      nextRowEdits[category.id] = {
        name: category.name,
        sortOrder: category.sortOrder,
        useYn: category.useYn,
      };
    });

    setRowEdits(nextRowEdits);
    setSelectedIds([]);
    setCurrentParentId((prev) => {
      if (prev <= 0) {
        return 0;
      }
      return nextCategories.some((category) => category.id === prev) ? prev : 0;
    });
  }

  async function loadCategories(search: CategorySearchForm) {
    try {
      setIsLoading(true);
      const response = await apiGetAdminCategories({
        page: 0,
        size: CATEGORY_FETCH_SIZE,
        searchType: search.searchType,
        keyword: search.keyword,
        useYn: search.useYnFilter === "" ? "" : search.useYnFilter === "true",
      });
      applyCategoryList(response.content);
    } catch (error) {
      console.error("Category query failed:", error);
      openAlert("error", TEXT.queryFail, "\uCE74\uD14C\uACE0\uB9AC \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories(appliedSearch);
  }, []);

  function handleSearch() {
    const nextSearch = { searchType, keyword, useYnFilter };
    setAppliedSearch(nextSearch);
    setCurrentParentId(0);
    void loadCategories(nextSearch);
  }

  function handleReset() {
    const nextSearch: CategorySearchForm = {
      searchType: "name",
      keyword: "",
      useYnFilter: "",
    };
    setSearchType("name");
    setKeyword("");
    setUseYnFilter("");
    setAppliedSearch(nextSearch);
    setCurrentParentId(0);
    void loadCategories(nextSearch);
  }

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedItem(null);
    setForm(buildInitialForm(currentParentId > 0 ? currentParentId : 0));
    setFormError("");
    setShowForm(true);
  }

  function handleOpenDetail(category: AdminCategoryRow) {
    setModalMode("detail");
    setSelectedItem(category);
    setForm({
      name: category.name,
      code: category.code,
      parentId: category.parentId ?? 0,
      sortOrder: category.sortOrder,
      useYn: category.useYn,
      imageUrl: category.imageUrl ?? "",
      description: category.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedItem(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof CategoryFormValue>(
    key: Key,
    value: CategoryFormValue[Key],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleRowChange<Key extends keyof CategoryRowEditValue>(
    categoryId: number,
    key: Key,
    value: CategoryRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(categoryId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(categoryId) ? prev : [...prev, categoryId];
      }
      return prev.filter((id) => id !== categoryId);
    });
  }

  function handleToggleSelectAll(checked: boolean, categoryIds: number[]) {
    if (checked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        categoryIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
      return;
    }

    setSelectedIds((prev) => prev.filter((id) => !categoryIds.includes(id)));
  }

  function handleEnterChild(category: AdminCategoryRow) {
    setCurrentParentId(category.id);
    setSelectedIds([]);
  }

  function handleMoveRoot() {
    setCurrentParentId(0);
    setSelectedIds([]);
  }

  function handleMoveUp() {
    if (currentParentId <= 0) {
      return;
    }
    const currentParent = categories.find(
      (category) => category.id === currentParentId,
    );
    setCurrentParentId(currentParent?.parentId ?? 0);
    setSelectedIds([]);
  }

  function handleMoveTo(categoryId: number) {
    setCurrentParentId(categoryId);
    setSelectedIds([]);
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", TEXT.warnTitle, TEXT.warnSelectForSave);
      return;
    }

    try {
      setIsBatchSaving(true);
      const selectedCategories = categories.filter((category) =>
        selectedIds.includes(category.id),
      );

      for (const category of selectedCategories) {
        const row = rowEdits[category.id];
        if (!row || !row.name.trim()) {
          throw new Error("Category name is empty");
        }

        await apiUpdateAdminCategory(category.id, {
          name: row.name.trim(),
          code: category.code,
          parentId: category.parentId ?? 0,
          sortOrder: Number(row.sortOrder ?? 0),
          useYn: row.useYn,
          imageUrl: category.imageUrl ?? null,
          description: category.description ?? null,
        });
      }

      await loadCategories(appliedSearch);
      openAlert("success", TEXT.updateDone, "\uC120\uD0DD\uD55C \uCE74\uD14C\uACE0\uB9AC\uB97C \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4.");
    } catch (error) {
      console.error("Batch save failed:", error);
      openAlert("error", TEXT.updateFail, "\uCE74\uD14C\uACE0\uB9AC \uC218\uC815 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  async function handleQuickSave(category: AdminCategoryRow) {
    const row = rowEdits[category.id];
    if (!row) {
      openAlert("warning", TEXT.updateFail, "\uC218\uC815\uD560 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (!row.name.trim()) {
      openAlert("warning", TEXT.warnTitle, "\uCE74\uD14C\uACE0\uB9AC\uBA85\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    try {
      setSavingRowId(category.id);
      await apiUpdateAdminCategory(category.id, {
        name: row.name.trim(),
        code: category.code,
        parentId: category.parentId ?? 0,
        sortOrder: Number(row.sortOrder ?? 0),
        useYn: row.useYn,
        imageUrl: category.imageUrl ?? null,
        description: category.description ?? null,
      });
      await loadCategories(appliedSearch);
      openAlert("success", TEXT.saveDone, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.");
    } catch (error) {
      console.error("Quick save failed:", error);
      openAlert("error", TEXT.saveFail, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setSavingRowId(null);
    }
  }

  function handleDelete(category: AdminCategoryRow) {
    openConfirm(
      "warning",
      TEXT.deleteConfirm,
      `"${category.name}" \uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminCategory(category.id);
            await loadCategories(appliedSearch);
            openAlert("success", TEXT.deleteDone, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
          } catch (error) {
            console.error("Delete failed:", error);
            openAlert("error", TEXT.deleteFail, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AD\uC81C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
          }
        })();
      },
      TEXT.deleteConfirm,
    );
  }

  function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      openAlert("warning", TEXT.warnTitle, TEXT.warnSelectForDelete);
      return;
    }

    openConfirm(
      "warning",
      TEXT.deleteSelectedConfirm,
      `\uC120\uD0DD\uD55C \uCE74\uD14C\uACE0\uB9AC ${selectedIds.length}\uAC74\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?`,
      () => {
        void (async () => {
          try {
            for (const id of selectedIds) {
              await apiDeleteAdminCategory(id);
            }
            await loadCategories(appliedSearch);
            openAlert("success", TEXT.deleteDone, "\uC120\uD0DD\uD55C \uCE74\uD14C\uACE0\uB9AC\uB97C \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
          } catch (error) {
            console.error("Delete selected failed:", error);
            openAlert("error", TEXT.deleteFail, "\uC120\uD0DD \uC0AD\uC81C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
          }
        })();
      },
      TEXT.deleteConfirm,
    );
  }

  async function runTagImport(category: AdminCategoryRow, silent = false) {
    if (!category.code?.trim()) {
      openAlert("warning", TEXT.importFail, TEXT.warnCodeMissing);
      return;
    }
    if (!category.useYn) {
      openAlert("warning", TEXT.importFail, TEXT.warnUseYn);
      return;
    }

    try {
      setTagImportingCategoryId(category.id);
      const response = await apiImportFiltersByCategory(category.code);
      if (!silent) {
        openAlert(
          "success",
          TEXT.importDone,
          buildTagImportMessage(
            category.name,
            response.importedGroupCount,
            response.importedTagCount,
          ),
        );
      }
    } catch (error) {
      console.error("Tag import failed:", error);
      if (!silent) {
        openAlert("error", TEXT.importFail, "\uCE74\uD14C\uACE0\uB9AC \uD544\uD130\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      }
      throw error;
    } finally {
      setTagImportingCategoryId(null);
    }
  }

  async function runItemImport(category: AdminCategoryRow, silent = false) {
    if (!category.code?.trim()) {
      openAlert("warning", TEXT.importFail, TEXT.warnCodeMissing);
      return;
    }
    if (!category.useYn) {
      openAlert("warning", TEXT.importFail, TEXT.warnUseYn);
      return;
    }

    try {
      setItemImportingCategoryId(category.id);
      const started = await apiImportItemsByCategory(category.code);
      if (silent) {
        return;
      }

      openAlert("success", "가져오는 중", `${category.name}\n아이템 크롤링 실행중입니다.`);
      schedulePoll<ItemImportResponse>(
        started.jobId,
        (status) => {
          if (status.status === "SUCCESS" && status.result) {
            const result = status.result;
            openAlert(
              result.failedCount === 0 ? "success" : "warning",
              TEXT.importDone,
              buildItemImportMessage(
                category.name,
                result.listedCount,
                result.importedCount,
                result.skippedCount,
                result.failedCount,
              ),
            );
            return;
          }
          openAlert("error", TEXT.importFail, status.message || "아이템 가져오기에 실패했습니다.");
        },
        () => {
          openAlert("error", "상태 조회 실패", "아이템 크롤링 상태를 조회하지 못했습니다.");
        },
      );
    } catch (error) {
      console.error("Item import failed:", error);
      if (!silent) {
        openAlert("error", TEXT.importFail, "\uCE74\uD14C\uACE0\uB9AC \uC544\uC774\uD15C\uC744 \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      }
      throw error;
    } finally {
      setItemImportingCategoryId(null);
    }
  }

  async function handleBatchImportTags() {
    if (selectedIds.length === 0) {
      openAlert("warning", TEXT.warnTitle, TEXT.warnSelectForTags);
      return;
    }

    const selectedCategories = categories.filter(
      (category) =>
        selectedIds.includes(category.id) && category.useYn && Boolean(category.code),
    );
    if (selectedCategories.length === 0) {
      openAlert("warning", TEXT.importFail, "\uC0AC\uC6A9 \uC911\uC778 \uCE74\uD14C\uACE0\uB9AC\uB9CC \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const category of selectedCategories) {
      try {
        await runTagImport(category, true);
        successCount++;
      } catch {
        failCount++;
      }
    }

    openAlert(
      failCount === 0 ? "success" : "warning",
      TEXT.importDone,
      `\uC131\uACF5 ${successCount}\uAC74, \uC2E4\uD328 ${failCount}\uAC74`,
    );
  }

  async function handleBatchImportItems() {
    if (selectedIds.length === 0) {
      openAlert("warning", TEXT.warnTitle, TEXT.warnSelectForItems);
      return;
    }

    const selectedCategories = categories.filter(
      (category) =>
        selectedIds.includes(category.id) && category.useYn && Boolean(category.code),
    );
    if (selectedCategories.length === 0) {
      openAlert("warning", TEXT.importFail, "\uC0AC\uC6A9 \uC911\uC778 \uCE74\uD14C\uACE0\uB9AC\uB9CC \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const category of selectedCategories) {
      try {
        await runItemImport(category, true);
        successCount++;
      } catch {
        failCount++;
      }
    }

    openAlert(
      failCount === 0 ? "success" : "warning",
      TEXT.importDone,
      `\uC131\uACF5 ${successCount}\uAC74, \uC2E4\uD328 ${failCount}\uAC74`,
    );
  }

  async function handleSaveForm() {
    if (!form.name.trim()) {
      setFormError("\uCE74\uD14C\uACE0\uB9AC\uBA85\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }
    if (!form.code.trim()) {
      setFormError("\uCE74\uD14C\uACE0\uB9AC \uCF54\uB4DC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    try {
      if (modalMode === "create") {
        const payload: AdminCategoryCreateRequest = {
          name: form.name.trim(),
          code: form.code.trim(),
          parentId: form.parentId <= 0 ? 0 : form.parentId,
          sortOrder: Number(form.sortOrder ?? 0),
          useYn: form.useYn,
          imageUrl: form.imageUrl.trim() || null,
          description: form.description.trim() || null,
        };
        await apiCreateAdminCategory(payload);
        openAlert("success", TEXT.createDone, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uB4F1\uB85D\uD588\uC2B5\uB2C8\uB2E4.");
      } else if (selectedItem) {
        await apiUpdateAdminCategory(selectedItem.id, {
          name: form.name.trim(),
          code: form.code.trim(),
          parentId: form.parentId <= 0 ? 0 : form.parentId,
          sortOrder: Number(form.sortOrder ?? 0),
          useYn: form.useYn,
          imageUrl: form.imageUrl.trim() || null,
          description: form.description.trim() || null,
        });
        openAlert("success", TEXT.updateDone, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4.");
      }

      handleCloseForm();
      await loadCategories(appliedSearch);
    } catch (error) {
      console.error("Save form failed:", error);
      setFormError("\uCE74\uD14C\uACE0\uB9AC \uC800\uC7A5 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }

  async function handleImportCategories() {
    try {
      const result = await apiImportCategories();
      openAlert(
        "success",
        TEXT.importDone,
        `\uC804\uCCB4 ${result.totalCount}\uAC74, \uC2E0\uADDC ${result.importedCount}\uAC74, \uC218\uC815 ${result.updatedCount}\uAC74, \uAC74\uB108\uB700 ${result.skippedCount}\uAC74`,
      );
      await loadCategories(appliedSearch);
    } catch (error) {
      console.error("Category import failed:", error);
      openAlert("error", TEXT.importFail, "\uCE74\uD14C\uACE0\uB9AC\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }

  const currentParentCategory = useMemo(() => {
    if (currentParentId <= 0) {
      return null;
    }
    return categories.find((category) => category.id === currentParentId) ?? null;
  }, [categories, currentParentId]);

  const currentPath = useMemo(
    () => buildParentChain(categories, currentParentId),
    [categories, currentParentId],
  );

  const currentDepth = useMemo(() => {
    if (!currentParentCategory) {
      return 1;
    }
    return currentParentCategory.depth + 1;
  }, [currentParentCategory]);

  const currentLevelCategories = useMemo(
    () =>
      sortCategories(
        categories.filter(
          (category) => (category.parentId ?? 0) === currentParentId,
        ),
      ),
    [categories, currentParentId],
  );

  const parentOptions = useMemo(() => {
    const blockedIds = new Set<number>();
    if (selectedItem) {
      blockedIds.add(selectedItem.id);
      collectDescendantIds(categories, selectedItem.id).forEach((id) =>
        blockedIds.add(id),
      );
    }
    return sortCategories(
      categories.filter((category) => !blockedIds.has(category.id)),
    );
  }, [categories, selectedItem]);

  const currentFormDepth = getParentDepth(categories, form.parentId) + 1;

  return (
    <div className={styles.page}>
      <CategoryFormModal
        visible={showForm}
        mode={modalMode}
        form={form}
        formError={formError}
        parentOptions={parentOptions}
        currentDepth={currentFormDepth}
        onClose={handleCloseForm}
        onChange={handleFormChange}
        onSave={handleSaveForm}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{TEXT.pageTitle}</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteSelected}
          >
            {TEXT.deleteSelected}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleBatchSave()}
            disabled={isBatchSaving}
          >
            {isBatchSaving ? TEXT.batchSaving : TEXT.batchSave}
          </button>
          <CatalogImportButton
            label={TEXT.importCategories}
            onImport={handleImportCategories}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleBatchImportTags()}
          >
            {TEXT.importTags}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void handleBatchImportItems()}
          >
            {TEXT.importItems}
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleOpenCreate}
          >
            {TEXT.createCategory}
          </button>
        </div>
      </div>

      <CategorySearchSection
        searchType={searchType}
        keyword={keyword}
        useYnFilter={useYnFilter}
        onChangeSearchType={setSearchType}
        onChangeKeyword={setKeyword}
        onChangeUseYnFilter={setUseYnFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className={styles.levelNavigator}>
        <div className={styles.levelNavigatorLeft}>
          <div className={styles.breadcrumbWrap}>
            <button
              type="button"
              className={styles.breadcrumbButton}
              onClick={handleMoveRoot}
            >
              {TEXT.root}
            </button>
            {currentPath.map((category) => (
              <div key={category.id} className={styles.breadcrumbNode}>
                <span className={styles.breadcrumbSeparator}>/</span>
                <button
                  type="button"
                  className={styles.breadcrumbButton}
                  onClick={() => handleMoveTo(category.id)}
                >
                  {category.name}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.navigatorInfoRow}>
            <span className={styles.depthBadge}>
              {TEXT.currentDepth} {currentDepth}
              {TEXT.depthSuffix}
            </span>
            <span className={styles.navigatorInfoText}>
              {currentParentCategory
                ? `${currentParentCategory.name} ${TEXT.childList}`
                : TEXT.rootList}
            </span>
          </div>
        </div>

        <div className={styles.navigatorActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleMoveUp}
            disabled={currentParentId <= 0}
          >
            {TEXT.moveUp}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleMoveRoot}
            disabled={currentParentId <= 0}
          >
            {TEXT.moveRoot}
          </button>
        </div>
      </div>

      <CategoryTableSection
        allCategories={categories}
        currentLevelCategories={currentLevelCategories}
        currentDepth={currentDepth}
        selectedIds={selectedIds}
        rowEdits={rowEdits}
        isLoading={isLoading}
        savingRowId={savingRowId}
        filterImportingCategoryId={tagImportingCategoryId}
        itemImportingCategoryId={itemImportingCategoryId}
        onChangeRow={handleRowChange}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onEnterChild={handleEnterChild}
        onQuickSave={(category) => {
          void handleQuickSave(category);
        }}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  );
}
