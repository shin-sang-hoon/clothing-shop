import { useState } from "react";
import type { FilterInGroupResponse } from "@/shared/api/categoryApi";
import styles from "./TagPickerModal.module.css";

interface Props {
  title: string;
  filters: FilterInGroupResponse[];
  selectedIds: number[];
  onToggle: (filterId: number) => void;
  onClose: () => void;
}

export default function TagPickerModal({ title, filters, selectedIds, onToggle, onClose }: Props) {
  const [search, setSearch] = useState("");

  const deduped = filters.filter(
    (f, idx, arr) => arr.findIndex((e) => e.name === f.name) === idx,
  );

  const filtered = deduped.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {selectedIds.length > 0 && (
            <span className={styles.count}>{selectedIds.length}개 선택</span>
          )}
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.search}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.grid}>
          {filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.tagItem} ${selectedIds.includes(f.id) ? styles.tagItemActive : ""}`}
              onClick={() => onToggle(f.id)}
            >
              <span className={styles.tagName}>{f.name}</span>
              {selectedIds.includes(f.id) && <span className={styles.check}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>검색 결과가 없습니다.</div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}
