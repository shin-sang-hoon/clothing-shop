import { useEffect, useMemo, useState } from "react";
import {
  PermissionRow,
  RoleRow,
  apiCreateRole,
  apiDeleteRole,
  apiListPermissions,
  apiListRoles,
  apiSetRolePermissions,
  apiUpdateRole,
} from "@/shared/api/adminApi";
import { useAuthStore } from "@/shared/store/authStore";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "./admin.module.css";

/**
 * RoleManagePage
 * - Role CRUD + RolePermission 매핑 설정
 */
export default function RoleManagePage() {
  const hasPerm = useAuthStore((s) => s.hasPerm);
  const openAlert = useModalStore((state) => state.openAlert);
  const openConfirm = useModalStore((state) => state.openConfirm);

  const canRoleRead = hasPerm("PERM_ROLE_READ");
  const canRoleCreate = hasPerm("PERM_ROLE_CREATE");
  const canRoleUpdate = hasPerm("PERM_ROLE_UPDATE");
  const canRoleDelete = hasPerm("PERM_ROLE_DELETE");
  const canRoleSetPerms = hasPerm("PERM_ROLE_SET_PERMISSIONS");

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [perms, setPerms] = useState<PermissionRow[]>([]);
  const [status, setStatus] = useState("");

  const [newName, setNewName] = useState("ROLE_");
  const [newDesc, setNewDesc] = useState("");

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => a.name.localeCompare(b.name));
  }, [roles]);

  const sortedPerms = useMemo(() => {
    return [...perms].sort((a, b) => a.code.localeCompare(b.code));
  }, [perms]);

  const load = async () => {
    if (!canRoleRead) {
      setStatus("권한 없음: PERM_ROLE_READ");
      return;
    }
    setStatus("로드 중...");
    try {
      const [r, p] = await Promise.all([apiListRoles(), apiListPermissions()]);
      setRoles(r);
      setPerms(p);
      setStatus("✅ 로드 완료");
      if (selectedRoleId == null && r.length > 0) {
        setSelectedRoleId(r[0].id);
      }
    } catch (e: any) {
      setStatus(`로드 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEditModal(role: RoleRow): void {
    setEditingRole(role);
    setEditName(role.name);
    setEditDesc(role.description ?? "");
  }

  function closeEditModal(): void {
    setEditingRole(null);
    setEditName("");
    setEditDesc("");
  }

  const handleCreate = async () => {
    if (!canRoleCreate) {
      setStatus("권한 없음: PERM_ROLE_CREATE");
      return;
    }

    if (!newName.trim()) {
      openAlert("warning", "입력 확인", "role name은 필수입니다.");
      return;
    }

    setStatus("생성 중...");
    try {
      const created = await apiCreateRole({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setRoles((prev) => [created, ...prev]);
      setSelectedRoleId(created.id);
      setNewName("ROLE_");
      setNewDesc("");
      setStatus("✅ 생성 완료");
    } catch (e: any) {
      setStatus(`생성 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingRole) {
      return;
    }

    if (!canRoleUpdate) {
      setStatus("권한 없음: PERM_ROLE_UPDATE");
      return;
    }

    if (!editName.trim()) {
      openAlert("warning", "입력 확인", "role name은 필수입니다.");
      return;
    }

    setStatus("수정 중...");
    try {
      const updated = await apiUpdateRole(editingRole.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? updated : r)));
      if (selectedRoleId === editingRole.id) {
        setSelectedRoleId(updated.id);
      }
      setStatus("✅ 수정 완료");
      closeEditModal();
    } catch (e: any) {
      setStatus(`수정 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  const handleDelete = (role: RoleRow) => {
    if (!canRoleDelete) {
      setStatus("권한 없음: PERM_ROLE_DELETE");
      return;
    }

    openConfirm(
      "warning",
      "역할 삭제",
      `${role.name} 역할을 삭제하시겠습니까?`,
      async () => {
        setStatus("삭제 중...");
        try {
          await apiDeleteRole(role.id);
          setRoles((prev) => prev.filter((r) => r.id !== role.id));
          if (selectedRoleId === role.id) {
            setSelectedRoleId(null);
          }
          setStatus("✅ 삭제 완료");
        } catch (e: any) {
          setStatus(`삭제 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
        }
      },
      "삭제",
      "취소",
    );
  };

  const handleTogglePermission = async (permId: number) => {
    if (!selectedRole) {
      return;
    }
    if (!canRoleSetPerms) {
      setStatus("권한 없음: PERM_ROLE_SET_PERMISSIONS");
      return;
    }

    /**
     * 현재 role에 매핑된 permissionCodes 기반으로 체크박스 토글 처리
     */
    const perm = perms.find((p) => p.id === permId);
    if (!perm) {
      return;
    }

    const currentCodes = new Set(selectedRole.permissionCodes);
    const nextCodes = new Set(currentCodes);

    if (nextCodes.has(perm.code)) {
      nextCodes.delete(perm.code);
    } else {
      nextCodes.add(perm.code);
    }

    /**
     * code -> id 변환을 위해 next permissionIds 생성
     */
    const nextPermissionIds = perms
      .filter((p) => nextCodes.has(p.code))
      .map((p) => p.id);

    setStatus("권한 매핑 저장 중...");
    try {
      const updated = await apiSetRolePermissions(
        selectedRole.id,
        nextPermissionIds,
      );
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? updated : r)),
      );
      setStatus("✅ 권한 매핑 저장 완료");
    } catch (e: any) {
      setStatus(`매핑 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  return (
    <div className={styles.page}>
      {editingRole && (
        <div className={styles.modal} onClick={closeEditModal}>
          <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle}>역할 수정</p>
              <button type="button" className={styles.btnIcon} onClick={closeEditModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.formLabel}>role name *</label>
                  <input
                    className={styles.formInput}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="ROLE_SOMETHING"
                  />
                </div>
                <div>
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
          <h1 className={styles.pageTitle}>역할(Role) 관리</h1>
          <p className={styles.pageDesc}>역할 생성, 수정, 삭제 및 권한 매핑을 관리합니다.</p>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 8 }}>
        <strong>Status</strong>: {status}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
        {/* 좌측: Role 목록 + 생성 */}
        <div className={styles.card}>
          <div style={{ marginBottom: 8 }}>
            <strong>내 권한</strong>: {" "}
            {[
              canRoleRead && "ROLE_READ",
              canRoleCreate && "ROLE_CREATE",
              canRoleUpdate && "ROLE_UPDATE",
              canRoleDelete && "ROLE_DELETE",
              canRoleSetPerms && "ROLE_SET_PERMISSIONS",
            ]
              .filter(Boolean)
              .join(", ") || "(없음)"}
          </div>

          <button type="button" className={styles.btnSecondary} onClick={load} style={{ marginBottom: 12 }}>
            새로고침
          </button>

          <hr />

          <div style={{ marginBottom: 8 }}>
            <strong>새 Role 생성</strong>
          </div>
          <label className={styles.formLabel}>
            name
            <input
              className={styles.formInput}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="ROLE_SOMETHING"
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
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleCreate}
            disabled={!canRoleCreate}
            style={{ marginTop: 8 }}
          >
            생성
          </button>

          <hr style={{ margin: "12px 0" }} />

          <div style={{ marginBottom: 8 }}>
            <strong>Role 목록</strong>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {sortedRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                style={{
                  textAlign: "left",
                  padding: 8,
                  border: "1px solid #ddd",
                  background: selectedRoleId === role.id ? "#eee" : "transparent",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {role.name}
              </button>
            ))}
            {sortedRoles.length === 0 && <div>(Role 없음)</div>}
          </div>
        </div>

        {/* 우측: 선택 Role 상세 + 권한 매핑 */}
        <div className={styles.card}>
          {!selectedRole && <div>(Role 선택 필요)</div>}

          {selectedRole && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{selectedRole.name}</h3>
                  <div style={{ opacity: 0.8 }}>{selectedRole.description ?? ""}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => openEditModal(selectedRole)}
                    disabled={!canRoleUpdate}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleDelete(selectedRole)}
                    disabled={!canRoleDelete}
                  >
                    삭제
                  </button>
                </div>
              </div>

              <hr style={{ margin: "12px 0" }} />

              <div style={{ marginBottom: 8 }}>
                <strong>권한 매핑(Role → Permissions)</strong>
              </div>

              {!hasPerm("PERM_PERMISSION_READ") && (
                <div
                  style={{
                    padding: 8,
                    border: "1px solid #f0c",
                    marginBottom: 8,
                  }}
                >
                  권한 목록 조회가 필요함: PERM_PERMISSION_READ
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                {sortedPerms.map((perm) => {
                  const checked = selectedRole.permissionCodes.includes(perm.code);
                  return (
                    <label
                      key={perm.id}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canRoleSetPerms}
                        onChange={() => handleTogglePermission(perm.id)}
                      />
                      <span style={{ fontFamily: "monospace" }}>{perm.code}</span>
                      <span style={{ opacity: 0.8 }}>{perm.name}</span>
                    </label>
                  );
                })}
                {sortedPerms.length === 0 && <div>(Permission 없음)</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
