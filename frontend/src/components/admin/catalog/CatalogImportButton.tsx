import { useState } from "react";
import styles from "@/pages/admin/catalog/ManagePage.module.css";

/**
 * CatalogImportButtonProps
 * - 공통 크롤링 실행 버튼 props
 */
interface CatalogImportButtonProps {
    label: string;
    onImport: () => Promise<void>;
    disabled?: boolean;
}

/**
 * CatalogImportButton
 * - 브랜드 / 카테고리 / 태그 / 태그그룹 가져오기 버튼 공통 컴포넌트
 *
 * 특징:
 * - 버튼 내부에서 로딩 상태 처리
 * - 기존 스타일 토대는 건드리지 않고 ManagePage.module.css 클래스 재사용
 */
export default function CatalogImportButton({
    label,
    onImport,
    disabled = false,
}: CatalogImportButtonProps) {
    const [loading, setLoading] = useState(false);

    /**
     * handleClick
     * - 가져오기 실행
     */
    const handleClick = async () => {
        if (loading || disabled) {
            return;
        }

        try {
            setLoading(true);
            await onImport();
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            className={styles.actionButton}
            onClick={handleClick}
            disabled={loading || disabled}
        >
            {loading ? "처리 중..." : label}
        </button>
    );
}