import { useEffect, useRef, useState } from "react";
import { apiGetBrands, type UserBrandRow } from "@/shared/api/brandApi";
import { resolveUrl } from "@/shared/config/env";
import styles from "./AdminBrandPickerModal.module.css";

const PAGE_SIZE = 30;
const DEBOUNCE_MS = 300;

const CONSONANTS = ["전체", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const ALPHABETS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
const NUMBERS = ["1","2","3","4","5","6","7","8","9"];

function resolveIconUrl(iconImageUrl?: string | null): string | null {
    return resolveUrl(iconImageUrl) || null;
}

function BrandLogo({ nameKo, iconImageUrl }: { nameKo: string; iconImageUrl?: string | null }) {
    const [error, setError] = useState(false);
    const url = resolveIconUrl(iconImageUrl);

    if (url && !error) {
        return (
            <div className={styles.logo}>
                <img src={url} alt={nameKo} onError={() => setError(true)} />
            </div>
        );
    }
    return (
        <div className={styles.logo}>
            <span className={styles.logoFallback}>{nameKo.trim()[0] ?? "?"}</span>
        </div>
    );
}

interface Props {
    onClose: () => void;
    onSelect: (brandId: number, brandName: string) => void;
}

export default function AdminBrandPickerModal({ onClose, onSelect }: Props) {
    const [brands, setBrands] = useState<UserBrandRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [consonant, setConsonant] = useState("전체");
    const [showKorean, setShowKorean] = useState(false);
    const [showAlpha, setShowAlpha] = useState(false);
    const [showNumbers, setShowNumbers] = useState(false);

    // debounce timer
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // track current search params to avoid stale results
    const searchRef = useRef({ keyword: "", consonant: "전체" });

    async function fetchBrands(kw: string, cons: string, pg: number) {
        setLoading(true);
        try {
            const res = await apiGetBrands({
                page: pg,
                size: PAGE_SIZE,
                keyword: kw || undefined,
                initialConsonant: cons === "전체" ? undefined : cons,
                sort: "nameAsc",
            });
            // discard stale result
            if (searchRef.current.keyword !== kw || searchRef.current.consonant !== cons) return;

            setBrands(res.content);
            setTotalCount(res.totalElements);
            setPage(pg);
            setTotalPages(res.totalPages);
        } finally {
            setLoading(false);
        }
    }

    // 최초 로드
    useEffect(() => {
        searchRef.current = { keyword: "", consonant: "전체" };
        fetchBrands("", "전체", 0);
    }, []);

    function handleKeywordChange(value: string) {
        setKeyword(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchRef.current = { keyword: value, consonant };
            fetchBrands(value, consonant, 0);
        }, DEBOUNCE_MS);
    }

    function handleConsonantChange(cons: string) {
        setConsonant(cons);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        searchRef.current = { keyword, consonant: cons };
        fetchBrands(keyword, cons, 0);
    }

    function handlePageChange(pg: number) {
        fetchBrands(keyword, consonant, pg);
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>브랜드 선택</h3>
                    <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.searchWrap}>
                    <input
                        className={styles.searchInput}
                        placeholder="브랜드명 검색..."
                        value={keyword}
                        onChange={(e) => handleKeywordChange(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles.consonantRow}>
                    <button
                        type="button"
                        className={CONSONANTS.slice(1).includes(consonant) ? styles.consonantBtnActive : styles.consonantBtn}
                        onClick={() => setShowKorean((v) => !v)}
                    >
                        ㄱ-ㅎ {showKorean ? "▴" : "▾"}
                    </button>
                </div>
                {showKorean && (
                    <div className={styles.consonantRow}>
                        {CONSONANTS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={consonant === c ? styles.consonantBtnActive : styles.consonantBtn}
                                onClick={() => handleConsonantChange(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.consonantRow}>
                    <button
                        type="button"
                        className={ALPHABETS.includes(consonant) ? styles.consonantBtnActive : styles.consonantBtn}
                        onClick={() => setShowAlpha((v) => !v)}
                    >
                        A-Z {showAlpha ? "▴" : "▾"}
                    </button>
                </div>
                {showAlpha && (
                    <div className={styles.consonantRow}>
                        {ALPHABETS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={consonant === c ? styles.consonantBtnActive : styles.consonantBtn}
                                onClick={() => handleConsonantChange(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.consonantRow}>
                    <button
                        type="button"
                        className={NUMBERS.includes(consonant) ? styles.consonantBtnActive : styles.consonantBtn}
                        onClick={() => setShowNumbers((v) => !v)}
                    >
                        0-9 {showNumbers ? "▴" : "▾"}
                    </button>
                </div>
                {showNumbers && (
                    <div className={styles.consonantRow}>
                        {NUMBERS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={consonant === c ? styles.consonantBtnActive : styles.consonantBtn}
                                onClick={() => handleConsonantChange(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                <div className={styles.count}>
                    {loading ? "검색 중..." : `총 ${totalCount.toLocaleString()}개`}
                </div>

                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.empty}>불러오는 중...</div>
                    ) : brands.length === 0 ? (
                        <div className={styles.empty}>브랜드가 없습니다.</div>
                    ) : (
                        <>
                            {brands.map((b) => (
                                <div
                                    key={b.id}
                                    className={styles.item}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { onSelect(b.id, b.nameKo); onClose(); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { onSelect(b.id, b.nameKo); onClose(); } }}
                                >
                                    <BrandLogo nameKo={b.nameKo} iconImageUrl={b.iconImageUrl} />
                                    <span className={styles.nameKo}>{b.nameKo}</span>
                                    <span className={styles.nameEn}>{b.nameEn}</span>
                                </div>
                            ))}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(0)}
                                        disabled={page === 0}
                                    >«</button>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                    >‹</button>
                                    <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1}
                                    >›</button>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(totalPages - 1)}
                                        disabled={page >= totalPages - 1}
                                    >»</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
