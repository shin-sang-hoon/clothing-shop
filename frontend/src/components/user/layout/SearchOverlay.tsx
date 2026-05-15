import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetSearchRankings,
  type RisingKeyword,
  type TrendingKeyword,
} from "@/shared/api/searchRankingApi";
import { apiGetBrands } from "@/shared/api/brandApi";
import styles from "./SearchOverlay.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialKeyword?: string;
}

const RECENT_KEYWORDS_KEY = "muream_recent_keywords";
const MAX_RECENT_KEYWORDS = 8;

function loadRecentKeywords(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEYWORDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentKeywords(keywords: string[]): void {
  localStorage.setItem(RECENT_KEYWORDS_KEY, JSON.stringify(keywords));
}

function addRecentKeyword(keyword: string): void {
  const kw = keyword.trim();
  if (!kw) return;
  const prev = loadRecentKeywords();
  const next = [kw, ...prev.filter((k) => k !== kw)].slice(0, MAX_RECENT_KEYWORDS);
  saveRecentKeywords(next);
}

function formatUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) return "";
  const date = new Date(updatedAt);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}, 기준`;
}

export default function SearchOverlay({ isOpen, onClose, initialKeyword = "" }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [popular, setPopular] = useState<TrendingKeyword[]>([]);
  const [rising, setRising] = useState<RisingKeyword[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeyword(initialKeyword);
      setRecentKeywords(loadRecentKeywords());
      setTimeout(() => inputRef.current?.focus(), 50);

      setRankingLoading(true);
      apiGetSearchRankings()
        .then((data) => {
          setPopular(data.popular);
          setRising(data.rising);
          setUpdatedAt(data.updatedAt);
        })
        .catch(() => {})
        .finally(() => setRankingLoading(false));
    }
  }, [isOpen, initialKeyword]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleSearch(kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    addRecentKeyword(trimmed);
    setRecentKeywords(loadRecentKeywords());

    try {
      const result = await apiGetBrands({ keyword: trimmed, page: 0, size: 10 });
      const match = result.content.find(
        (b) =>
          b.nameKo === trimmed ||
          b.nameEn?.toLowerCase() === trimmed.toLowerCase(),
      );
      if (match) {
        navigate(`/shop?brandCode=${match.id}`);
        onClose();
        return;
      }
    } catch {}

    navigate(`/shop?keyword=${encodeURIComponent(trimmed)}`);
    onClose();
  }

  function removeKeyword(kw: string) {
    setRecentKeywords((prev) => {
      const next = prev.filter((k) => k !== kw);
      saveRecentKeywords(next);
      return next;
    });
  }

  function clearAllKeywords() {
    saveRecentKeywords([]);
    setRecentKeywords([]);
  }

  if (!isOpen) return null;

  const popularLeft = popular.filter((_, i) => i < 5);
  const popularRight = popular.filter((_, i) => i >= 5);
  const risingLeft = rising.filter((_, i) => i < 5);
  const risingRight = rising.filter((_, i) => i >= 5);
  const timestampText = formatUpdatedAt(updatedAt);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.inner} onClick={(e) => e.stopPropagation()}>

        {/* 검색 입력 */}
        <div className={styles.searchBar}>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(keyword); }}
          />
          <button type="button" className={styles.searchBtn} aria-label="검색" onClick={() => handleSearch(keyword)}>
            🔍
          </button>
          <button type="button" className={styles.closeBtn} aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>

          {/* 최근 검색어 */}
          {recentKeywords.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>최근 검색어</span>
                <button type="button" className={styles.deleteAllBtn} onClick={clearAllKeywords}>모두삭제</button>
              </div>
              <div className={styles.keywordChips}>
                {recentKeywords.map((kw) => (
                  <div key={kw} className={styles.keywordChip}>
                    <span
                      className={styles.keywordChipText}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSearch(kw)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(kw); }}
                    >
                      {kw}
                    </span>
                    <button
                      type="button"
                      className={styles.keywordChipRemove}
                      onClick={() => removeKeyword(kw)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 인기 검색어 */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>인기 검색어</span>
              {timestampText && <span className={styles.timestamp}>{timestampText}</span>}
            </div>
            {rankingLoading ? (
              <div className={styles.rankingEmpty}>집계 중...</div>
            ) : popular.length === 0 ? (
              <div className={styles.rankingEmpty}>검색 데이터가 없습니다.</div>
            ) : (
              <div className={styles.searchGrid}>
                <div className={styles.searchCol}>
                  {popularLeft.map((item) => (
                    <div
                      key={item.rank}
                      className={styles.searchRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSearch(item.term)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(item.term); }}
                    >
                      <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ""}`}>{item.rank}</span>
                      <span className={styles.term}>{item.term}</span>
                      <span className={`${styles.trend} ${item.trend === "up" ? styles.trendUp : item.trend === "down" ? styles.trendDown : styles.trendNone}`}>
                        {item.trend === "up" ? `▲${item.rankChange ?? ""}` : item.trend === "down" ? `▼${item.rankChange ?? ""}` : "-"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.searchCol}>
                  {popularRight.map((item) => (
                    <div
                      key={item.rank}
                      className={styles.searchRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSearch(item.term)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(item.term); }}
                    >
                      <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ""}`}>{item.rank}</span>
                      <span className={styles.term}>{item.term}</span>
                      <span className={`${styles.trend} ${item.trend === "up" ? styles.trendUp : item.trend === "down" ? styles.trendDown : styles.trendNone}`}>
                        {item.trend === "up" ? `▲${item.rankChange ?? ""}` : item.trend === "down" ? `▼${item.rankChange ?? ""}` : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 급상승 검색어 */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>급상승 검색어</span>
              {timestampText && <span className={styles.timestamp}>{timestampText}</span>}
            </div>
            {rankingLoading ? (
              <div className={styles.rankingEmpty}>집계 중...</div>
            ) : rising.length === 0 ? (
              <div className={styles.rankingEmpty}>검색 데이터가 없습니다.</div>
            ) : (
              <div className={styles.searchGrid}>
                <div className={styles.searchCol}>
                  {risingLeft.map((item) => (
                    <div
                      key={item.rank}
                      className={styles.searchRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSearch(item.term)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(item.term); }}
                    >
                      <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ""}`}>{item.rank}</span>
                      <span className={styles.term}>{item.term}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.searchCol}>
                  {risingRight.map((item) => (
                    <div
                      key={item.rank}
                      className={styles.searchRow}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSearch(item.term)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(item.term); }}
                    >
                      <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ""}`}>{item.rank}</span>
                      <span className={styles.term}>{item.term}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
