import { useNavigate } from "react-router-dom";
import type { ShopItemResponse } from "@/shared/api/itemApi";
import { useItemLikes } from "@/shared/hooks/useLikes";
import MainItemCard from "./MainItemCard";
import styles from "./PopularSection.module.css";

interface PopularSectionProps {
  products: ShopItemResponse[];
}

export default function PopularSection({ products }: PopularSectionProps) {
  const navigate = useNavigate();
  const { isLikedById, likeById, unlikeById } = useItemLikes();
  const scrollContainerId = "popular-scroll-wrap";

  const handleScrollLeft = () => {
    document.getElementById(scrollContainerId)?.scrollBy({ left: -500, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    document.getElementById(scrollContainerId)?.scrollBy({ left: 500, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className={styles.popularSection}>
      <div className={styles.popularInner}>
      <div className={styles.popularHeader}>
        <div className={styles.popularTitle}>
          <span className={styles.popularLiveDot} />
          실시간 인기템
        </div>
        <span
          className={styles.popularMore}
          role="button"
          tabIndex={0}
          onClick={() => navigate("/popular")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/popular");
            }
          }}
        >
          더보기 &gt;
        </span>
      </div>

      <div className={styles.popularScrollOuter}>
        <button
          type="button"
          className={`${styles.popularArrow} ${styles.popularArrowLeft}`}
          onClick={handleScrollLeft}
          aria-label="인기 상품 왼쪽으로 스크롤"
        />

        <div className={styles.popularScrollWrap} id={scrollContainerId}>
          <div className={styles.popularScroll}>
            {products.map((product, index) => (
              <MainItemCard
                key={product.id}
                product={product}
                liked={isLikedById(product.id)}
                onLike={() => likeById(product.id)}
                onUnlike={() => unlikeById(product.id)}
                onOpen={() => navigate(`/product/${product.id}`)}
                rank={index + 1}
                className={styles.popularCardItem}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`${styles.popularArrow} ${styles.popularArrowRight}`}
          onClick={handleScrollRight}
          aria-label="인기 상품 오른쪽으로 스크롤"
        />
      </div>
      </div>
    </section>
  );
}
