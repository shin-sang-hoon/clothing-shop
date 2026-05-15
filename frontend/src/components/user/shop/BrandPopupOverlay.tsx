import { useEffect, useRef, useState } from "react";
import { apiGetBrands, type UserBrandRow } from "@/shared/api/brandApi";
import { resolveUrl } from "@/shared/config/env";
import styles from "@/pages/ShopPage.module.css";

function BrandCardLogo({ iconImageUrl, nameKo }: { iconImageUrl?: string | null; nameKo: string }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = iconImageUrl ? resolveUrl(iconImageUrl) : null;

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={nameKo}
        className={styles.brandLogo}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={styles.brandLogoPlaceholder}>
      {nameKo.slice(0, 1)}
    </div>
  );
}

interface Props {
  selectedBrand: string;
  onSelect: (brandName: string) => void;
  onClose: () => void;
}

export default function BrandPopupOverlay({ selectedBrand, onSelect, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState("");
  const [brands, setBrands] = useState<UserBrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGetBrands({ page: 0, size: 200, keyword: keyword || undefined, sort: "nameAsc" })
      .then((res) => setBrands(res.content))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, [keyword]);

  return (
    <div
      ref={overlayRef}
      className={styles.popupOverlay}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <h3 className={styles.popupTitle}>브랜드</h3>
          <button type="button" className={styles.popupClose} onClick={onClose}>X</button>
        </div>

        <div style={{ padding: "10px 20px 0" }}>
          <input
            type="text"
            placeholder="브랜드 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: "100%", height: 36, padding: "0 12px",
              border: "1px solid #d1d5db", borderRadius: 8,
              fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div className={styles.popupBody}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "20px 0", fontSize: 13 }}>불러오는 중...</div>
          ) : brands.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "20px 0", fontSize: 13 }}>브랜드가 없습니다.</div>
          ) : (
            <div className={styles.brandGrid}>
              {brands.map((brand) => {
                const isActive = selectedBrand === brand.nameKo;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    className={`${styles.brandCard} ${isActive ? styles.brandCardActive : ""}`}
                    onClick={() => onSelect(brand.nameKo)}
                  >
                    <BrandCardLogo iconImageUrl={brand.iconImageUrl} nameKo={brand.nameKo} />
                    <span className={styles.brandCardName}>{brand.nameKo}</span>
                    {brand.likeCnt != null && (
                      <span style={{ fontSize: "0.7rem", color: "#e05", marginTop: 2 }}>
                        ♥ {brand.likeCnt.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.popupFooter}>
          {selectedBrand && (
            <button type="button" className={styles.popupReset} onClick={() => onSelect("")}>
              선택 초기화
            </button>
          )}
          <button type="button" className={styles.popupConfirm} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
