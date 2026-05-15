import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetMyLikedItems,
  apiLikeItem,
  apiUnlikeItem,
  type LikedItemResponse,
} from "@/shared/api/likeApi";
import { resolveUrl } from "@/shared/config/env";
import { dummyLikeBase } from "@/shared/utils/dummyLike";
import styles from "@/pages/MyPage.module.css";

export default function LikedItemsSection() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LikedItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  // 좋아요 취소된 아이템 ID set (빈 하트로 표시)
  const [unlikedIds, setUnlikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    apiGetMyLikedItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggleLike(e: React.MouseEvent, itemId: number) {
    e.stopPropagation();
    const isUnliked = unlikedIds.has(itemId);
    if (isUnliked) {
      // 빈 하트 → 다시 좋아요 (채워진 하트)
      try {
        await apiLikeItem(itemId);
        setUnlikedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      } catch {}
    } else {
      // 채워진 하트 → 좋아요 취소 (빈 하트)
      try {
        await apiUnlikeItem(itemId);
        setUnlikedIds((prev) => new Set(prev).add(itemId));
      } catch {}
    }
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>좋아요 상품</h2>
      {loading ? (
        <p className={styles.empty}>불러오는 중...</p>
      ) : (
        <div className={styles.itemList}>
          {items.length === 0 && <p className={styles.empty}>관심 상품이 없습니다.</p>}
          {items.map((item) => {
            const isUnliked = unlikedIds.has(item.itemId);
            return (
              <div
                key={item.itemId}
                className={styles.itemRow}
                onClick={() => navigate(`/product/${item.itemId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.itemThumb}>
                  {item.img ? (
                    <img
                      src={resolveUrl(item.img)}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    "🏷"
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemBrand}>{item.brandName}</div>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemMeta}>관심 {dummyLikeBase(item.itemId) + (item.likeCnt ?? 0)}</div>
                </div>
                <div className={styles.itemRight}>
                  <div className={styles.itemPrice}>
                    {item.rentalPrice != null
                      ? `${item.rentalPrice.toLocaleString()}원 / 일`
                      : item.retailPrice != null && item.retailPrice > 0
                      ? `${item.retailPrice.toLocaleString()}원`
                      : "가격 미정"}
                  </div>
                  <button
                    type="button"
                    className={styles.itemHeartBtn}
                    onClick={(e) => handleToggleLike(e, item.itemId)}
                    aria-label={isUnliked ? "좋아요 추가" : "좋아요 취소"}
                    style={{ color: isUnliked ? "#d1d5db" : "#ef4444" }}
                  >
                    {isUnliked ? "♡" : "♥"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
