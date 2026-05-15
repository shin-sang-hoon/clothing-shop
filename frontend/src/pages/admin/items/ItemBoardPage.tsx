import { useState } from "react";
import { RENTAL_ITEMS, AUCTION_ITEMS } from "../mock/adminMockData";
import styles from "../admin.module.css";

type BoardTab = "전체" | "렌탈" | "입찰";

const CATEGORIES = ["전체", "신발", "상의", "아우터", "바지", "소품"];

export default function ItemBoardPage() {
  const [tab, setTab]         = useState<BoardTab>("전체");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("전체");

  // 렌탈 + 입찰 통합
  const allRental  = RENTAL_ITEMS.map((r) => ({ ...r, type: "렌탈" as const }));
  const allAuction = AUCTION_ITEMS.map((a) => ({
    id: a.id + 1000, title: a.title, brand: a.brand, category: a.category, size: a.size,
    img: a.img, status: a.status, createdAt: a.createdAt, type: "입찰" as const,
    price: a.currentBid,
  }));

  const merged = [
    ...allRental.map((r) => ({ id: r.id, type: r.type, title: r.title, brand: r.brand, category: r.category, size: r.size, img: r.img, status: r.status, createdAt: r.createdAt, price: r.rentalPrice })),
    ...allAuction,
  ];

  const filtered = merged.filter((item) => {
    const matchTab  = tab === "전체" || item.type === tab;
    const matchCat  = category === "전체" || item.category === category;
    const matchKw   = !keyword || item.title.includes(keyword) || item.brand.includes(keyword);
    return matchTab && matchCat && matchKw;
  });

  const badgeType = (t: string) => t === "렌탈" ? styles.badgeBlue : styles.badgeOrange;
  const badgeStatus = (s: string) => {
    const map: Record<string, string> = { 대기중: styles.badgeGray, 렌탈중: styles.badgeBlue, 반납완료: styles.badgeGreen, 취소: styles.badgeRed, 입찰중: styles.badgeOrange, 낙찰완료: styles.badgeGreen, 유찰: styles.badgeGray };
    return map[s] ?? styles.badgeGray;
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>게시판 — 아이템 조회</h1>
          <p className={styles.pageDesc}>렌탈 및 입찰 아이템 전체 목록을 조회합니다.</p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input className={styles.searchInput} placeholder="상품명, 브랜드 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <select className={styles.filterSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="button" className={styles.btnPrimary}>검색</button>
        <button type="button" className={styles.btnSecondary} onClick={() => { setKeyword(""); setCategory("전체"); }}>초기화</button>
      </div>

      <div className={styles.tabs}>
        {(["전체", "렌탈", "입찰"] as BoardTab[]).map((t) => (
          <button key={t} type="button" className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`} onClick={() => setTab(t)}>
            {t}
            <span className={styles.tabBadge}>{t === "전체" ? merged.length : merged.filter(i => i.type === t).length}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableCount}>총 <strong>{filtered.length}</strong>건</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr><th>No</th><th>유형</th><th>상품</th><th>카테고리</th><th>사이즈</th><th>가격</th><th>상태</th><th>등록일</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className={styles.empty}>데이터가 없습니다.</td></tr>}
            {filtered.map((item) => (
              <tr key={`${item.type}-${item.id}`}>
                <td style={{ color: "#94a3b8" }}>{item.id}</td>
                <td><span className={`${styles.badge} ${badgeType(item.type)}`}>{item.type}</span></td>
                <td>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemThumb}>{item.img}</div>
                    <div>
                      <div className={styles.itemTitle}>{item.title}</div>
                      <div className={styles.itemBrand}>{item.brand}</div>
                    </div>
                  </div>
                </td>
                <td>{item.category}</td>
                <td>{item.size}</td>
                <td style={{ fontWeight: 600 }}>{item.price.toLocaleString()}원{item.type === "렌탈" ? "/일" : ""}</td>
                <td><span className={`${styles.badge} ${badgeStatus(item.status)}`}>{item.status}</span></td>
                <td style={{ fontSize: 12, color: "#94a3b8" }}>{item.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
