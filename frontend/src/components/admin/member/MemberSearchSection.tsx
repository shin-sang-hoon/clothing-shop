import AdminCard from "@/components/admin/common/AdminCard";
import styles from "@/pages/admin/members/MemberManagePage.module.css";

/**
 * MemberSearchSectionProps
 * - 회원 검색 섹션 props
 */
interface MemberSearchSectionProps {
    searchType: "email" | "name" | "phoneNumber";
    keyword: string;
    roleFilter: string;
    statusFilter: string;
    onChangeSearchType: (value: "email" | "name" | "phoneNumber") => void;
    onChangeKeyword: (value: string) => void;
    onChangeRoleFilter: (value: string) => void;
    onChangeStatusFilter: (value: string) => void;
    onSearch: () => void;
    onReset: () => void;
    onMoveRegister?: () => void;
}

/**
 * MemberSearchSection
 * - 관리자 회원 검색 조건 영역
 * - 페이징 대응을 위해 검색 버튼 클릭 시 API 재조회
 */
export default function MemberSearchSection({
    searchType,
    keyword,
    roleFilter,
    statusFilter,
    onChangeSearchType,
    onChangeKeyword,
    onChangeRoleFilter,
    onChangeStatusFilter,
    onSearch,
    onReset,
    onMoveRegister,
}: MemberSearchSectionProps) {
    return (
        <AdminCard title="검색 조건">
            <div className={styles.searchRow}>
                <select
                    className={styles.searchSelect}
                    value={searchType}
                    onChange={(event) =>
                        onChangeSearchType(
                            event.target.value as "email" | "name" | "phoneNumber",
                        )
                    }
                >
                    <option value="email">이메일</option>
                    <option value="name">이름</option>
                    <option value="phoneNumber">휴대폰 번호</option>
                </select>

                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="검색어를 입력하세요."
                    value={keyword}
                    onChange={(event) => onChangeKeyword(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            onSearch();
                        }
                    }}
                />

                <select
                    className={styles.searchSelect}
                    value={roleFilter}
                    onChange={(event) => onChangeRoleFilter(event.target.value)}
                >
                    <option value="">전체 역할</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                </select>

                <select
                    className={styles.searchSelect}
                    value={statusFilter}
                    onChange={(event) => onChangeStatusFilter(event.target.value)}
                >
                    <option value="">전체 상태</option>
                    <option value="정상">정상</option>
                    <option value="차단">차단</option>
                    <option value="탈퇴">탈퇴</option>
                </select>

                <button
                    type="button"
                    className={styles.searchButton}
                    onClick={onSearch}
                >
                    검색
                </button>

                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onReset}
                >
                    초기화
                </button>

                {onMoveRegister && (
                    <button
                        type="button"
                        className={styles.topActionButton}
                        onClick={onMoveRegister}
                    >
                        + 회원 등록
                    </button>
                )}
            </div>
        </AdminCard>
    );
}
