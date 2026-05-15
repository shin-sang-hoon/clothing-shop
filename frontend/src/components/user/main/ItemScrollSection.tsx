import { useId } from "react";
import { useNavigate } from "react-router-dom";
import type { ShopItemResponse } from "@/shared/api/itemApi";
import { useItemLikes } from "@/shared/hooks/useLikes";
import MainItemCard from "./MainItemCard";
import styles from "./PopularSection.module.css";

interface ItemScrollSectionProps {
  title: string;
  dot?: string;
  products: ShopItemResponse[];
  morePath: string;
  background?: string;
  mode?: "rental" | "auction";
}

export default function ItemScrollSection({
  title,
  dot,
  products,
  morePath,
  background,
  mode,
}: ItemScrollSectionProps) {
  const navigate = useNavigate();
  const { isLikedById, likeById, unlikeById } = useItemLikes();
  const uid = useId().replace(/:/g, "");
  const scrollId = `scroll-wrap-${uid}`;

  if (products.length === 0) return null;

  return (
    <section className={styles.popularSection} style={background ? { background } : undefined}>
      <div className={styles.popularInner}>
      <div className={styles.popularHeader}>
        <div className={styles.popularTitle}>
          {dot && <span className={styles.popularLiveDot} style={{ background: dot }} />}
          {title}
        </div>
        <span
          className={styles.popularMore}
          role="button"
          tabIndex={0}
          onClick={() => navigate(morePath)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(morePath); }}
        >
          더보기 &gt;
        </span>
      </div>

      <div className={styles.popularScrollOuter}>
        <button
          type="button"
          className={`${styles.popularArrow} ${styles.popularArrowLeft}`}
          onClick={() => document.getElementById(scrollId)?.scrollBy({ left: -500, behavior: "smooth" })}
          aria-label="왼쪽 스크롤"
        />

        <div className={styles.popularScrollWrap} id={scrollId}>
          <div className={styles.popularScroll}>
            {products.length === 0 ? (
              <div style={{ padding: "24px 8px", color: "#aaa", fontSize: 14 }}>
                상품이 없습니다.
              </div>
            ) : (
              products.map((product, index) => (
                <MainItemCard
                  key={product.id}
                  product={product}
                  liked={isLikedById(product.id)}
                  onLike={() => likeById(product.id)}
                  onUnlike={() => unlikeById(product.id)}
                  onOpen={() => navigate(`/product/${product.id}${mode ? `?mode=${mode}` : ""}`)}
                  rank={index + 1}
                  className={styles.popularCardItem}
                  mode={mode}
                />
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.popularArrow} ${styles.popularArrowRight}`}
          onClick={() => document.getElementById(scrollId)?.scrollBy({ left: 500, behavior: "smooth" })}
          aria-label="오른쪽 스크롤"
        />
      </div>
      </div>
    </section>
  );
}
