import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminPagination from "@/components/admin/common/AdminPagination";
import MemberNoticeBox from "@/components/admin/member/MemberNoticeBox";
import MemberSearchSection from "@/components/admin/member/MemberSearchSection";
import MemberTableSection from "@/components/admin/member/MemberTableSection";
import {
    apiGetAdminMember,
    apiListAdminMembers,
    apiUpdateAdminMember,
    type AdminMemberListRow,
    type AdminMemberRole,
    type AdminMemberStatus,
} from "@/shared/api/adminApi";
import { useModalStore } from "@/shared/store/modalStore";
import { MemberSearchForm, MemberSearchType } from "./types";
import styles from "./MemberManagePage.module.css";

/**
 * MemberManagePage
 * - 관리자 회원 조회 페이지
 * - 검색 버튼 클릭 시 API 재조회
 * - 페이지 이동 시 API 재조회
 * - 페이지당 개수 변경 시 첫 페이지부터 다시 조회
 */
export default function MemberManagePage() {
    /**
     * 라우터 이동
     */
    const navigate = useNavigate();

    /**
     * 공통 모달
     */
    const openModal = useModalStore((state) => state.openModal);

    /**
     * 검색 입력 상태
     * - 사용자가 입력 중인 값
     */
    const [searchType, setSearchType] = useState<MemberSearchType>("email");
    const [keyword, setKeyword] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    /**
     * 실제 적용된 검색 조건
     * - 검색 버튼 클릭 시 반영
     */
    const [appliedSearch, setAppliedSearch] = useState<MemberSearchForm>({
        searchType: "email",
        keyword: "",
        roleFilter: "",
        statusFilter: "",
    });

    /**
     * 회원 목록
     */
    const [members, setMembers] = useState<AdminMemberListRow[]>([]);

    /**
     * 페이지 상태
     */
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalElements, setTotalElements] = useState<number>(0);

    /**
     * 목록 로딩 상태
     */
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * 관리자 회원 목록 조회
     * - page + size + appliedSearch 기준으로 API 호출
     */
    const loadMembers = async (
        targetPage: number,
        targetSize: number,
        search: MemberSearchForm,
    ): Promise<void> => {
        setIsLoading(true);

        try {
            const pageResponse = await apiListAdminMembers({
                page: targetPage,
                size: targetSize,
                searchType: search.searchType,
                keyword: search.keyword,
                role: search.roleFilter,
                status: search.statusFilter,
            });

            setMembers(pageResponse.content);
            setPage(pageResponse.page);
            setTotalPages(pageResponse.totalPages);
            setTotalElements(pageResponse.totalElements);
        } catch (error) {
            console.error("회원 목록 조회 실패:", error);

            openModal(
                "error",
                "조회 실패",
                "회원 목록을 불러오지 못했습니다.",
                "확인",
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 최초 목록 조회
     */
    useEffect(() => {
        void loadMembers(0, size, appliedSearch);
    }, []);

    /**
     * 검색 버튼 클릭
     * - 입력값을 적용 검색조건으로 반영
     * - 첫 페이지부터 다시 조회
     */
    function handleSearch(): void {
        const nextAppliedSearch: MemberSearchForm = {
            searchType,
            keyword,
            roleFilter: roleFilter as "" | "ADMIN" | "USER",
            statusFilter: statusFilter as "" | "정상" | "차단" | "탈퇴",
        };

        setAppliedSearch(nextAppliedSearch);
        void loadMembers(0, size, nextAppliedSearch);
    }

    /**
     * 검색 초기화
     * - 입력값 / 적용값 둘 다 초기화
     * - 첫 페이지부터 다시 조회
     */
    function handleReset(): void {
        const resetSearch: MemberSearchForm = {
            searchType: "email",
            keyword: "",
            roleFilter: "",
            statusFilter: "",
        };

        setSearchType("email");
        setKeyword("");
        setRoleFilter("");
        setStatusFilter("");
        setAppliedSearch(resetSearch);

        void loadMembers(0, size, resetSearch);
    }

    /**
     * 페이지 이동
     */
    function handleChangePage(nextPage: number): void {
        if (nextPage < 0 || nextPage >= totalPages) {
            return;
        }

        void loadMembers(nextPage, size, appliedSearch);
    }

    /**
     * 페이지당 개수 변경
     * - 첫 페이지부터 다시 조회
     */
    function handleChangePageSize(nextSize: number): void {
        setSize(nextSize);
        void loadMembers(0, nextSize, appliedSearch);
    }

    /**
     * 회원 등록 페이지 이동
     */
    function handleMoveRegister(): void {
        navigate("/admin/member/register");
    }

    /**
     * 행 수정 버튼
     * - 수정 페이지 이동
     */
    function handleEdit(id: number): void {
        navigate(`/admin/member/edit/${id}`);
    }

    /**
     * 역할 인라인 변경
     * - 목록에 memo가 없으므로 상세 조회 후 기존 memo 유지
     * - 저장 성공 후 현재 페이지 재조회
     */
    async function handleChangeRole(
        id: number,
        role: AdminMemberRole,
    ): Promise<void> {
        try {
            const detail = await apiGetAdminMember(id);

            await apiUpdateAdminMember(id, {
                name: detail.name,
                phoneNumber: detail.phoneNumber,
                role,
                status: detail.status,
                point: detail.point,
                memo: detail.memo ?? "",
            });

            await loadMembers(page, size, appliedSearch);
        } catch (error) {
            console.error("회원 역할 변경 실패:", error);

            openModal(
                "error",
                "저장 실패",
                "회원 역할 변경에 실패했습니다.",
                "확인",
            );
        }
    }

    /**
     * 상태 인라인 변경
     * - 목록에 memo가 없으므로 상세 조회 후 기존 memo 유지
     * - 저장 성공 후 현재 페이지 재조회
     */
    async function handleChangeStatus(
        id: number,
        status: AdminMemberStatus,
    ): Promise<void> {
        try {
            const detail = await apiGetAdminMember(id);

            await apiUpdateAdminMember(id, {
                name: detail.name,
                phoneNumber: detail.phoneNumber,
                role: detail.role,
                status,
                point: detail.point,
                memo: detail.memo ?? "",
            });

            await loadMembers(page, size, appliedSearch);
        } catch (error) {
            console.error("회원 상태 변경 실패:", error);

            openModal(
                "error",
                "저장 실패",
                "회원 상태 변경에 실패했습니다.",
                "확인",
            );
        }
    }

    return (
        <div className={styles.page}>
            <MemberSearchSection
                searchType={searchType}
                keyword={keyword}
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                onChangeSearchType={setSearchType}
                onChangeKeyword={setKeyword}
                onChangeRoleFilter={setRoleFilter}
                onChangeStatusFilter={setStatusFilter}
                onSearch={handleSearch}
                onReset={handleReset}
                onMoveRegister={handleMoveRegister}
            />

            <MemberNoticeBox />

            <MemberTableSection
                members={members}
                isLoading={isLoading}
                pageSize={size}
                onChangePageSize={handleChangePageSize}
                onEdit={handleEdit}
                onChangeRole={handleChangeRole}
                onChangeStatus={handleChangeStatus}
            />

            <AdminPagination
                totalElements={totalElements}
                page={page}
                size={size}
                totalPages={totalPages}
                first={page === 0}
                last={page >= totalPages - 1}
                onChangePage={handleChangePage}
                className={styles.pagination}
                infoClassName={styles.paginationInfo}
            />
        </div>
    );
}