import { useEffect, useRef, useState } from "react";
import { apiGetBrands, type UserBrandRow } from "@/shared/api/brandApi";
import { apiLikeBrand } from "@/shared/api/likeApi";
import { resolveUrl } from "@/shared/config/env";
import styles from "./OnboardingModal.module.css";

interface Props {
  userEmail: string;
  onClose: () => void;
}

export default function OnboardingModal({ userEmail, onClose }: Props) {
  const [brands, setBrands] = useState<UserBrandRow[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);

  const [selectedBrandIds, setSelectedBrandIds] = useState<Set<number>>(new Set());
  const [brandKeyword, setBrandKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 브랜드 검색: 키워드 변경 시 debounce 후 서버 호출
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBrandLoading(true);
      apiGetBrands({ page: 0, size: 30, keyword: brandKeyword.trim() || undefined })
        .then((res) => setBrands(res.content))
        .catch(() => setBrands([]))
        .finally(() => setBrandLoading(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [brandKeyword]);

  function toggleBrand(id: number) {
    setSelectedBrandIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** 다음에 선택: 플래그를 유지하여 다음 로그인 시 다시 표시 */
  function handleDefer() {
    onClose();
  }

  /** 건너뛰기: 플래그를 완전히 제거하여 다시 표시하지 않음 */
  function handleSkip() {
    localStorage.removeItem(`pendingOnboarding_${userEmail}`);
    onClose();
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await Promise.allSettled(
        Array.from(selectedBrandIds).map((id) => apiLikeBrand(id))
      );
    } finally {
      localStorage.removeItem(`pendingOnboarding_${userEmail}`);
      setSaving(false);
      onClose();
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>선호하는 브랜드를 선택해주세요</h2>
          <p className={styles.subtitle}>
            여러 개 선택 가능합니다. 나중에 마이페이지에서 변경할 수 있어요.
          </p>

          {/* 검색창 */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="브랜드 검색..."
              value={brandKeyword}
              onChange={(e) => setBrandKeyword(e.target.value)}
            />
            {brandKeyword && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setBrandKeyword("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {brandLoading ? (
            <p className={styles.empty}>검색 중...</p>
          ) : brands.length === 0 ? (
            <p className={styles.empty}>검색 결과가 없습니다.</p>
          ) : (
            <div className={styles.grid}>
              {brands.map((brand) => {
                const active = selectedBrandIds.has(brand.id);
                const iconSrc = resolveUrl(brand.iconImageUrl ?? null);
                return (
                  <button
                    key={brand.id}
                    type="button"
                    className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                    onClick={() => toggleBrand(brand.id)}
                  >
                    {iconSrc && (
                      <img src={iconSrc} alt={brand.nameKo} className={styles.chipIcon} />
                    )}
                    <span className={styles.chipName}>{brand.nameKo}</span>
                    {active && <span className={styles.chipCheck}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 선택된 수 */}
        <div className={styles.selectionCount}>
          {selectedBrandIds.size > 0 ? `${selectedBrandIds.size}개 선택됨` : "선택 없음"}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button type="button" className={styles.deferBtn} onClick={handleDefer}>
            다음에 선택
          </button>
          <button type="button" className={styles.skipBtn} onClick={handleSkip}>
            건너뛰기
          </button>
          <button
            type="button"
            className={styles.nextBtn}
            onClick={handleComplete}
            disabled={saving}
          >
            {saving ? "저장 중..." : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
