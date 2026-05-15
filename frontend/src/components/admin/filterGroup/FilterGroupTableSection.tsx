import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { FilterGroupRowEditValue } from "@/components/admin/filterGroup/types";
import type { AdminFilterGroupRow } from "@/shared/api/admin/filterGroupApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface FilterGroupTableSectionProps {
  filterGroups: AdminFilterGroupRow[];
  rowEdits: Record<number, FilterGroupRowEditValue>;
  selectedIds: number[];
  isLoading: boolean;
  savingRowId: number | null;
  size: number;
  onChangePageSize: (nextSize: number) => void;
  onChangeRow: <Key extends keyof FilterGroupRowEditValue>(
    filterGroupId: number,
    key: Key,
    value: FilterGroupRowEditValue[Key],
  ) => void;
  onToggleSelect: (filterGroupId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onQuickToggleUse: (filterGroup: AdminFilterGroupRow, checked: boolean) => void;
  onQuickSave: (filterGroup: AdminFilterGroupRow) => void;
  onOpenDetail: (filterGroup: AdminFilterGroupRow) => void;
  onMoveFilters: (filterGroup: AdminFilterGroupRow) => void;
  onDelete: (filterGroup: AdminFilterGroupRow) => void;
}

function getRoleLabel(role: AdminFilterGroupRow["role"]) {
  if (role === "ATTRIBUTE") return "속성";
  if (role === "OPTION") return "옵션";
  return "공통";
}

export default function FilterGroupTableSection({
  filterGroups,
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
  onMoveFilters,
  onDelete,
}: FilterGroupTableSectionProps) {
  const isAllSelected =
    filterGroups.length > 0 && selectedIds.length === filterGroups.length;

  return (
    <AdminCard
      title="필터 그룹 목록"
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
        <AdminEmpty message="필터 그룹 목록을 불러오는 중입니다." />
      ) : filterGroups.length === 0 ? (
        <AdminEmpty message="조회된 필터 그룹이 없습니다." />
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
              <th>그룹 코드</th>
              <th>그룹명</th>
              <th>선택 방식</th>
              <th>역할</th>
              <th>정렬순서</th>
              <th>사용 여부</th>
              <th>생성일시</th>
              <th>수정일시</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filterGroups.map((filterGroup) => {
              const row = rowEdits[filterGroup.id];
              return (
                <tr key={filterGroup.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(filterGroup.id)}
                      onChange={(event) =>
                        onToggleSelect(filterGroup.id, event.target.checked)
                      }
                    />
                  </td>
                  <td className={styles.idCell}>{filterGroup.id}</td>
                  <td><div className={styles.readonlyText}>{filterGroup.code}</div></td>
                  <td>
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={row?.name ?? ""}
                      onChange={(event) =>
                        onChangeRow(filterGroup.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.multiSelectYn ?? true)}
                      onChange={(event) =>
                        onChangeRow(
                          filterGroup.id,
                          "multiSelectYn",
                          event.target.value === "true",
                        )
                      }
                    >
                      <option value="true">다중 선택</option>
                      <option value="false">단일 선택</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={row?.role ?? "ALL"}
                      onChange={(event) =>
                        onChangeRow(
                          filterGroup.id,
                          "role",
                          event.target.value as FilterGroupRowEditValue["role"],
                        )
                      }
                    >
                      <option value="ATTRIBUTE">속성</option>
                      <option value="OPTION">옵션</option>
                      <option value="ALL">공통</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.inlineNumberInput}
                      value={row?.sortOrder ?? 0}
                      onChange={(event) =>
                        onChangeRow(filterGroup.id, "sortOrder", Number(event.target.value))
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.useYn ?? false)}
                      onChange={(event) =>
                        onQuickToggleUse(filterGroup, event.target.value === "true")
                      }
                    >
                      <option value="true">사용</option>
                      <option value="false">미사용</option>
                    </select>
                  </td>
                  <td className={styles.dateCell}>{formatDateTimeKst(filterGroup.createdAt)}</td>
                  <td className={styles.dateCell}>{formatDateTimeKst(filterGroup.updatedAt)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(filterGroup)}
                        disabled={savingRowId === filterGroup.id}
                      >
                        {savingRowId === filterGroup.id ? "저장 중" : "빠른저장"}
                      </button>
                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(filterGroup)}
                      >
                        상세수정
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onMoveFilters(filterGroup)}
                      >
                        필터 이동
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => onDelete(filterGroup)}
                        title={`${getRoleLabel(filterGroup.role)} 필터 그룹 삭제`}
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
