import { useEffect, useMemo, useState } from "react";
import {
  PermissionRow,
  apiCreatePermission,
  apiDeletePermission,
  apiListPermissions,
  apiUpdatePermission,
} from "@/shared/api/adminApi";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./admin.module.css";

/**
 * PermissionManagePage
 * - Permission 마스터 CRUD
 * - 버튼/기능 노출은 permission 기반 (백엔드가 최종 보안)
 */
export default function PermissionManagePage() {
  const hasPerm = useAuthStore((s) => s.hasPerm);
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const canRead = hasPerm("PERM_PERMISSION_READ");
  const canCreate = hasPerm("PERM_PERMISSION_CREATE");
  const canUpdate = hasPerm("PERM_PERMISSION_UPDATE");
  const canDelete = hasPerm("PERM_PERMISSION_DELETE");

  const [items, setItems] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [newCode, setNewCode] = useState("PERM_");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingItem, setEditingItem] = useState<PermissionRow | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => a.code.localeCompare(b.code));
  }, [items]);

  const load = async () => {
    if (!canRead) {
      setStatus("권한 없음: PERM_PERMISSION_READ");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const data = await apiListPermissions();
      setItems(data);
    } catch (e: any) {
      setStatus(`로드 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEditModal(row: PermissionRow): void {
    setEditingItem(row);
    setEditCode(row.code);
    setEditName(row.name);
    setEditDesc(row.description ?? "");
  }

  function closeEditModal(): void {
    setEditingItem(null);
    setEditCode("");
    setEditName("");
    setEditDesc("");
  }

  const handleCreate = async () => {
    if (!canCreate) {
      setStatus("권한 없음: PERM_PERMISSION_CREATE");
      return;
    }
    if (!newCode.trim() || !newName.trim()) {
      openAlert("warning", "입력 확인", "code와 name은 필수입니다.");
      return;
    }

    setStatus("생성 중...");
    try {
      const created = await apiCreatePermission({
        code: newCode.trim(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setItems((prev) => [created, ...prev]);
      setNewCode("PERM_");
      setNewName("");
      setNewDesc("");
      setStatus("✅ 생성 완료");
    } catch (e: any) {
      setStatus(`생성 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) {
      return;
    }

    if (!canUpdate) {
      setStatus("권한 없음: PERM_PERMISSION_UPDATE");
      return;
    }

    if (!editCode.trim() || !editName.trim()) {
      openAlert("warning", "입력 확인", "code와 name은 필수입니다.");
      return;
    }

    setStatus("수정 중...");
    try {
      const updated = await apiUpdatePermission(editingItem.id, {
        code: editCode.trim(),
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setItems((prev) => prev.map((permission) => (permission.id === editingItem.id ? updated : permission)));
      setStatus("✅ 수정 완료");
      closeEditModal();
    } catch (e: any) {
      setStatus(`수정 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  const handleDelete = (row: PermissionRow) => {
    if (!canDelete) {
      setStatus("권한 없음: PERM_PERMISSION_DELETE");
      return;
    }

    openConfirm(
      "warning",
      "권한 삭제",
      `${row.code} 권한을 삭제하시겠습니까?`,
      async () => {
        setStatus("삭제 중...");
        try {
          await apiDeletePermission(row.id);
          setItems((prev) => prev.filter((permission) => permission.id !== row.id));
          setStatus("✅ 삭제 완료");
        } catch (e: any) {
          setStatus(`삭제 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
        }
      },
      "삭제",
      "취소",
    );
  };

  return (
    <div className={styles.page}>
      {editingItem && (
        <div className={styles.modal} onClick={closeEditModal}>
          <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>권한 수정</p>
              <button type="button" className={styles.btnIcon} onClick={closeEditModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.formLabel}>code *</label>
                  <input
                    className={styles.formInput}
                    value={editCode}
                    onChange={(event) => setEditCode(event.target.value)}
                    placeholder="PERM_SOMETHING"
                  />
                </div>
                <div>
                  <label className={styles.formLabel}>name *</label>
                  <input
                    className={styles.formInput}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="권한 이름"
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className={styles.formLabel}>description</label>
                  <input
                    className={styles.formInput}
                    value={editDesc}
                    onChange={(event) => setEditDesc(event.target.value)}
                    placeholder="설명"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={closeEditModal}>
                취소
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleUpdate}>
                수정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>권한(Permission) 관리</h1>
          <p className={styles.pageDesc}>권한 생성, 수정, 삭제를 관리합니다.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: "grid", gap: 8, maxWidth: 640 }}>
          <div>
            <strong>내 권한</strong>: {" "}
            {[
              canRead && "READ",
              canCreate && "CREATE",
              canUpdate && "UPDATE",
              canDelete && "DELETE",
            ]
              .filter(Boolean)
              .join(", ") || "(없음)"}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className={styles.btnSecondary} onClick={load} disabled={loading}>
              새로고침
            </button>
          </div>

          <hr />

          <div>
            <strong>새 Permission 생성</strong>
          </div>
          <label className={styles.formLabel}>
            code
            <input
              className={styles.formInput}
              value={newCode}
              onChange={(event) => setNewCode(event.target.value)}
              placeholder="PERM_SOMETHING"
            />
          </label>
          <label className={styles.formLabel}>
            name
            <input
              className={styles.formInput}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="권한 이름"
            />
          </label>
          <label className={styles.formLabel}>
            description
            <input
              className={styles.formInput}
              value={newDesc}
              onChange={(event) => setNewDesc(event.target.value)}
              placeholder="설명"
            />
          </label>

          <button type="button" className={styles.btnPrimary} onClick={handleCreate} disabled={!canCreate}>
            생성
          </button>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 12 }}>
        <strong>Status</strong>: {status}
      </div>

      <div className={styles.tableWrap} style={{ marginTop: 12 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.description ?? ""}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => openEditModal(row)}
                      disabled={!canUpdate}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDelete(row)}
                      disabled={!canDelete}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12, textAlign: "center" }}>
                  (데이터 없음)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
