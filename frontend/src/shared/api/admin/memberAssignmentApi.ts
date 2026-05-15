import { http } from "../http";

/**
 * MemberSummary
 * - 역할/권한 할당 화면용 회원 요약 정보
 */
export type MemberSummary = {
    id: number;
    email: string;
    roles: string[];
    permissions: string[];
};

/**
 * apiListMembersForAssignment
 * - 회원-역할/권한 할당용 회원 목록
 */
export async function apiListMembersForAssignment() {
    const res = await http.get<MemberSummary[]>("/admin/assignments/members");
    return res.data;
}

/**
 * apiSetMemberRoles
 * - 회원 역할 할당
 */
export async function apiSetMemberRoles(memberId: number, roleIds: number[]) {
    const res = await http.put<MemberSummary>(
        `/admin/assignments/members/${memberId}/roles`,
        { roleIds },
    );
    return res.data;
}

/**
 * apiSetMemberDirectPermissions
 * - 회원 직접 권한 할당
 */
export async function apiSetMemberDirectPermissions(
    memberId: number,
    permissionIds: number[],
) {
    const res = await http.put<MemberSummary>(
        `/admin/assignments/members/${memberId}/permissions`,
        { permissionIds },
    );
    return res.data;
}