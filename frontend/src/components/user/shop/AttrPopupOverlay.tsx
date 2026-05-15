import { useRef } from "react";
import type { CategoryDisplayFilterGroup } from "@/shared/api/categoryApi";
import styles from "@/pages/ShopPage.module.css";

interface Props {
  groups: CategoryDisplayFilterGroup[];
  tempIds: number[];
  onToggle: (id: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  productCount: number;
}

export default function AttrPopupOverlay({ groups, tempIds, onToggle, onConfirm, onClose, productCount }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  function handleReset() {
    const allIds = groups.flatMap((g) => g.filters.map((f) => f.id));
    allIds.forEach((id) => {
      if (tempIds.includes(id)) onToggle(id);
    });
  }

  return (
    <div
      ref={overlayRef}
      className={styles.popupOverlay}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <h3 className={styles.popupTitle}>속성</h3>
          <button type="button" className={styles.popupClose} onClick={onClose}>X</button>
        </div>

        <div className={styles.popupBody}>
          {groups.map((group) => (
            <div key={group.filterGroupId} className={styles.attrGroup}>
              <div className={styles.attrGroupTitle}>{group.filterGroupName}</div>
              <div className={styles.popupTagGrid}>
                {group.filters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`${styles.popupTag} ${tempIds.includes(filter.id) ? styles.popupTagActive : ""}`}
                    onClick={() => onToggle(filter.id)}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.popupFooter}>
          <button type="button" className={styles.popupReset} onClick={handleReset}>
            선택 초기화
          </button>
          <button type="button" className={styles.popupConfirm} onClick={onConfirm}>
            {productCount.toLocaleString()}개의 상품보기
          </button>
        </div>
      </div>
    </div>
  );
}
