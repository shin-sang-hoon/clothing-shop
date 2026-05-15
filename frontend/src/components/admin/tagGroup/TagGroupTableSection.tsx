import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { TagGroupRowEditValue } from "@/components/admin/tagGroup/types";
import type { AdminTagGroupRow } from "@/shared/api/admin/tagGroupApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface TagGroupTableSectionProps {
  tagGroups: AdminTagGroupRow[];
  rowEdits: Record<number, TagGroupRowEditValue>;
  selectedIds: number[];
  isLoading: boolean;
  savingRowId: number | null;
  size: number;
  onChangePageSize: (nextSize: number) => void;
  onChangeRow: <Key extends keyof TagGroupRowEditValue>(
    tagGroupId: number,
    key: Key,
    value: TagGroupRowEditValue[Key],
  ) => void;
  onToggleSelect: (tagGroupId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onQuickToggleUse: (tagGroup: AdminTagGroupRow, checked: boolean) => void;
  onQuickSave: (tagGroup: AdminTagGroupRow) => void;
  onOpenDetail: (tagGroup: AdminTagGroupRow) => void;
  onMoveTags: (tagGroup: AdminTagGroupRow) => void;
  onDelete: (tagGroup: AdminTagGroupRow) => void;
}

function getRoleLabel(role: AdminTagGroupRow["role"]) {
  switch (role) {
    case "ATTRIBUTE":
      return "속성";
    case "OPTION":
      return "옵션";
    case "ALL":
    default:
      return "공통";
  }
}

export default function TagGroupTableSection({
  tagGroups,
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
  onMoveTags,
  onDelete,
}: TagGroupTableSectionProps) {
  const isAllSelected = tagGroups.length > 0 && selectedIds.length === tagGroups.length;

  return (
    <AdminCard
      title="태그그룹 목록"
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
        <AdminEmpty message="태그그룹 목록을 불러오는 중입니다." />
      ) : tagGroups.length === 0 ? (
        <AdminEmpty message="조회된 태그그룹이 없습니다." />
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
            {tagGroups.map((tagGroup) => {
              const row = rowEdits[tagGroup.id];

              return (
                <tr key={tagGroup.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tagGroup.id)}
                      onChange={(event) => onToggleSelect(tagGroup.id, event.target.checked)}
                    />
                  </td>

                  <td className={styles.idCell}>{tagGroup.id}</td>
                  <td>
                    <div className={styles.readonlyText}>{tagGroup.code}</div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={row?.name ?? ""}
                      onChange={(event) => onChangeRow(tagGroup.id, "name", event.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.multiSelectYn ?? true)}
                      onChange={(event) =>
                        onChangeRow(tagGroup.id, "multiSelectYn", event.target.value === "true")
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
                        onChangeRow(tagGroup.id, "role", event.target.value as TagGroupRowEditValue["role"])
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
                      onChange={(event) => onChangeRow(tagGroup.id, "sortOrder", Number(event.target.value))}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.useYn ?? false)}
                      onChange={(event) => onQuickToggleUse(tagGroup, event.target.value === "true")}
                    >
                      <option value="true">사용</option>
                      <option value="false">미사용</option>
                    </select>
                  </td>
                  <td className={styles.dateCell}>{formatDateTimeKst(tagGroup.createdAt)}</td>
                  <td className={styles.dateCell}>{formatDateTimeKst(tagGroup.updatedAt)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(tagGroup)}
                        disabled={savingRowId === tagGroup.id}
                      >
                        {savingRowId === tagGroup.id ? "저장 중.." : "빠른저장"}
                      </button>
                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(tagGroup)}
                      >
                        상세수정
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onMoveTags(tagGroup)}
                      >
                        하위 이동
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => onDelete(tagGroup)}
                        title={`${getRoleLabel(tagGroup.role)} 태그그룹 삭제`}
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
