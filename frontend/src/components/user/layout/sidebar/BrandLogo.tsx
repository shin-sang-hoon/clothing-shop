import { useEffect, useMemo, useState } from "react";
import { resolveUrl } from "@/shared/config/env";
import styles from "../UserSidebar.module.css";

interface BrandLogoProps {
  nameKo: string;
  iconImageUrl?: string | null;
}

function getBrandFallbackText(nameKo: string): string {
  const trimmed = nameKo.trim();
  return trimmed ? trimmed.charAt(0) : "?";
}

function resolveAssetUrl(path?: string | null): string | null {
  const url = resolveUrl(path);
  return url || null;
}

export default function BrandLogo({ nameKo, iconImageUrl }: BrandLogoProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [iconImageUrl]);

  const resolvedIconUrl = useMemo(
    () => resolveAssetUrl(iconImageUrl),
    [iconImageUrl],
  );

  const shouldRenderImage = Boolean(resolvedIconUrl) && !hasImageError;

  return (
    <div className={styles.brandItemLogo}>
      {shouldRenderImage ? (
        <img
          className={styles.brandItemLogoImage}
          src={resolvedIconUrl ?? undefined}
          alt={`${nameKo} 로고`}
          loading="lazy"
          width={42}
          height={42}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className={styles.brandItemPlaceholder}>
          {getBrandFallbackText(nameKo)}
        </span>
      )}
    </div>
  );
}
