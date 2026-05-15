import { useEffect, useMemo, useState } from "react";
import {
  apiCreateAdminMainBanner,
  apiDeleteAdminMainBanner,
  apiDeleteAdminMainBanners,
  apiGetAdminMainBanners,
  apiImportAdminMainBanners,
  apiUpdateAdminMainBanner,
  type AdminMainBannerRow,
} from "@/shared/api/admin/mainBannerApi";
import { resolveUrl } from "@/shared/config/env";
import { useModalStore } from "@/shared/store/modalStore";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import AdminPagination from "@/components/admin/common/AdminPagination";
import MainBannerFormModal, {
  type MainBannerFormValue,
} from "@/components/admin/main/MainBannerFormModal";
import styles from "../admin.module.css";
import catalogStyles from "@/pages/admin/catalog/ManagePage.module.css";

interface MainBannerRowEditValue {
  sortOrder: number;
  useYn: boolean;
}

function createEmptyForm(nextSortOrder: number): MainBannerFormValue {
  return {
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    sortOrder: nextSortOrder,
    useYn: true,
    description: "",
  };
}

export default function MainManagePage() {
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const [banners, setBanners] = useState<AdminMainBannerRow[]>([]);
  const [rowEdits, setRowEdits] = useState<Record<number, MainBannerRowEditValue>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedBanner, setSelectedBanner] = useState<AdminMainBannerRow | null>(null);
  const [form, setForm] = useState<MainBannerFormValue>(createEmptyForm(1));
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const nextSortOrder = useMemo(() => {
    if (banners.length === 0) return 1;
    return Math.max(...banners.map((banner) => banner.sortOrder ?? 0)) + 1;
  }, [banners]);

  const totalElements = banners.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  const pagedBanners = useMemo(() => {
    const fromIndex = page * size;
    const toIndex = fromIndex + size;
    return banners.slice(fromIndex, toIndex);
  }, [banners, page, size]);
  const isAllSelected =
    pagedBanners.length > 0 && pagedBanners.every((banner) => selectedIds.includes(banner.id));

  function syncRowEdits(nextBanners: AdminMainBannerRow[]) {
    const nextRowEdits: Record<number, MainBannerRowEditValue> = {};
    nextBanners.forEach((banner) => {
      nextRowEdits[banner.id] = {
        sortOrder: banner.sortOrder,
        useYn: banner.useYn,
      };
    });
    setRowEdits(nextRowEdits);
    setSelectedIds([]);
    setPage((prev) => {
      const nextTotalPages = nextBanners.length === 0 ? 0 : Math.ceil(nextBanners.length / size);
      if (nextTotalPages === 0) return 0;
      return Math.min(prev, nextTotalPages - 1);
    });
  }

  async function loadBanners() {
    try {
      setIsLoading(true);
      const response = await apiGetAdminMainBanners();
      setBanners(response);
      syncRowEdits(response);
    } catch (error) {
      console.error("메인 배너 목록 조회 실패:", error);
      openAlert("error", "조회 실패", "메인 배너 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBanners();
  }, []);

  function handleOpenCreate() {
    setModalMode("create");
    setSelectedBanner(null);
    setForm(createEmptyForm(nextSortOrder));
    setFormError("");
    setShowForm(true);
  }

  function handleOpenEdit(banner: AdminMainBannerRow) {
    setModalMode("edit");
    setSelectedBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? "",
      sortOrder: banner.sortOrder,
      useYn: banner.useYn,
      description: banner.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedBanner(null);
    setFormError("");
  }

  function handleFormChange<Key extends keyof MainBannerFormValue>(
    key: Key,
    value: MainBannerFormValue[Key],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleRowChange<Key extends keyof MainBannerRowEditValue>(
    bannerId: number,
    key: Key,
    value: MainBannerRowEditValue[Key],
  ) {
    setRowEdits((prev) => ({
      ...prev,
      [bannerId]: {
        ...prev[bannerId],
        [key]: value,
      },
    }));
  }

  function handleToggleSelect(bannerId: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(bannerId)) return prev;
        return [...prev, bannerId];
      }
      return prev.filter((id) => id !== bannerId);
    });
  }

  function handleToggleSelectAll(checked: boolean) {
    const currentPageIds = pagedBanners.map((banner) => banner.id);
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
  }

  async function handleImport() {
    try {
      setIsImporting(true);
      const result = await apiImportAdminMainBanners();
      openAlert(
        "success",
        "가져오기 완료",
        `전체 ${result.totalCount}건\n신규 ${result.importedCount}건\n건너뜀 ${result.skippedCount}건`,
      );
      await loadBanners();
    } catch (error) {
      console.error("메인 배너 가져오기 실패:", error);
      openAlert("error", "가져오기 실패", "메인 배너 데이터를 가져오지 못했습니다.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }

    if (!form.imageUrl.trim()) {
      setFormError("배너 이미지를 등록해주세요.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim() || null,
      sortOrder: Number(form.sortOrder ?? 0),
      useYn: form.useYn,
      description: form.description.trim() || null,
    };

    try {
      if (modalMode === "create") {
        await apiCreateAdminMainBanner(payload);
        openAlert("success", "등록 완료", "메인 배너를 등록했습니다.");
      } else if (selectedBanner) {
        await apiUpdateAdminMainBanner(selectedBanner.id, payload);
        openAlert("success", "수정 완료", "메인 배너를 수정했습니다.");
      }

      handleCloseForm();
      await loadBanners();
    } catch (error) {
      console.error("메인 배너 저장 실패:", error);
      setFormError("메인 배너 저장 중 오류가 발생했습니다.");
    }
  }

  async function handleBatchSave() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "수정할 배너를 선택해주세요.");
      return;
    }

    try {
      setIsBatchSaving(true);
      for (const banner of banners.filter((item) => selectedIds.includes(item.id))) {
        const row = rowEdits[banner.id];
        await apiUpdateAdminMainBanner(banner.id, {
          title: banner.title,
          subtitle: banner.subtitle ?? null,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl ?? null,
          sortOrder: Number(row?.sortOrder ?? banner.sortOrder),
          useYn: row?.useYn ?? banner.useYn,
          description: banner.description ?? null,
        });
      }
      openAlert("success", "선택수정 완료", "선택한 배너를 수정했습니다.");
      await loadBanners();
    } catch (error) {
      console.error("메인 배너 선택수정 실패:", error);
      openAlert("error", "선택수정 실패", "선택한 배너를 수정하지 못했습니다.");
    } finally {
      setIsBatchSaving(false);
    }
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) {
      openAlert("warning", "선택 필요", "삭제할 배너를 선택해주세요.");
      return;
    }

    openConfirm(
      "warning",
      "선택 삭제",
      `선택한 ${selectedIds.length}개 배너를 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            setIsBatchDeleting(true);
            await apiDeleteAdminMainBanners(selectedIds);
            openAlert("success", "선택삭제 완료", "선택한 배너를 삭제했습니다.");
            await loadBanners();
          } catch (error) {
            console.error("메인 배너 선택삭제 실패:", error);
            openAlert("error", "선택삭제 실패", "선택한 배너를 삭제하지 못했습니다.");
          } finally {
            setIsBatchDeleting(false);
          }
        })();
      },
      "삭제",
    );
  }

  function handleDelete(banner: AdminMainBannerRow) {
    openConfirm(
      "warning",
      "배너 삭제",
      `${banner.title} 배너를 삭제하시겠습니까?`,
      () => {
        void (async () => {
          try {
            await apiDeleteAdminMainBanner(banner.id);
            openAlert("success", "삭제 완료", "메인 배너를 삭제했습니다.");
            await loadBanners();
          } catch (error) {
            console.error("메인 배너 삭제 실패:", error);
            openAlert("error", "삭제 실패", "메인 배너를 삭제하지 못했습니다.");
          }
        })();
      },
      "삭제",
    );
  }

  function handleChangePage(nextPage: number) {
    if (nextPage < 0 || nextPage >= totalPages) return;
    setPage(nextPage);
  }

  function handleChangePageSize(nextSize: number) {
    setSize(nextSize);
    setPage(0);
    setSelectedIds([]);
  }

  return (
    <div className={styles.page}>
      <MainBannerFormModal
        visible={showForm}
        mode={modalMode}
        form={form}
        formError={formError}
        onClose={handleCloseForm}
        onChange={handleFormChange}
        onSave={handleSave}
      />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>메인 배너 관리</h1>
          <p className={styles.pageDesc}>메인 화면 배너를 관리합니다.</p>
        </div>

        <div className={catalogStyles.headerActions}>
          <button
            type="button"
            className={catalogStyles.secondaryButton}
            onClick={() => void handleImport()}
            disabled={isImporting}
          >
            {isImporting ? "가져오는 중..." : "배너 가져오기"}
          </button>
          <button
            type="button"
            className={catalogStyles.secondaryButton}
            onClick={() => void handleBatchSave()}
            disabled={isBatchSaving}
          >
            {isBatchSaving ? "수정 중..." : "선택수정"}
          </button>
          <button
            type="button"
            className={catalogStyles.secondaryButton}
            style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fff" }}
            onClick={handleBatchDelete}
            disabled={isBatchDeleting}
          >
            {isBatchDeleting ? "삭제 중..." : "선택삭제"}
          </button>
          <button type="button" className={catalogStyles.primaryButton} onClick={handleOpenCreate}>
            + 메인 배너 등록
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableCount}>
            총 <strong>{banners.length}</strong>건
          </span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(event) => handleToggleSelectAll(event.target.checked)}
                />
              </th>
              <th>미리보기</th>
              <th>제목</th>
              <th>링크</th>
              <th style={{ width: 88 }}>순서</th>
              <th style={{ width: 110 }}>사용 여부</th>
              <th>등록일</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  불러오는 중입니다.
                </td>
              </tr>
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  등록된 메인 배너가 없습니다.
                </td>
              </tr>
            ) : (
              pagedBanners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(banner.id)}
                      onChange={(event) => handleToggleSelect(banner.id, event.target.checked)}
                    />
                  </td>
                  <td>
                    <img
                      src={resolveUrl(banner.imageUrl)}
                      alt={banner.title}
                      style={{
                        width: 120,
                        height: 68,
                        borderRadius: 10,
                        objectFit: "cover",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{banner.title}</div>
                    {banner.subtitle ? (
                      <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{banner.subtitle}</div>
                    ) : null}
                  </td>
                  <td style={{ maxWidth: 240, wordBreak: "break-all", fontSize: 12 }}>
                    {banner.linkUrl || "-"}
                  </td>
                  <td>
                    <input
                      type="number"
                      className={catalogStyles.inlineNumberInput}
                      style={{ width: 64, minWidth: 64 }}
                      value={rowEdits[banner.id]?.sortOrder ?? banner.sortOrder}
                      onChange={(event) =>
                        handleRowChange(banner.id, "sortOrder", Number(event.target.value))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={catalogStyles.inlineSelect}
                      style={{ width: 92, minWidth: 92 }}
                      value={String(rowEdits[banner.id]?.useYn ?? banner.useYn)}
                      onChange={(event) => handleRowChange(banner.id, "useYn", event.target.value === "true")}
                    >
                      <option value="true">사용</option>
                      <option value="false">미사용</option>
                    </select>
                  </td>
                  <td>{formatDateTimeKst(banner.createdAt)}</td>
                  <td>{formatDateTimeKst(banner.updatedAt)}</td>
                  <td>
                    <div className={catalogStyles.tableActions}>
                      <button
                        type="button"
                        className={catalogStyles.secondaryButton}
                        onClick={() => handleOpenEdit(banner)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className={catalogStyles.secondaryButton}
                        style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fff" }}
                        onClick={() => handleDelete(banner)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        totalElements={totalElements}
        page={page}
        size={size}
        totalPages={totalPages}
        first={page === 0}
        last={totalPages === 0 || page >= totalPages - 1}
        onChangePage={handleChangePage}
        onChangePageSize={handleChangePageSize}
      />
    </div>
  );
}
