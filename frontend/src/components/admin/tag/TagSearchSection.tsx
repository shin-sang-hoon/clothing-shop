import AdminCard from "@/components/admin/common/AdminCard";
import type { TagSearchForm } from "@/components/admin/tag/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface TagSearchSectionProps {
  keyword: string;
  useYnFilter: TagSearchForm["useYnFilter"];
  onChangeKeyword: (value: string) => void;
  onChangeUseYnFilter: (value: TagSearchForm["useYnFilter"]) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function TagSearchSection({
  keyword,
  useYnFilter,
  onChangeKeyword,
  onChangeUseYnFilter,
  onSearch,
  onReset,
}: TagSearchSectionProps) {
  return (
    <AdminCard title="검색 조건">
      <div className={styles.filterRow}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="태그명 / 태그 코드 검색"
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
            onChangeUseYnFilter(event.target.value as TagSearchForm["useYnFilter"])
          }
        >
          <option value="">사용 여부 전체</option>
          <option value="true">사용</option>
          <option value="false">미사용</option>
        </select>

        <button type="button" className={styles.searchButton} onClick={onSearch}>
          검색
        </button>

        <button type="button" className={styles.resetButton} onClick={onReset}>
          초기화
        </button>
      </div>
    </AdminCard>
  );
}
