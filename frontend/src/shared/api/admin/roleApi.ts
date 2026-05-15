import { http } from "../http";

/**
 * RoleRow
 * - 관리자 역할 목록 1행
 */
export type RoleRow = {
    id: number;
    name: string;
    description?: string | null;
    permissionCodes: string[];
};

/**
 * apiListRoles
 * - 역할 목록 조회
 */
export async function apiListRoles() {
    const res = await http.get<RoleRow[]>("/admin/roles");
    return res.data;
}

/**
 * apiCreateRole
 * - 역할 등록
 */
export async function apiCreateRole(payload: {
    name: string;
    description?: string;
}) {
    const res = await http.post<RoleRow>("/admin/roles", payload);
    return res.data;
}

/**
 * apiUpdateRole
 * - 역할 수정
 */
export async function apiUpdateRole(
    id: number,
    payload: { name: string; description?: string },
) {
    const res = await http.put<RoleRow>(`/admin/roles/${id}`, payload);
    return res.data;
}

/**
 * apiDeleteRole
 * - 역할 삭제
 */
export async function apiDeleteRole(id: number) {
    await http.delete(`/admin/roles/${id}`);
}

/**
 * apiSetRolePermissions
 * - 역할에 권한 연결
 */
export async function apiSetRolePermissions(roleId: number, permissionIds: number[]) {
    const res = await http.put<RoleRow>(`/admin/roles/${roleId}/permissions`, {
        permissionIds,
    });
    return res.data;
}