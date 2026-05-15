import { useEffect, useState } from "react";
import { apiGetCategories, type PublicCategoryItem } from "@/shared/api/categoryApi";
import styles from "./CategorySelectorModal.module.css";

interface SelectedCategory {
    parentCategoryName: string;
    categoryId: number;
    categoryName: string;
}

interface CategorySelectorModalProps {
    onClose: () => void;
    onConfirm: (selected: SelectedCategory) => void;
    initialParent?: string;
    initialCategoryId?: number;
    categories?: PublicCategoryItem[];
}

type Step = 1 | 2;

/**
 * CategorySelectorModal
 * DB 카테고리 기반 2단계 선택 팝업
 *  1단계: depth=1 상위 카테고리 선택
 *  2단계: depth=2 하위 카테고리 선택
 */
export default function CategorySelectorModal({
    onClose,
    onConfirm,
    initialParent = "",
    initialCategoryId = 0,
    categories: providedCategories,
}: CategorySelectorModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
    const [selectedParent, setSelectedParent] = useState<PublicCategoryItem | null>(null);
    const [selectedChild, setSelectedChild] = useState<PublicCategoryItem | null>(null);

    useEffect(() => {
        if (providedCategories && providedCategories.length > 0) {
            setCategories(providedCategories);
            if (initialCategoryId) {
                const child = providedCategories.find((c) => c.id === initialCategoryId && c.depth === 2);
                if (child) {
                    const parent = providedCategories.find((c) => c.id === child.parentId && c.depth === 1);
                    setSelectedChild(child);
                    setSelectedParent(parent ?? null);
                }
            } else if (initialParent) {
                const parent = providedCategories.find((c) => c.depth === 1 && c.name === initialParent);
                setSelectedParent(parent ?? null);
            }
            return;
        }

        apiGetCategories()
            .then((cats) => {
                setCategories(cats);
                // 초기값 복원
                if (initialCategoryId) {
                    const child = cats.find((c) => c.id === initialCategoryId && c.depth === 2);
                    if (child) {
                        const parent = cats.find((c) => c.id === child.parentId && c.depth === 1);
                        setSelectedChild(child);
                        setSelectedParent(parent ?? null);
                    }
                } else if (initialParent) {
                    const parent = cats.find((c) => c.depth === 1 && c.name === initialParent);
                    setSelectedParent(parent ?? null);
                }
            })
            .catch(() => {});
    }, [initialCategoryId, initialParent, providedCategories]);

    const depth1 = categories.filter((c) => c.depth === 1);
    const depth2 = selectedParent
        ? categories.filter((c) => c.depth === 2 && c.parentId === selectedParent.id)
        : [];

    function handleSelectParent(parent: PublicCategoryItem) {
        setSelectedParent(parent);
        setSelectedChild(null);
        setStep(2);
    }

    function handleConfirm() {
        if (!selectedChild || !selectedParent) return;
        onConfirm({
            parentCategoryName: selectedParent.name,
            categoryId: selectedChild.id,
            categoryName: selectedChild.name,
        });
        onClose();
    }

    const stepLabels = ["카테고리", "하위 카테고리"];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <h3 className={styles.title}>카테고리 선택</h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* 스텝 인디케이터 */}
                <div className={styles.steps}>
                    {[1, 2].map((s) => (
                        <div
                            key={s}
                            className={`${styles.stepItem} ${step === s ? styles.stepActive : ""} ${step > s ? styles.stepDone : ""}`}
                            onClick={() => { if (s < step) setStep(s as Step); }}
                        >
                            <div className={styles.stepCircle}>{step > s ? "✓" : s}</div>
                            <span className={styles.stepLabel}>{stepLabels[s - 1]}</span>
                        </div>
                    ))}
                </div>

                {/* 본문 */}
                <div className={styles.body}>
                    {/* 1단계: 상위 카테고리 */}
                    {step === 1 && (
                        <div>
                            <p className={styles.stepDesc}>카테고리를 선택하세요.</p>
                            {depth1.length === 0 ? (
                                <p className={styles.stepDesc} style={{ color: "#9ca3af" }}>카테고리를 불러오는 중...</p>
                            ) : (
                                <div className={styles.parentGrid}>
                                    {depth1.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`${styles.parentBtn} ${selectedParent?.id === p.id ? styles.parentBtnActive : ""}`}
                                            onClick={() => handleSelectParent(p)}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2단계: 하위 카테고리 */}
                    {step === 2 && (
                        <div>
                            <div className={styles.stepBack}>
                                <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                                    ← {selectedParent?.name}
                                </button>
                            </div>
                            <p className={styles.stepDesc}>하위 카테고리를 선택하세요.</p>
                            {depth2.length === 0 ? (
                                <p className={styles.stepDesc} style={{ color: "#9ca3af" }}>하위 카테고리가 없습니다.</p>
                            ) : (
                                <div className={styles.catGrid}>
                                    {depth2.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            className={`${styles.catBtn} ${selectedChild?.id === cat.id ? styles.catBtnActive : ""}`}
                                            onClick={() => setSelectedChild(cat)}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className={styles.footer}>
                    {step === 1 ? (
                        <button
                            type="button"
                            className={styles.nextBtn}
                            disabled={!selectedParent}
                            onClick={() => setStep(2)}
                        >
                            다음 →
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.confirmBtn}
                            disabled={!selectedChild}
                            onClick={handleConfirm}
                        >
                            완료
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
