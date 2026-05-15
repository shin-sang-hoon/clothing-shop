import listStyles from "@/pages/admin/products/ProductListPage.module.css";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  size: number;
  onChangeSize: (nextSize: number) => void;
  onChangePage: (next: number) => void;
}

export default function ProductListPagination({
  page,
  totalPages,
  total,
  size,
  onChangeSize,
  onChangePage,
}: Props) {
  const safeTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(page, 0), safeTotalPages - 1);
  const groupSize = 5;
  const groupStart = Math.floor(currentPage / groupSize) * groupSize;
  const groupEnd = Math.min(groupStart + groupSize, safeTotalPages);
  const visiblePages = Array.from({ length: groupEnd - groupStart }, (_, index) => groupStart + index);

  return (
    <div className={listStyles.paginationWrap}>
      <span className={listStyles.paginationInfo}>
        {currentPage + 1} / {safeTotalPages} 페이지, 총 {total}건
      </span>
      <div className={listStyles.paginationButtons}>
        <button
          type="button"
          className={listStyles.pageButton}
          disabled={currentPage === 0}
          onClick={() => onChangePage(0)}
        >
          {"<<"}
        </button>
        <button
          type="button"
          className={listStyles.pageButton}
          disabled={currentPage === 0}
          onClick={() => onChangePage(currentPage - 1)}
        >
          {"<"}
        </button>
        {visiblePages.map((pageIndex) => (
          <button
            key={pageIndex}
            type="button"
            className={`${listStyles.pageButton} ${currentPage === pageIndex ? listStyles.pageButtonActive : ""}`}
            onClick={() => onChangePage(pageIndex)}
          >
            {pageIndex + 1}
          </button>
        ))}
        <button
          type="button"
          className={listStyles.pageButton}
          disabled={currentPage >= safeTotalPages - 1}
          onClick={() => onChangePage(currentPage + 1)}
        >
          {">"}
        </button>
        <button
          type="button"
          className={listStyles.pageButton}
          disabled={currentPage >= safeTotalPages - 1}
          onClick={() => onChangePage(safeTotalPages - 1)}
        >
          {">>"}
        </button>
        <select
          className={listStyles.filterSelect}
          value={size}
          onChange={(event) => onChangeSize(Number(event.target.value))}
          aria-label="페이지당 개수"
        >
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
        </select>
      </div>
    </div>
  );
}
