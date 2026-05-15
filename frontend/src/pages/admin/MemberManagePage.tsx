import { useEffect, useMemo, useState } from "react";
import {
  MemberSummary,
  PermissionRow,
  RoleRow,
  apiListMembersForAssignment,
  apiListPermissions,
  apiListRoles,
  apiSetMemberDirectPermissions,
  apiSetMemberRoles,
} from "@/shared/api/adminApi";
import { useAuthStore } from "@/shared/store/authStore";

/**
 * MemberManagePage (Admin Assignments)
 * - 회원 목록 조회
 * - 회원에게 Role 부여/회수
 * - 회원에게 Direct Permission 부여/회수(예외 권한)
 */
export default function MemberManagePage() {
  const hasPerm = useAuthStore((s) => s.hasPerm);

  const canRead = hasPerm("PERM_MEMBER_READ");
  const canSetRoles = hasPerm("PERM_MEMBER_SET_ROLES");
  const canSetPerms = hasPerm("PERM_MEMBER_SET_PERMISSIONS");

  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [perms, setPerms] = useState<PermissionRow[]>([]);
  const [status, setStatus] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const load = async () => {
    if (!canRead) {
      setStatus("권한 없음: PERM_MEMBER_READ");
      return;
    }
    setStatus("로드 중...");
    try {
      const [m, r, p] = await Promise.all([
        apiListMembersForAssignment(),
        apiListRoles(),
        apiListPermissions(),
      ]);
      setMembers(m);
      setRoles(r);
      setPerms(p);
      if (selectedMemberId == null && m.length > 0)
        setSelectedMemberId(m[0].id);
      setStatus("✅ 로드 완료");
    } catch (e: any) {
      setStatus(`로드 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleRole = async (roleId: number) => {
    if (!selectedMember) return;
    if (!canSetRoles) return setStatus("권한 없음: PERM_MEMBER_SET_ROLES");

    // UI에서 member.roles는 role name 리스트
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const nextRoleNames = new Set(selectedMember.roles);
    if (nextRoleNames.has(role.name)) nextRoleNames.delete(role.name);
    else nextRoleNames.add(role.name);

    const nextRoleIds = roles
      .filter((r) => nextRoleNames.has(r.name))
      .map((r) => r.id);

    setStatus("Role 변경 저장 중...");
    try {
      const updated = await apiSetMemberRoles(selectedMember.id, nextRoleIds);
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
      setStatus("✅ Role 변경 완료");
    } catch (e: any) {
      setStatus(
        `Role 변경 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`,
      );
    }
  };

  const handleToggleDirectPerm = async (permId: number) => {
    if (!selectedMember) return;
    if (!canSetPerms)
      return setStatus("권한 없음: PERM_MEMBER_SET_PERMISSIONS");

    const perm = perms.find((p) => p.id === permId);
    if (!perm) return;

    // 주의: members API는 "최종 permissions(roll+direct)"만 주고 있음
    // direct permission만 분리해서 보여주고 싶으면 백엔드에 별도 필드 필요.
    // 여기서는 단순히 "member_permission을 최종상태로 덮어쓰는 기능"이므로,
    // UI에서는 direct perms를 별도로 관리할 수 없어서, 다음처럼 "사용자 직접 권한 리스트"를 별도 상태로 들고 간다.
    //
    // => 현실적 대안:
    // - 지금은 direct perm 할당 UI를 '선택된 권한 목록'으로 별도 유지해 저장한다.
    // - 정확히 하려면 백엔드 MemberSummary에 directPermissionCodes를 추가해야 함.
    //
    // 이번 단계에선 "단순 동작 확인"이 목적이니, 아래처럼 임시로 처리:
    const current = new Set(selectedMember.permissions);
    const next = new Set(current);

    if (next.has(perm.code)) next.delete(perm.code);
    else next.add(perm.code);

    // ⚠️ 여기서 permissionIds로 저장하면 "directPermissions"에 들어가고,
    // Role 기반 permissions는 그대로 유지되므로, 실제 최종 permissions는 (role perms + direct perms)가 됨.
    // 하지만 우리는 최종 permissions를 기준으로 토글하고 있어서, role perms까지 direct로 넣어버릴 수 있다.
    //
    // ✅ 안전한 방식:
    // - direct 권한은 "role perms를 제외한 것만" 저장해야 함.
    // - 그러려면 role perms를 계산해서 빼야 한다.
    const rolePermCodes = new Set<string>();
    for (const rName of selectedMember.roles) {
      const role = roles.find((r) => r.name === rName);
      if (!role) continue;
      for (const code of role.permissionCodes) rolePermCodes.add(code);
    }

    // direct = next - rolePermCodes
    const directCodes = [...next].filter((code) => !rolePermCodes.has(code));
    const directIds = perms
      .filter((p) => directCodes.includes(p.code))
      .map((p) => p.id);

    setStatus("Direct Permission 변경 저장 중...");
    try {
      const updated = await apiSetMemberDirectPermissions(
        selectedMember.id,
        directIds,
      );
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
      setStatus("✅ Direct Permission 변경 완료");
    } catch (e: any) {
      setStatus(
        `Direct Permission 변경 실패: ${e?.response?.status ?? ""} ${e?.message ?? ""}`,
      );
    }
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => a.email.localeCompare(b.email));
  }, [members]);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => a.name.localeCompare(b.name));
  }, [roles]);

  const sortedPerms = useMemo(() => {
    return [...perms].sort((a, b) => a.code.localeCompare(b.code));
  }, [perms]);

  return (
    <div>
      <h2>회원(Role/Permission) 할당</h2>

      <div style={{ marginBottom: 8 }}>
        <strong>Status</strong>: {status}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}
      >
        {/* 좌측: 회원 목록 */}
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>내 권한</strong>:{" "}
            {[
              canRead && "MEMBER_READ",
              canSetRoles && "SET_ROLES",
              canSetPerms && "SET_DIRECT_PERMS",
            ]
              .filter(Boolean)
              .join(", ") || "(없음)"}
          </div>

          <button onClick={load} style={{ marginBottom: 12 }}>
            새로고침
          </button>

          <div style={{ marginBottom: 8 }}>
            <strong>회원 목록</strong>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            {sortedMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                style={{
                  textAlign: "left",
                  padding: 8,
                  border: "1px solid #ddd",
                  background:
                    selectedMemberId === m.id ? "#eee" : "transparent",
                }}
              >
                {m.email}
              </button>
            ))}
            {sortedMembers.length === 0 && <div>(회원 없음)</div>}
          </div>
        </div>

        {/* 우측: 할당 */}
        <div style={{ border: "1px solid #ddd", padding: 12 }}>
          {!selectedMember && <div>(회원 선택 필요)</div>}

          {selectedMember && (
            <>
              <h3 style={{ marginTop: 0 }}>{selectedMember.email}</h3>

              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  <strong>현재 Roles</strong>:{" "}
                  {selectedMember.roles.join(", ") || "(없음)"}
                </div>
                <div>
                  <strong>현재 Permissions(최종)</strong>:{" "}
                  {selectedMember.permissions.join(", ") || "(없음)"}
                </div>
              </div>

              <hr style={{ margin: "12px 0" }} />

              <div>
                <strong>Role 할당</strong>
              </div>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {sortedRoles.map((r) => {
                  const checked = selectedMember.roles.includes(r.name);
                  return (
                    <label
                      key={r.id}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canSetRoles}
                        onChange={() => handleToggleRole(r.id)}
                      />
                      <span style={{ fontFamily: "monospace" }}>{r.name}</span>
                      <span style={{ opacity: 0.8 }}>
                        {r.description ?? ""}
                      </span>
                    </label>
                  );
                })}
              </div>

              <hr style={{ margin: "12px 0" }} />

              <div>
                <strong>Direct Permission(예외 권한) 할당</strong>
              </div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>
                - Role로 이미 부여된 권한은 자동 제외하고 저장됨.
              </div>

              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {sortedPerms.map((p) => {
                  const checked = selectedMember.permissions.includes(p.code);
                  return (
                    <label
                      key={p.id}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canSetPerms}
                        onChange={() => handleToggleDirectPerm(p.id)}
                      />
                      <span style={{ fontFamily: "monospace" }}>{p.code}</span>
                      <span style={{ opacity: 0.8 }}>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
