import { http } from "../http";

/**
 * PermissionRow
 * - 관리자 권한 목록 1행
 */
export type PermissionRow = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
};

/**
 * apiListPermissions
 * - 권한 목록 조회
 */
export async function apiListPermissions() {
    const res = await http.get<PermissionRow[]>("/admin/permissions");
    return res.data;
}

/**
 * apiCreatePermission
 * - 권한 등록
 */
export async function apiCreatePermission(payload: {
    code: string;
    name: string;
    description?: string;
}) {
    const res = await http.post<PermissionRow>("/admin/permissions", payload);
    return res.data;
}

/**
 * apiUpdatePermission
 * - 권한 수정
 */
export async function apiUpdatePermission(
    id: number,
    payload: { code: string; name: string; description?: string },
) {
    const res = await http.put<PermissionRow>(`/admin/permissions/${id}`, payload);
    return res.data;
}

/**
 * apiDeletePermission
 * - 권한 삭제
 */
export async function apiDeletePermission(id: number) {
    await http.delete(`/admin/permissions/${id}`);
}