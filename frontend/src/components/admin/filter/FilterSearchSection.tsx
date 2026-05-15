import AdminCard from "@/components/admin/common/AdminCard";
import type { FilterSearchForm } from "@/components/admin/filter/types";
import type { AdminFilterGroupRow } from "@/shared/api/admin/filterGroupApi";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface FilterSearchSectionProps {
  filterGroups: AdminFilterGroupRow[];
  filterGroupIdFilter: FilterSearchForm["filterGroupIdFilter"];
  keyword: string;
  useYnFilter: FilterSearchForm["useYnFilter"];
  onChangeFilterGroupIdFilter: (value: FilterSearchForm["filterGroupIdFilter"]) => void;
  onChangeKeyword: (value: string) => void;
  onChangeUseYnFilter: (value: FilterSearchForm["useYnFilter"]) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function FilterSearchSection({
  filterGroups,
  filterGroupIdFilter,
  keyword,
  useYnFilter,
  onChangeFilterGroupIdFilter,
  onChangeKeyword,
  onChangeUseYnFilter,
  onSearch,
  onReset,
}: FilterSearchSectionProps) {
  return (
    <AdminCard title="검색 조건">
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={filterGroupIdFilter}
          onChange={(event) =>
            onChangeFilterGroupIdFilter(
              event.target.value === "" ? "" : Number(event.target.value),
            )
          }
        >
          <option value="">전체 그룹</option>
          {filterGroups.map((filterGroup) => (
            <option key={filterGroup.id} value={filterGroup.id}>
              {filterGroup.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="필터명 또는 필터 코드 검색"
          value={keyword}
          onChange={(event) => onChangeKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearch();
          }}
        />

        <select
          className={styles.filterSelect}
          value={useYnFilter}
          onChange={(event) =>
            onChangeUseYnFilter(event.target.value as FilterSearchForm["useYnFilter"])
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
