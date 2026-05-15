import { useEffect, useMemo, useRef } from "react";
import { resolveUrl } from "@/shared/config/env";
import type { AdminItemOptionValue, AdminItemResponse } from "@/shared/api/adminApi";
import styles from "@/pages/admin/admin.module.css";
import listStyles from "@/pages/admin/products/ProductListPage.module.css";
import manageStyles from "@/pages/admin/catalog/ManagePage.module.css";

interface Props {
  items: AdminItemResponse[];
  total: number;
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  statusClass: (status: string) => string;
  kindBadgeClass: (kind: string) => string;
  selectedIds: Set<number>;
  onToggleSelect: (id: number, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
}

type FlatRow = {
  item: AdminItemResponse;
  colorOption: AdminItemOptionValue | null;
  isFirst: boolean;
  rowCount: number;
};

function buildRows(items: AdminItemResponse[]): FlatRow[] {
  const rows: FlatRow[] = [];

  for (const item of items) {
    const freeTextOptions = (item.optionItems ?? []).filter((option) => option.tagId === null);
    const isRental = item.itemMode === "RENTAL" || item.itemMode === "BOTH";

    if (isRental && freeTextOptions.length > 0) {
      freeTextOptions.forEach((option, index) => {
        rows.push({
          item,
          colorOption: option,
          isFirst: index === 0,
          rowCount: freeTextOptions.length,
        });
      });
    } else {
      rows.push({
        item,
        colorOption: null,
        isFirst: true,
        rowCount: 1,
      });
    }
  }

  return rows;
}

function ItemModeBadge({ mode }: { mode?: string | null }) {
  if (!mode) return null;

  const map: Record<string, { label: string; bg: string; color: string }> = {
    RENTAL: { label: "렌탈", bg: "#ecfdf5", color: "#047857" },
    AUCTION: { label: "입찰", bg: "#eff6ff", color: "#1d4ed8" },
    BOTH: { label: "렌탈+입찰", bg: "#fdf4ff", color: "#9333ea" },
  };

  const style = map[mode];
  if (!style) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 7px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        marginTop: 3,
      }}
    >
      {style.label}
    </span>
  );
}

export default function ProductListTable({
  items,
  total,
  loading,
  onEdit,
  onDelete,
  statusClass,
  kindBadgeClass,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const masterRef = useRef<HTMLInputElement | null>(null);

  const { allChecked, someChecked } = useMemo(() => {
    if (items.length === 0) {
      return { allChecked: false, someChecked: false };
    }

    const checkedCount = items.reduce((count, item) => {
      return count + (selectedIds.has(item.id) ? 1 : 0);
    }, 0);

    return {
      allChecked: checkedCount === items.length,
      someChecked: checkedCount > 0 && checkedCount < items.length,
    };
  }, [items, selectedIds]);

  useEffect(() => {
    if (!masterRef.current) return;
    masterRef.current.indeterminate = !allChecked && someChecked;
  }, [allChecked, someChecked]);

  const rows = buildRows(items);

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeader}>
        <span className={styles.tableCount}>
          총 <strong>{total}</strong>건
        </span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 42 }}>
              <input
                ref={masterRef}
                type="checkbox"
                checked={allChecked}
                onChange={(event) => onToggleSelectAll(event.target.checked)}
                aria-label="전체 선택"
              />
            </th>
            <th>ID</th>
            <th>상품</th>
            <th>종류</th>
            <th>카테고리</th>
            <th>가격</th>
            <th>색상/재고</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={9} className={styles.empty}>
                불러오는 중...
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={9} className={styles.empty}>
                데이터가 없습니다.
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((row) => {
              const { item, colorOption, isFirst, rowCount } = row;
              const key = colorOption ? `${item.id}-${colorOption.id}` : `${item.id}`;

              return (
                <tr key={key}>
                  {isFirst && (
                    <td rowSpan={rowCount}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={(event) => onToggleSelect(item.id, event.target.checked)}
                        aria-label={`상품 선택 ${item.id}`}
                      />
                    </td>
                  )}

                  {isFirst && (
                    <td className={listStyles.idCell} rowSpan={rowCount}>
                      #{item.id}
                    </td>
                  )}

                  {isFirst && (
                    <td rowSpan={rowCount}>
                      <div className={listStyles.productCell}>
                        {item.img ? (
                          <img
                            src={resolveUrl(item.img)}
                            alt={item.name}
                            className={listStyles.productThumb}
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <div
                            className={listStyles.productThumb}
                            style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 4 }}
                          />
                        )}

                        <div>
                          <div className={listStyles.productName}>{item.name}</div>
                          <div className={listStyles.productBrand}>{item.brand}</div>
                        </div>
                      </div>
                    </td>
                  )}

                  {isFirst && (
                    <td rowSpan={rowCount}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 3,
                        }}
                      >
                        <span className={`${listStyles.badge} ${listStyles[kindBadgeClass(item.kind)]}`}>
                          {item.kind}
                        </span>
                        <ItemModeBadge mode={item.itemMode} />
                      </div>
                    </td>
                  )}

                  {isFirst && <td rowSpan={rowCount}>{item.category}</td>}

                  {isFirst && (
                    <td className={listStyles.priceCell} rowSpan={rowCount}>
                      {item.retailPrice.toLocaleString()}원
                    </td>
                  )}

                  <td>
                    {colorOption ? (
                      <span style={{ fontSize: 13, color: "#374151" }}>
                        <strong>{colorOption.name}</strong>
                        <span style={{ color: "#6b7280", marginLeft: 4 }}>{colorOption.quantity}개</span>
                      </span>
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: 13 }}>-</span>
                    )}
                  </td>

                  {isFirst && (
                    <td rowSpan={rowCount}>
                      <span className={`${listStyles.statusBadge} ${listStyles[statusClass(item.status)]}`}>
                        {item.status}
                      </span>
                    </td>
                  )}

                  {isFirst && (
                    <td rowSpan={rowCount}>
                      <div className={manageStyles.tableActions}>
                        <button
                          type="button"
                          className={manageStyles.detailActionButton}
                          onClick={() => onEdit(item.id)}
                        >
                          상세/수정
                        </button>
                        <button
                          type="button"
                          className={manageStyles.deleteButton}
                          onClick={() => onDelete(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
