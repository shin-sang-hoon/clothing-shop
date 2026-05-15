import AdminCard from "@/components/admin/common/AdminCard";
import type { TagGroupSearchForm } from "@/components/admin/tagGroup/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface TagGroupSearchSectionProps {
  keyword: string;
  multiSelectYnFilter: TagGroupSearchForm["multiSelectYnFilter"];
  useYnFilter: TagGroupSearchForm["useYnFilter"];
  onChangeKeyword: (value: string) => void;
  onChangeMultiSelectYnFilter: (value: TagGroupSearchForm["multiSelectYnFilter"]) => void;
  onChangeUseYnFilter: (value: TagGroupSearchForm["useYnFilter"]) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function TagGroupSearchSection({
  keyword,
  multiSelectYnFilter,
  useYnFilter,
  onChangeKeyword,
  onChangeMultiSelectYnFilter,
  onChangeUseYnFilter,
  onSearch,
  onReset,
}: TagGroupSearchSectionProps) {
  return (
    <AdminCard title="검색 조건">
      <div className={styles.filterRow}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="그룹명 / 그룹 코드 검색"
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
          value={multiSelectYnFilter}
          onChange={(event) =>
            onChangeMultiSelectYnFilter(event.target.value as TagGroupSearchForm["multiSelectYnFilter"])
          }
        >
          <option value="">선택 방식 전체</option>
          <option value="true">다중 선택</option>
          <option value="false">단일 선택</option>
        </select>

        <select
          className={styles.filterSelect}
          value={useYnFilter}
          onChange={(event) => onChangeUseYnFilter(event.target.value as TagGroupSearchForm["useYnFilter"])}
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
