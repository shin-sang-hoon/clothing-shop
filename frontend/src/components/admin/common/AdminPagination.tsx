import styles from "./AdminPagination.module.css";

/**
 * AdminPaginationProps
 * - 공통 페이징 props
 */
interface AdminPaginationProps {
    /**
     * 전체 건수
     */
    totalElements: number;

    /**
     * 현재 페이지(0-based)
     */
    page?: number;

    /**
     * 페이지 크기
     */
    size?: number;

    /**
     * 전체 페이지 수
     */
    totalPages?: number;

    /**
     * 첫 페이지 여부
     */
    first?: boolean;

    /**
     * 마지막 페이지 여부
     */
    last?: boolean;

    /**
     * 페이지 변경 이벤트
     */
    onChangePage?: (page: number) => void;

    /**
     * 페이지당 개수 변경 이벤트
     */
    onChangePageSize?: (size: number) => void;

    /**
     * 페이지당 개수 선택 옵션
     */
    sizeOptions?: number[];

    /**
     * 페이지별 스타일 주입
     * - CSS Module override 용
     */
    className?: string;
    infoClassName?: string;
    buttonsClassName?: string;
    buttonClassName?: string;
    activeButtonClassName?: string;
}

/**
 * AdminPagination
 * - 공통 페이징 컴포넌트
 * - pageable 응답 기반 페이지 버튼 렌더링
 * - 페이지당 개수 select 지원
 */
export default function AdminPagination({
    totalElements,
    page,
    size,
    totalPages,
    first,
    last,
    onChangePage,
    onChangePageSize,
    sizeOptions = [10, 20, 50, 100],
    className,
    infoClassName,
    buttonsClassName,
    buttonClassName,
    activeButtonClassName,
}: AdminPaginationProps) {
    /**
     * pageable 여부
     */
    const isPageable =
        typeof page === "number" &&
        typeof size === "number" &&
        typeof totalPages === "number" &&
        typeof onChangePage === "function";

    /**
     * pageable 데이터가 없으면 총 건수만 렌더링
     */
    if (!isPageable) {
        return (
            <div className={`${styles.wrapper} ${className ?? ""}`}>
                <div className={`${styles.info} ${infoClassName ?? ""}`}>
                    총 {totalElements}건
                </div>
            </div>
        );
    }

    /**
     * 전체 페이지가 0이면 건수 정보만 노출
     */
    if (totalPages === 0) {
        return (
            <div className={`${styles.wrapper} ${className ?? ""}`}>
                <div className={`${styles.info} ${infoClassName ?? ""}`}>
                    총 0건
                </div>

                {typeof onChangePageSize === "function" && (
                    <div className={styles.buttons}>
                        <select
                            className={styles.button}
                            value={size}
                            onChange={(event) =>
                                onChangePageSize(Number(event.target.value))
                            }
                        >
                            {sizeOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}개씩
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        );
    }

    /**
     * 현재 페이지 기준 노출 범위
     * - 앞뒤 2개씩 노출
     */
    const startPage = Math.max(0, page - 2);
    const endPage = Math.min(totalPages - 1, page + 2);

    const pageNumbers: number[] = [];
    for (let i = startPage; i <= endPage; i += 1) {
        pageNumbers.push(i);
    }

    /**
     * 현재 표시 범위 텍스트
     */
    const startRow = totalElements === 0 ? 0 : page * size + 1;
    const endRow = Math.min((page + 1) * size, totalElements);

    return (
        <div className={`${styles.wrapper} ${className ?? ""}`}>
            <div className={`${styles.info} ${infoClassName ?? ""}`}>
                총 {totalElements}건 · {startRow} - {endRow} 표시
            </div>

            <div className={`${styles.buttons} ${buttonsClassName ?? ""}`}>
                {typeof onChangePageSize === "function" && (
                    <select
                        className={`${styles.button} ${buttonClassName ?? ""}`}
                        value={size}
                        onChange={(event) =>
                            onChangePageSize(Number(event.target.value))
                        }
                    >
                        {sizeOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}개씩
                            </option>
                        ))}
                    </select>
                )}

                <button
                    type="button"
                    className={`${styles.button} ${buttonClassName ?? ""}`}
                    onClick={() => onChangePage(page - 1)}
                    disabled={first ?? page === 0}
                >
                    이전
                </button>

                {pageNumbers.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        className={`${styles.button} ${
                            pageNumber === page ? styles.buttonActive : ""
                        } ${buttonClassName ?? ""} ${
                            pageNumber === page ? activeButtonClassName ?? "" : ""
                        }`}
                        onClick={() => onChangePage(pageNumber)}
                    >
                        {pageNumber + 1}
                    </button>
                ))}

                <button
                    type="button"
                    className={`${styles.button} ${buttonClassName ?? ""}`}
                    onClick={() => onChangePage(page + 1)}
                    disabled={last ?? page >= totalPages - 1}
                >
                    다음
                </button>
            </div>
        </div>
    );
}