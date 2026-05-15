import styles from "@/pages/admin/members/MemberManagePage.module.css";

/**
 * MemberPaginationSectionProps
 * - 회원 목록 페이징 영역 props
 */
interface MemberPaginationSectionProps {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    onChangePage: (page: number) => void;
}

/**
 * MemberPaginationSection
 * - 관리자 회원 목록 페이징 영역
 * - 현재 페이지 기준으로 주변 페이지 번호만 노출
 */
export default function MemberPaginationSection({
    page,
    size,
    totalPages,
    totalElements,
    onChangePage,
}: MemberPaginationSectionProps) {
    /**
     * 총 페이지가 0이면 렌더링 생략
     */
    if (totalPages === 0) {
        return null;
    }

    /**
     * 현재 페이지 기준 페이지 번호 범위 계산
     * - 현재 페이지 포함 앞뒤 2개씩 노출
     */
    const startPage = Math.max(0, page - 2);
    const endPage = Math.min(totalPages - 1, page + 2);

    const pageNumbers: number[] = [];

    for (let i = startPage; i <= endPage; i += 1) {
        pageNumbers.push(i);
    }

    /**
     * 현재 페이지 범위 텍스트
     */
    const startRow = totalElements === 0 ? 0 : page * size + 1;
    const endRow = Math.min((page + 1) * size, totalElements);

    return (
        <div className={styles.paginationWrap}>
            <div className={styles.paginationInfo}>
                총 {totalElements}건 · {startRow} - {endRow} 표시
            </div>

            <div className={styles.paginationButtons}>
                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(page - 1)}
                    disabled={page === 0}
                >
                    이전
                </button>

                {pageNumbers.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        className={`${styles.pageButton} ${pageNumber === page ? styles.pageButtonActive : ""
                            }`}
                        onClick={() => onChangePage(pageNumber)}
                    >
                        {pageNumber + 1}
                    </button>
                ))}

                <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => onChangePage(page + 1)}
                    disabled={page >= totalPages - 1}
                >
                    다음
                </button>
            </div>
        </div>
    );
}