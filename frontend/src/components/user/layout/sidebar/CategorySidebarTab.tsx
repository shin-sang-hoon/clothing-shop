import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  apiGetCategories,
  type PublicCategoryItem,
} from "@/shared/api/categoryApi";
import styles from "../UserSidebar.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2;

export default function CategorySidebarTab({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [categories, setCategories] = useState<PublicCategoryItem[]>([]);
  const [selectedParent, setSelectedParent] = useState<PublicCategoryItem | null>(null);
  const [selectedChild, setSelectedChild] = useState<PublicCategoryItem | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setStep(1);
    setSelectedParent(null);
    setSelectedChild(null);
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;

    apiGetCategories()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCategories(response.filter((category) => category.useYn !== false));
      })
      .catch((error) => {
        console.error("카테고리 목록 조회 실패:", error);
        if (!isMounted) {
          return;
        }
        setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const depth1 = useMemo(
    () => categories.filter((category) => category.depth === 1),
    [categories],
  );

  const depth2 = useMemo(() => {
    if (!selectedParent) {
      return [];
    }

    return categories.filter(
      (category) => category.depth === 2 && category.parentId === selectedParent.id,
    );
  }, [categories, selectedParent]);

  function handleSelectParent(parent: PublicCategoryItem) {
    setSelectedParent(parent);
    setSelectedChild(null);
    setStep(2);
  }

  function handleConfirm() {
    if (!selectedParent) {
      navigate("/shop");
      onClose();
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.delete("parent");
    next.delete("sub");
    next.set("categoryCode", selectedChild?.code ?? selectedParent.code);

    navigate(`/shop?${next.toString()}`);
    onClose();
  }

  return (
    <>
      <div className={`${styles.sidebarBody} ${styles.sidebarCategoryModalBody}`}>
        <div className={styles.sidebarCategorySteps}>
          <div
            className={`${styles.sidebarCategoryStepItem} ${step === 1 ? styles.sidebarCategoryStepActive : ""} ${step > 1 ? styles.sidebarCategoryStepDone : ""}`}
            onClick={() => setStep(1)}
          >
            <div className={styles.sidebarCategoryStepCircle}>{step > 1 ? "✓" : 1}</div>
            <span className={styles.sidebarCategoryStepLabel}>카테고리</span>
          </div>
          <div
            className={`${styles.sidebarCategoryStepItem} ${step === 2 ? styles.sidebarCategoryStepActive : ""}`}
          >
            <div className={styles.sidebarCategoryStepCircle}>2</div>
            <span className={styles.sidebarCategoryStepLabel}>하위 카테고리</span>
          </div>
        </div>

        <div className={styles.sidebarCategoryBodyInner}>
          {step === 1 && (
            <div>
              <p className={styles.sidebarCategoryDesc}>카테고리를 선택하세요.</p>
              {depth1.length === 0 ? (
                <p className={styles.sidebarCategoryDescMuted}>카테고리를 불러오는 중입니다.</p>
              ) : (
                <div className={styles.sidebarCategoryParentGrid}>
                  {depth1.map((parent) => (
                    <button
                      key={parent.id}
                      type="button"
                      className={`${styles.sidebarCategoryParentBtn} ${
                        selectedParent?.id === parent.id ? styles.sidebarCategoryParentBtnActive : ""
                      }`}
                      onClick={() => handleSelectParent(parent)}
                    >
                      {parent.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className={styles.sidebarCategoryBackRow}>
                <button
                  type="button"
                  className={styles.sidebarCategoryBackBtn}
                  onClick={() => setStep(1)}
                >
                  ← {selectedParent?.name}
                </button>
              </div>
              <p className={styles.sidebarCategoryDesc}>하위 카테고리를 선택하세요.</p>
              {depth2.length === 0 ? (
                <p className={styles.sidebarCategoryDescMuted}>하위 카테고리가 없습니다.</p>
              ) : (
                <div className={styles.sidebarCategoryChildGrid}>
                  {depth2.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className={`${styles.sidebarCategoryChildBtn} ${
                        selectedChild?.id === child.id ? styles.sidebarCategoryChildBtnActive : ""
                      }`}
                      onClick={() => setSelectedChild(child)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.sidebarCategoryFooter}>
        {step === 1 ? (
          <button
            type="button"
            className={styles.sidebarCategoryNextBtn}
            disabled={!selectedParent}
            onClick={() => setStep(2)}
          >
            다음 →
          </button>
        ) : (
          <button
            type="button"
            className={styles.sidebarCategoryConfirmBtn}
            disabled={!selectedParent}
            onClick={handleConfirm}
          >
            완료
          </button>
        )}
      </div>
    </>
  );
}
