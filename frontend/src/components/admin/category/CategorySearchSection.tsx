import AdminCard from "@/components/admin/common/AdminCard";
import type { CategorySearchType } from "@/shared/api/admin/categoryApi";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

/**
 * CategorySearchSectionProps
 * - 카테고리 검색 영역 props
 */
interface CategorySearchSectionProps {
  searchType: CategorySearchType;
  keyword: string;
  useYnFilter: "" | "true" | "false";
  onChangeSearchType: (value: CategorySearchType) => void;
  onChangeKeyword: (value: string) => void;
  onChangeUseYnFilter: (value: "" | "true" | "false") => void;
  onSearch: () => void;
  onReset: () => void;
}

/**
 * CategorySearchSection
 * - 카테고리 검색 영역
 * - 검색구분 셀렉트 + 검색어 + 사용여부필터
 */
export default function CategorySearchSection({
  searchType,
  keyword,
  useYnFilter,
  onChangeSearchType,
  onChangeKeyword,
  onChangeUseYnFilter,
  onSearch,
  onReset,
}: CategorySearchSectionProps) {
  return (
    <AdminCard title="검색 조건">
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={searchType}
          onChange={(event) =>
            onChangeSearchType(event.target.value as CategorySearchType)
          }
        >
          <option value="name">카테고리명</option>
          <option value="code">카테고리 코드</option>
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
          className={styles.filterSelect}
          value={useYnFilter}
          onChange={(event) =>
            onChangeUseYnFilter(event.target.value as "" | "true" | "false")
          }
        >
          <option value="">사용여부 전체</option>
          <option value="true">사용</option>
          <option value="false">미사용</option>
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
      </div>
    </AdminCard>
  );
}
