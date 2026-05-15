import { useState } from "react";
import type { FilterInGroupResponse } from "@/shared/api/categoryApi";
import styles from "./LineupPickerModal.module.css";

interface Props {
  filters: FilterInGroupResponse[];
  selectedIds: number[];
  onToggle: (filterId: number) => void;
  onClose: () => void;
}

export default function LineupPickerModal({
  filters,
  selectedIds,
  onToggle,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = filters.filter((filter) =>
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
          <span className={styles.title}>라인 선택</span>
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
            placeholder="라인 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {filtered.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${styles.item} ${
                selectedIds.includes(filter.id) ? styles.itemActive : ""
              }`}
              onClick={() => onToggle(filter.id)}
            >
              <span className={styles.itemName}>{filter.name}</span>
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
