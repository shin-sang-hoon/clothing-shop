import { useState } from "react";
import type { FilterInGroupResponse } from "@/shared/api/categoryApi";
import { resolveUrl } from "@/shared/config/env";
import styles from "./ColorPickerModal.module.css";

interface Props {
  filters: FilterInGroupResponse[];
  selectedIds: number[];
  onToggle: (filterId: number) => void;
  onClose: () => void;
}

export default function ColorPickerModal({
  filters,
  selectedIds,
  onToggle,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const deduped = filters.filter(
    (filter, idx, arr) => arr.findIndex((entry) => entry.name === filter.name) === idx,
  );

  const filtered = deduped.filter((filter) =>
    filter.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>색상 선택</span>
          {selectedIds.length > 0 && (
            <span className={styles.count}>{selectedIds.length}개 선택</span>
          )}
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.search}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="색상 이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.grid}>
          {filtered.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${styles.colorItem} ${
                selectedIds.includes(filter.id) ? styles.colorItemActive : ""
              }`}
              onClick={() => onToggle(filter.id)}
            >
              {!filter.colorHex && filter.iconImageUrl ? (
                <img
                  src={resolveUrl(filter.iconImageUrl)}
                  alt={filter.name}
                  className={styles.swatchImg}
                />
              ) : (
                <span
                  className={styles.swatch}
                  style={{
                    background: filter.colorHex ?? "#e5e7eb",
                    border: filter.colorHex
                      ? "1px solid rgba(0,0,0,0.12)"
                      : "1px solid #d1d5db",
                  }}
                />
              )}
              <span className={styles.colorName}>{filter.name}</span>
              {selectedIds.includes(filter.id) && (
                <span className={styles.check}>✓</span>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>검색 결과가 없습니다.</div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
