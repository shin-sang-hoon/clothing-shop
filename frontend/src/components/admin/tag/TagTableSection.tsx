import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { TagRowEditValue } from "@/components/admin/tag/types";
import type { AdminTagRow } from "@/shared/api/admin/tagApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface TagTableSectionProps {
  tags: AdminTagRow[];
  rowEdits: Record<number, TagRowEditValue>;
  selectedIds: number[];
  isLoading: boolean;
  savingRowId: number | null;
  size: number;
  onChangePageSize: (nextSize: number) => void;
  onChangeRow: <Key extends keyof TagRowEditValue>(
    tagId: number,
    key: Key,
    value: TagRowEditValue[Key],
  ) => void;
  onToggleSelect: (tagId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onQuickToggleUse: (tag: AdminTagRow, checked: boolean) => void;
  onQuickSave: (tag: AdminTagRow) => void;
  onOpenDetail: (tag: AdminTagRow) => void;
  onDelete: (tag: AdminTagRow) => void;
}

export default function TagTableSection({
  tags,
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
}: TagTableSectionProps) {
  const isAllSelected = tags.length > 0 && selectedIds.length === tags.length;

  return (
    <AdminCard
      title="태그 목록"
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
        <AdminEmpty message="태그 목록을 불러오는 중입니다." />
      ) : tags.length === 0 ? (
        <AdminEmpty message="조회된 태그가 없습니다." />
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
              <th>태그</th>
              <th>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, gap: 2 }}>
                  <span>사용여부</span>
                  <span>정렬순서</span>
                </div>
              </th>
              <th>생성일시</th>
              <th>수정일시</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => {
              const row = rowEdits[tag.id];

              return (
                <tr key={tag.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tag.id)}
                      onChange={(event) => onToggleSelect(tag.id, event.target.checked)}
                    />
                  </td>
                  <td className={styles.idCell}>{tag.id}</td>
                  <td>
                    <div className={styles.readonlyText} style={{ marginBottom: 6 }}>
                      {tag.code}
                    </div>
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={row?.name ?? ""}
                      onChange={(event) => onChangeRow(tag.id, "name", event.target.value)}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <select
                        className={styles.inlineSelect}
                        style={{ width: 90, minWidth: 90 }}
                        value={String(row?.useYn ?? false)}
                        onChange={(event) =>
                          onQuickToggleUse(tag, event.target.value === "true")
                        }
                      >
                        <option value="true">사용</option>
                        <option value="false">미사용</option>
                      </select>
                      <input
                        type="number"
                        className={styles.inlineNumberInput}
                        value={row?.sortOrder ?? 0}
                        onChange={(event) =>
                          onChangeRow(tag.id, "sortOrder", Number(event.target.value))
                        }
                      />
                    </div>
                  </td>
                  <td className={styles.dateCell}>{formatDateTimeKst(tag.createdAt)}</td>
                  <td className={styles.dateCell}>{formatDateTimeKst(tag.updatedAt)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(tag)}
                        disabled={savingRowId === tag.id}
                      >
                        {savingRowId === tag.id ? "저장중" : "빠른저장"}
                      </button>
                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(tag)}
                      >
                        상세수정
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => onDelete(tag)}
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
