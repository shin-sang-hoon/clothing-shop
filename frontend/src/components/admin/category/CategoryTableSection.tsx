import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { CategoryRowEditValue } from "@/pages/admin/catalog/CategoryManagePage";
import type { AdminCategoryRow } from "@/shared/api/admin/categoryApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

const TEXT = {
  title: "\uCE74\uD14C\uACE0\uB9AC \uBAA9\uB85D",
  currentDepth: "\uD604\uC7AC",
  depthSuffix: "\uB381\uC2A4",
  empty: "\uD604\uC7AC \uB381\uC2A4\uC5D0 \uD45C\uC2DC\uD560 \uCE74\uD14C\uACE0\uB9AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  loading: "\uCE74\uD14C\uACE0\uB9AC\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.",
  depth: "\uB381\uC2A4",
  name: "\uCE74\uD14C\uACE0\uB9AC\uBA85",
  code: "\uCF54\uB4DC",
  sortOrder: "\uC815\uB82C\uC21C\uC11C",
  useYn: "\uC0AC\uC6A9\uC5EC\uBD80",
  createdAt: "\uB4F1\uB85D\uC77C",
  updatedAt: "\uC218\uC815\uC77C",
  childMove: "\uD558\uC704 \uC774\uB3D9",
  manage: "\uAD00\uB9AC",
  use: "\uC0AC\uC6A9",
  unused: "\uBBF8\uC0AC\uC6A9",
  childView: "\uD558\uC704 \uBCF4\uAE30",
  none: "\uC5C6\uC74C",
  quickSave: "\uBE60\uB978\uC800\uC7A5",
  saving: "\uC800\uC7A5 \uC911...",
  detail: "\uC0C1\uC138\uC218\uC815",
  importTags: "\uD544\uD130 \uAC00\uC838\uC624\uAE30",
  importingTags: "\uD544\uD130 \uAC00\uC838\uC624\uB294 \uC911...",
  importItems: "\uC544\uC774\uD15C \uAC00\uC838\uC624\uAE30",
  importingItems: "\uC544\uC774\uD15C \uAC00\uC838\uC624\uB294 \uC911...",
  delete: "\uC0AD\uC81C",
} as const;

function buildChildParentIdSet(categories: AdminCategoryRow[] = []): Set<number> {
  const result = new Set<number>();
  categories.forEach((category) => {
    const parentId = category.parentId ?? 0;
    if (parentId > 0) {
      result.add(parentId);
    }
  });
  return result;
}

interface CategoryTableSectionProps {
  allCategories?: AdminCategoryRow[];
  currentLevelCategories?: AdminCategoryRow[];
  currentDepth: number;
  selectedIds: number[];
  rowEdits: Record<number, CategoryRowEditValue>;
  isLoading: boolean;
  savingRowId: number | null;
  filterImportingCategoryId: number | null;
  itemImportingCategoryId: number | null;
  onChangeRow: <Key extends keyof CategoryRowEditValue>(
    categoryId: number,
    key: Key,
    value: CategoryRowEditValue[Key],
  ) => void;
  onToggleSelect: (categoryId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean, categoryIds: number[]) => void;
  onEnterChild: (category: AdminCategoryRow) => void;
  onQuickSave: (category: AdminCategoryRow) => void;
  onOpenDetail: (category: AdminCategoryRow) => void;
}

export default function CategoryTableSection({
  allCategories = [],
  currentLevelCategories = [],
  currentDepth,
  selectedIds,
  rowEdits,
  isLoading,
  savingRowId,
  onChangeRow,
  onToggleSelect,
  onToggleSelectAll,
  onEnterChild,
  onQuickSave,
  onOpenDetail,
}: CategoryTableSectionProps) {
  const childParentIdSet = buildChildParentIdSet(allCategories);
  const currentLevelIds = currentLevelCategories.map((category) => category.id);
  const isAllSelected =
    currentLevelIds.length > 0 && currentLevelIds.every((id) => selectedIds.includes(id));

  return (
    <AdminCard
      title={TEXT.title}
      actions={
        <div className={styles.levelTableHeaderTools}>
          <span className={styles.levelSummaryText}>
            {TEXT.currentDepth} {currentDepth}
            {TEXT.depthSuffix} / {currentLevelCategories.length}
            건
          </span>
        </div>
      }
    >
      {isLoading ? (
        <div className={styles.empty}>{TEXT.loading}</div>
      ) : currentLevelCategories.length === 0 ? (
        <AdminEmpty message={TEXT.empty} />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(event) =>
                    onToggleSelectAll(event.target.checked, currentLevelIds)
                  }
                />
              </th>
              <th>ID</th>
              <th>{TEXT.depth}</th>
              <th>{TEXT.name}</th>
              <th>{TEXT.code}</th>
              <th>{TEXT.sortOrder}</th>
              <th>{TEXT.useYn}</th>
              <th>{TEXT.createdAt}</th>
              <th>{TEXT.updatedAt}</th>
              <th>{TEXT.childMove}</th>
              <th>{TEXT.manage}</th>
            </tr>
          </thead>

          <tbody>
            {currentLevelCategories.map((category) => {
              const row = rowEdits[category.id];
              const hasChildren = childParentIdSet.has(category.id);
              const isSaving = savingRowId === category.id;

              return (
                <tr key={category.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={(event) =>
                        onToggleSelect(category.id, event.target.checked)
                      }
                    />
                  </td>
                  <td className={styles.idCell}>#{category.id}</td>
                  <td>
                    <span className={styles.depthBadge}>
                      {category.depth}
                      {TEXT.depthSuffix}
                    </span>
                  </td>
                  <td>
                    <input
                      className={styles.inlineInput}
                      value={row?.name ?? category.name}
                      onChange={(event) =>
                        onChangeRow(category.id, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <div className={styles.readonlyText}>{category.code}</div>
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.inlineNumberInput}
                      value={row?.sortOrder ?? category.sortOrder}
                      onChange={(event) =>
                        onChangeRow(
                          category.id,
                          "sortOrder",
                          Number(event.target.value),
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.useYn ?? category.useYn)}
                      onChange={(event) =>
                        onChangeRow(
                          category.id,
                          "useYn",
                          event.target.value === "true",
                        )
                      }
                    >
                      <option value="true">{TEXT.use}</option>
                      <option value="false">{TEXT.unused}</option>
                    </select>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDateTimeKst(category.createdAt)}
                  </td>
                  <td className={styles.dateCell}>
                    {formatDateTimeKst(category.updatedAt)}
                  </td>
                  <td>
                    {hasChildren ? (
                      <button
                        type="button"
                        className={styles.levelEnterButton}
                        onClick={() => onEnterChild(category)}
                      >
                        {TEXT.childView}
                      </button>
                    ) : (
                      <span className={styles.levelEndText}>{TEXT.none}</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(category)}
                        disabled={isSaving}
                      >
                        {isSaving ? TEXT.saving : TEXT.quickSave}
                      </button>
                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(category)}
                      >
                        {TEXT.detail}
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
