import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import {
    type AdminMemberListRow,
    type AdminMemberRole,
    type AdminMemberStatus,
} from "@/shared/api/adminApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/members/MemberManagePage.module.css";

/**
 * MemberTableSectionProps
 * - 회원 목록 테이블 영역 props
 */
interface MemberTableSectionProps {
    members: AdminMemberListRow[];
    isLoading: boolean;
    pageSize: number;
    onChangePageSize: (size: number) => void;
    onEdit: (id: number) => void;
    onChangeRole: (id: number, role: AdminMemberRole) => void;
    onChangeStatus: (id: number, status: AdminMemberStatus) => void;
}

/**
 * MemberTableSection
 * - 관리자 회원 목록 테이블 영역
 * - 카드 타이틀 우측에 페이지당 개수 셀렉트 배치
 */
export default function MemberTableSection({
    members,
    isLoading,
    pageSize,
    onChangePageSize,
    onEdit,
    onChangeRole,
    onChangeStatus,
}: MemberTableSectionProps) {
    return (
        <AdminCard
            title="회원 목록"
            actions={
                <div className={styles.tableHeaderTools}>
                    <label className={styles.pageSizeLabel}>
                        목록 개수
                    </label>

                    <select
                        className={styles.pageSizeSelect}
                        value={pageSize}
                        onChange={(event) =>
                            onChangePageSize(Number(event.target.value))
                        }
                    >
                        <option value={10}>10개</option>
                        <option value={20}>20개</option>
                        <option value={50}>50개</option>
                        <option value={100}>100개</option>
                    </select>
                </div>
            }
        >
            {isLoading ? (
                <div className={styles.loadingText}>불러오는 중...</div>
            ) : members.length === 0 ? (
                <AdminEmpty message="조건에 맞는 회원이 없습니다." />
            ) : (
                <AdminTable>
                    <thead>
                        <tr>
                            <th>이메일</th>
                            <th>이름</th>
                            <th>휴대폰 번호</th>
                            <th>역할</th>
                            <th>상태</th>
                            <th>가입일</th>
                            <th>최종접속</th>
                            <th>포인트</th>
                            <th>관리</th>
                        </tr>
                    </thead>

                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id}>
                                <td>
                                    <strong>{member.email}</strong>
                                </td>

                                <td>{member.name}</td>

                                <td>{member.phoneNumber || "-"}</td>

                                <td>
                                    <select
                                        className={`${styles.inlineSelect} ${styles.roleSelect}`}
                                        value={member.role}
                                        onChange={(event) =>
                                            void onChangeRole(
                                                member.id,
                                                event.target.value as AdminMemberRole,
                                            )
                                        }
                                    >
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>

                                <td>
                                    <select
                                        className={`${styles.inlineSelect} ${styles.statusSelect} ${
                                            member.status === "차단"
                                                ? styles.statusBlocked
                                                : member.status === "탈퇴"
                                                    ? styles.statusWithdrawn
                                                    : styles.statusNormal
                                        }`}
                                        value={member.status}
                                        onChange={(event) =>
                                            void onChangeStatus(
                                                member.id,
                                                event.target.value as AdminMemberStatus,
                                            )
                                        }
                                    >
                                        <option value="정상">정상</option>
                                        <option value="차단">차단</option>
                                        <option value="탈퇴">탈퇴</option>
                                    </select>
                                </td>

                                <td>{formatDateTimeKst(member.createdAt)}</td>
                                <td>{formatDateTimeKst(member.lastLoginAt)}</td>
                                <td>{member.point != null ? `${member.point} P` : "-"}</td>

                                <td>
                                    <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        onClick={() => onEdit(member.id)}
                                    >
                                        상세 / 수정
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            )}
        </AdminCard>
    );
}