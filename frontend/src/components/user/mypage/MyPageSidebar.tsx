import styles from "@/pages/MyPage.module.css";
import { MY_INFO_MENU, SHOPPING_MENU } from "./constants";
import type { MenuKey } from "./types";

type Props = {
  menu: MenuKey;
  onChangeMenu: (menu: MenuKey) => void;
};

export default function MyPageSidebar({ menu, onChangeMenu }: Props) {
  return (
    <aside className={styles.sidebar}>
      <h1 className={styles.sidebarTitle}>마이 페이지</h1>

      <div className={styles.menuGroup}>
        <div className={styles.menuGroupLabel}>내 정보</div>
        {MY_INFO_MENU.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.menuItem} ${menu === item.key ? styles.menuItemActive : ""}`}
            onClick={() => onChangeMenu(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.menuGroup}>
        <div className={styles.menuGroupLabel}>쇼핑 정보</div>
        {SHOPPING_MENU.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.menuItem} ${menu === item.key ? styles.menuItemActive : ""}`}
            onClick={() => onChangeMenu(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
