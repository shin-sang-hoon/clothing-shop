import { useNavigate } from "react-router-dom";
import { PRODUCTS } from "@/shared/data/mockData";
import styles from "@/components/user/product/ProductDetail.module.css";

type Product = (typeof PRODUCTS)[0];

interface Props {
    p: Product;
}

export default function RelatedCard({ p }: Props) {
    const navigate = useNavigate();
    const dp = p.discountRate ? Math.round(p.price * (1 - p.discountRate / 100)) : p.price;
    return (
        <div
            className={styles.detailRelatedCard}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/product/${p.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/product/${p.id}`); }}
        >
            <div className={styles.detailRelatedImg}>{p.img}</div>
            <div className={styles.detailRelatedBrand}>{p.brand}</div>
            <div className={styles.detailRelatedName}>{p.name}</div>
            <div className={styles.detailRelatedPrice}>
                {p.discountRate > 0 && <span className={styles.detailRelatedDiscount}>{p.discountRate}%</span>}
                {dp.toLocaleString()}원
            </div>
            <div className={styles.detailRelatedLikes}>관심 {((p.likes ?? 0) / 1000).toFixed(1)}k</div>
        </div>
    );
}
