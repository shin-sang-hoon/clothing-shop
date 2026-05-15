import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { FilterRowEditValue } from "@/components/admin/filter/types";
import type { AdminFilterRow } from "@/shared/api/admin/filterApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface FilterTableSectionProps {
  filters: AdminFilterRow[];
  rowEdits: Record<number, FilterRowEditValue>;
  selectedIds: number[];
  isLoading: boolean;
  savingRowId: number | null;
  size: number;
  onChangePageSize: (nextSize: number) => void;
  onChangeRow: <Key extends keyof FilterRowEditValue>(
    filterId: number,
    key: Key,
    value: FilterRowEditValue[Key],
  ) => void;
  onToggleSelect: (filterId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onQuickToggleUse: (filter: AdminFilterRow, checked: boolean) => void;
  onQuickSave: (filter: AdminFilterRow) => void;
  onOpenDetail: (filter: AdminFilterRow) => void;
  onDelete: (filter: AdminFilterRow) => void;
}

export default function FilterTableSection({
  filters,
  rowEdits,
  selectedIds,
  isLoading,
  savingRowId,
  size,
  onChangePageSize,
  onChangeRow,
  onToggleSelect,
  onToggleSelectAll,
  onQuickToggleUse,
  onQuickSave,
  onOpenDetail,
  onDelete,
}: FilterTableSectionProps) {
  const isAllSelected = filters.length > 0 && selectedIds.length === filters.length;

  return (
    <AdminCard
      title="필터 목록"
      actions={
        <div className={styles.tableHeaderTools}>
          <label className={styles.pageSizeLabel}>목록 개수</label>
          <select
            className={styles.pageSizeSelect}
            value={size}
            onChange={(event) => onChangePageSize(Number(event.target.value))}
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
      }
    >
      {isLoading ? (
        <AdminEmpty message="필터 목록을 불러오는 중입니다." />
      ) : filters.length === 0 ? (
        <AdminEmpty message="조회된 필터가 없습니다." />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>필터 그룹</th>
              <th>필터 코드</th>
              <th>필터명</th>
              <th>정렬순서</th>
              <th>사용 여부</th>
              <th>생성일시</th>
              <th>수정일시</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filters.map((filter) => {
              const row = rowEdits[filter.id];
              return (
                <tr key={filter.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(filter.id)}
                      onChange={(event) => onToggleSelect(filter.id, event.target.checked)}
                    />
                  </td>
                  <td className={styles.idCell}>{filter.id}</td>
                  <td><div className={styles.readonlyText}>{filter.filterGroupName}</div></td>
                  <td><div className={styles.readonlyText}>{filter.code}</div></td>
                  <td>
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={row?.name ?? ""}
                      onChange={(event) => onChangeRow(filter.id, "name", event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.inlineNumberInput}
                      value={row?.sortOrder ?? 0}
                      onChange={(event) =>
                        onChangeRow(filter.id, "sortOrder", Number(event.target.value))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.useYn ?? false)}
                      onChange={(event) =>
                        onQuickToggleUse(filter, event.target.value === "true")
                      }
                    >
                      <option value="true">사용</option>
                      <option value="false">미사용</option>
                    </select>
                  </td>
                  <td className={styles.dateCell}>{formatDateTimeKst(filter.createdAt)}</td>
                  <td className={styles.dateCell}>{formatDateTimeKst(filter.updatedAt)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(filter)}
                        disabled={savingRowId === filter.id}
                      >
                        {savingRowId === filter.id ? "저장 중" : "빠른저장"}
                      </button>
                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(filter)}
                      >
                        상세수정
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => onDelete(filter)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </AdminCard>
  );
}
