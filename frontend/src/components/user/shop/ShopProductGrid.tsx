import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import type { ShopItemResponse } from "@/shared/api/itemApi";
import { resolveUrl } from "@/shared/config/env";
import { dummyLikeBase } from "@/shared/utils/dummyLike";
import styles from "@/pages/ShopPage.module.css";

interface Props {
  loading: boolean;
  items: ShopItemResponse[];
  gridCols: 2 | 4;
  hasMore: boolean;
  loadingMore: boolean;
  loadedCount: number;
  totalCount: number;
  emptyMessage: string;
  onLoadMore: () => void;
  onClickItem: (itemId: number) => void;
  onToggleLikeById: (event: MouseEvent<HTMLButtonElement>, itemId: number) => void;
  isLikedById: (itemId: number) => boolean;
  priceText: (item: ShopItemResponse) => string;
}

export default function ShopProductGrid({
  loading,
  items,
  gridCols,
  hasMore,
  loadingMore,
  loadedCount,
  totalCount,
  emptyMessage,
  onLoadMore,
  onClickItem,
  onToggleLikeById,
  isLikedById,
  priceText,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  if (loading) {
    return <div className={styles.emptyMsg}>불러오는 중입니다.</div>;
  }

  if (items.length === 0) {
    return <div className={styles.emptyMsg}>{emptyMessage}</div>;
  }

  return (
    <>
      <div className={`${styles.grid} ${gridCols === 2 ? styles.grid2 : ""}`}>
        {items.map((item) => {
          const imageUrl = resolveUrl(item.img);
          const liked = isLikedById(item.id);
          return (
            <div
              key={item.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => onClickItem(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onClickItem(item.id);
                }
              }}
            >
              <div className={styles.cardImgWrap}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className={styles.cardImg}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span className={styles.cardImg}>상품 이미지</span>
                )}
                <button
                  type="button"
                  className={styles.heartBtn}
                  onClick={(event) => onToggleLikeById(event, item.id)}
                  aria-label="관심상품"
                  style={{ color: liked ? "#e53e3e" : undefined }}
                >
                  {liked ? "♥" : "♡"}
                </button>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardBrand}>{item.brand}</div>
                <div className={styles.cardName}>{item.name}</div>
                <div className={styles.cardPriceRow}>
                  <span className={styles.cardPrice}>{priceText(item)}</span>
                </div>
                <div className={styles.cardLikes}>
                  <span className={styles.cardHeart}>♥</span>
                  {(dummyLikeBase(item.id) + (item.likeCnt ?? 0)).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <div className={styles.loadMoreWrap}>
          <span className={styles.loadMoreBtn} style={{ cursor: "default" }}>
            불러오는 중..
          </span>
        </div>
      )}
    </>
  );
}
