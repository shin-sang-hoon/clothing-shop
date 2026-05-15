import AdminCard from "@/components/admin/common/AdminCard";
import type { BrandSearchForm } from "@/components/admin/brand/types";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface BrandSearchSectionProps {
  keyword: string;
  exclusiveYnFilter: BrandSearchForm["exclusiveYnFilter"];
  useYnFilter: BrandSearchForm["useYnFilter"];
  onChangeKeyword: (value: string) => void;
  onChangeExclusiveYnFilter: (value: BrandSearchForm["exclusiveYnFilter"]) => void;
  onChangeUseYnFilter: (value: BrandSearchForm["useYnFilter"]) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function BrandSearchSection({
  keyword,
  exclusiveYnFilter,
  useYnFilter,
  onChangeKeyword,
  onChangeExclusiveYnFilter,
  onChangeUseYnFilter,
  onSearch,
  onReset,
}: BrandSearchSectionProps) {
  return (
    <AdminCard title="검색 조건">
      <div className={styles.filterRow}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="브랜드명 / 브랜드 코드 검색"
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
          value={exclusiveYnFilter}
          onChange={(event) =>
            onChangeExclusiveYnFilter(
              event.target.value as BrandSearchForm["exclusiveYnFilter"],
            )
          }
        >
          <option value="">단독 여부 전체</option>
          <option value="true">단독</option>
          <option value="false">일반</option>
        </select>

        <select
          className={styles.filterSelect}
          value={useYnFilter}
          onChange={(event) =>
            onChangeUseYnFilter(event.target.value as BrandSearchForm["useYnFilter"])
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
