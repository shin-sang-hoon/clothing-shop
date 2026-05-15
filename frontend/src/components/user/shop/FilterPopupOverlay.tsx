import { useRef, useState } from "react";
import styles from "@/pages/ShopPage.module.css";

type PopupOption = {
  id: number;
  name: string;
};

type PopupGroup =
  | {
      name: string;
      tags: PopupOption[];
    }
  | {
      name: string;
      options: PopupOption[];
    };

interface Props {
  group: PopupGroup;
  tempIds: number[];
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onConfirm: () => void;
  onClose: () => void;
  productCount: number;
}

export default function FilterPopupOverlay({
  group,
  tempIds,
  onToggle,
  onSelectAll,
  onConfirm,
  onClose,
  productCount,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const allOptions = "options" in group ? group.options : group.tags;
  const options = search.trim()
    ? allOptions.filter((o) => o.name.toLowerCase().includes(search.trim().toLowerCase()))
    : allOptions;

  function handleReset() {
    options.forEach((option) => {
      if (tempIds.includes(option.id)) {
        onToggle(option.id);
      }
    });
  }

  return (
    <div
      ref={overlayRef}
      className={styles.popupOverlay}
      onClick={(event) => {
        if (event.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <h3 className={styles.popupTitle}>{group.name}</h3>
          <button type="button" className={styles.popupClose} onClick={onClose}>
            닫기
          </button>
        </div>

        <div className={styles.popupSearchWrap}>
          <input
            type="text"
            className={styles.popupSearch}
            placeholder="검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.popupBody}>
          <div className={styles.popupTagGrid}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.popupTag} ${tempIds.includes(option.id) ? styles.popupTagActive : ""}`}
                onClick={() => onToggle(option.id)}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.popupFooter}>
          <button type="button" className={styles.popupReset} onClick={handleReset}>
            선택 초기화
          </button>
          <button type="button" className={styles.popupSelectAll} onClick={onSelectAll}>
            전체 선택
          </button>
          <button type="button" className={styles.popupConfirm} onClick={onConfirm}>
            {productCount.toLocaleString()}개의 상품보기
          </button>
        </div>
      </div>
    </div>
  );
}

