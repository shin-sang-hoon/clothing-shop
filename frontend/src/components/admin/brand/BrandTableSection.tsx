import AdminCard from "@/components/admin/common/AdminCard";
import AdminEmpty from "@/components/admin/common/AdminEmpty";
import AdminTable from "@/components/admin/common/AdminTable";
import type { BrandRowEditValue } from "@/components/admin/brand/types";
import type { AdminBrandRow } from "@/shared/api/admin/brandApi";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

interface BrandTableSectionProps {
  brands: AdminBrandRow[];
  rowEdits: Record<number, BrandRowEditValue>;
  selectedIds: number[];
  isLoading: boolean;
  savingRowId: number | null;
  size: number;
  onChangePageSize: (nextSize: number) => void;
  onChangeRow: <Key extends keyof BrandRowEditValue>(
    brandId: number,
    key: Key,
    value: BrandRowEditValue[Key],
  ) => void;
  onToggleSelect: (brandId: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onQuickToggleUse: (brand: AdminBrandRow, checked: boolean) => void;
  onQuickSave: (brand: AdminBrandRow) => void;
  onOpenDetail: (brand: AdminBrandRow) => void;
  onDelete: (brand: AdminBrandRow) => void;
}

export default function BrandTableSection({
  brands,
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
}: BrandTableSectionProps) {
  const isAllSelected = brands.length > 0 && selectedIds.length === brands.length;

  return (
    <AdminCard
      title="브랜드 목록"
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
        <AdminEmpty message="브랜드 목록을 불러오는 중입니다." />
      ) : brands.length === 0 ? (
        <AdminEmpty message="조회된 브랜드가 없습니다." />
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
              <th>브랜드 코드</th>
              <th>브랜드명</th>
              <th>단독 여부</th>
              <th>정렬 / 사용여부</th>
              <th>일시</th>
              <th>관리</th>
            </tr>
          </thead>

          <tbody>
            {brands.map((brand) => {
              const row = rowEdits[brand.id];

              return (
                <tr key={brand.id}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(brand.id)}
                      onChange={(event) => onToggleSelect(brand.id, event.target.checked)}
                    />
                  </td>

                  <td className={styles.idCell}>{brand.id}</td>

                  <td>
                    <div className={styles.readonlyText}>{brand.code}</div>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        type="text"
                        className={styles.inlineInput}
                        value={row?.nameKo ?? ""}
                        placeholder="국문명"
                        onChange={(event) =>
                          onChangeRow(brand.id, "nameKo", event.target.value)
                        }
                      />
                      <input
                        type="text"
                        className={styles.inlineInput}
                        value={row?.nameEn ?? ""}
                        placeholder="영문명"
                        onChange={(event) =>
                          onChangeRow(brand.id, "nameEn", event.target.value)
                        }
                      />
                    </div>
                  </td>

                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={String(row?.exclusiveYn ?? false)}
                      onChange={(event) =>
                        onChangeRow(
                          brand.id,
                          "exclusiveYn",
                          event.target.value === "true",
                        )
                      }
                    >
                      <option value="false">일반</option>
                      <option value="true">단독</option>
                    </select>
                  </td>

                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        type="number"
                        className={styles.inlineNumberInput}
                        value={row?.sortOrder ?? 0}
                        onChange={(event) =>
                          onChangeRow(brand.id, "sortOrder", Number(event.target.value))
                        }
                      />
                      <select
                        className={styles.inlineSelect}
                        value={String(row?.useYn ?? false)}
                        onChange={(event) =>
                          onQuickToggleUse(brand, event.target.value === "true")
                        }
                      >
                        <option value="true">사용</option>
                        <option value="false">미사용</option>
                      </select>
                    </div>
                  </td>

                  <td className={styles.dateCell}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span>{formatDateTimeKst(brand.createdAt)}</span>
                      <span>{formatDateTimeKst(brand.updatedAt)}</span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onQuickSave(brand)}
                        disabled={savingRowId === brand.id}
                      >
                        {savingRowId === brand.id ? "저장중" : "빠른저장"}
                      </button>

                      <button
                        type="button"
                        className={styles.detailActionButton}
                        onClick={() => onOpenDetail(brand)}
                      >
                        상세수정
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
