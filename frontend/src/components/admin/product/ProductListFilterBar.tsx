import type { ProductKind, ProductStatus } from "@/pages/admin/mock/adminMockData";
import styles from "@/pages/admin/admin.module.css";
import listStyles from "@/pages/admin/products/ProductListPage.module.css";
import type { CategoryFilterGroupResponse, PublicCategoryItem } from "@/shared/api/categoryApi";

interface Props {
  keyword: string;
  kindFilter: string;
  statusFilter: string;
  itemModeFilter: string;
  kindOptions: ProductKind[];
  statusOptions: ProductStatus[];
  onKeywordChange: (value: string) => void;
  onKindFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onItemModeFilterChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  categories: PublicCategoryItem[];
  categoryId: number | "";
  onCategoryChange: (value: number | "") => void;
  filterGroups: CategoryFilterGroupResponse[];
  filterGroupId: number | "";
  onFilterGroupChange: (value: number | "") => void;
  tagId: number | "";
  onTagChange: (value: number | "") => void;
  selectedFilterGroup?: CategoryFilterGroupResponse;
}

export default function ProductListFilterBar({
  keyword,
  kindFilter,
  statusFilter,
  itemModeFilter,
  kindOptions,
  statusOptions,
  onKeywordChange,
  onKindFilterChange,
  onStatusFilterChange,
  onItemModeFilterChange,
  onSearch,
  onReset,
  categories,
  categoryId,
  onCategoryChange,
  filterGroups,
  filterGroupId,
  onFilterGroupChange,
  tagId,
  onTagChange,
  selectedFilterGroup,
}: Props) {
  const depth1Categories = categories.filter((c) => c.depth === 1);
  const depth2Categories = categories.filter((c) => c.depth === 2);

  return (
    <div className={listStyles.filterRow}>
      <input
        className={listStyles.searchInput}
        placeholder="상품명, 브랜드 검색"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
      />

      <select
        className={listStyles.filterSelect}
        value={kindFilter}
        onChange={(e) => onKindFilterChange(e.target.value)}
      >
        <option value="">종류 전체</option>
        {kindOptions.map((kind) => (
          <option key={kind}>{kind}</option>
        ))}
      </select>

      <select
        className={listStyles.filterSelect}
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
      >
        <option value="">상태 전체</option>
        {statusOptions.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>

      <select
        className={listStyles.filterSelect}
        value={itemModeFilter}
        onChange={(e) => onItemModeFilterChange(e.target.value)}
      >
        <option value="">거래방식 전체</option>
        <option value="RENTAL">렌탈거래</option>
        <option value="AUCTION">입찰거래</option>
        <option value="BOTH">렌탈+입찰</option>
      </select>

      <select
        className={listStyles.filterSelect}
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">카테고리 전체</option>
        {depth1Categories.map((d1) => (
          <optgroup key={d1.id} label={d1.name}>
            <option value={d1.id}>{d1.name} 전체</option>
            {depth2Categories
              .filter((d2) => d2.parentId === d1.id)
              .map((d2) => (
                <option key={d2.id} value={d2.id}>
                  {d2.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      {filterGroups.length > 0 && (
        <select
          className={listStyles.filterSelect}
          value={filterGroupId}
          onChange={(e) => onFilterGroupChange(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">필터그룹 전체</option>
          {filterGroups.map((group) => (
            <option key={group.filterGroupId} value={group.filterGroupId}>
              {group.filterGroupName}
            </option>
          ))}
        </select>
      )}

      {selectedFilterGroup && selectedFilterGroup.filters.length > 0 && (
        <select
          className={listStyles.filterSelect}
          value={tagId}
          onChange={(e) => onTagChange(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">필터 전체</option>
          {selectedFilterGroup.filters.map((filter) => (
            <option key={filter.id} value={filter.id}>
              {filter.name}
            </option>
          ))}
        </select>
      )}

      <button type="button" className={styles.btnPrimary} onClick={onSearch}>
        검색
      </button>
      <button type="button" className={styles.btnSecondary} onClick={onReset}>
        초기화
      </button>
    </div>
  );
}
