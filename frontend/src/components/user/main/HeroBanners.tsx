import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { resolveUrl } from "@/shared/config/env";
import {
  apiGetPublicMainBanners,
  type PublicMainBannerRow,
} from "@/shared/api/admin/mainBannerApi";
import { apiGetBrands } from "@/shared/api/brandApi";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./HeroBanners.module.css";

export default function HeroBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<PublicMainBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await apiGetPublicMainBanners();
        if (!mounted) {
          return;
        }
        setBanners(response);
      } catch (error) {
        console.error("메인 배너 조회 실패:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleBannerClick(banner: PublicMainBannerRow) {
    const link = banner.linkUrl?.trim();
    if (link && link !== "-") {
      if (/^https?:\/\//i.test(link)) {
        window.location.href = link;
      } else {
        navigate(link);
      }
      return;
    }

    const subtitle = banner.subtitle?.trim();
    if (subtitle) {
      try {
        const result = await apiGetBrands({ keyword: subtitle, page: 0, size: 10 });
        const match = result.content.find(
          (b) =>
            b.nameKo === subtitle ||
            b.nameEn?.toLowerCase() === subtitle.toLowerCase(),
        );
        if (match) {
          navigate(`/shop?brandCode=${match.id}`);
          return;
        }
      } catch {}
      navigate(`/shop?keyword=${encodeURIComponent(subtitle)}`);
    }
  }

  if (loading) {
    return (
      <section className={styles.heroBanners} aria-label="메인 배너 로딩">
        <div className={styles.swiper}>
          <div className={styles.skeleton} />
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className={styles.heroBanners} aria-label="메인 배너">
      <div className={styles.swiperWrapper}>
        {banners.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnPrev}`}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="이전 배너"
          >
            ‹
          </button>
        )}
        <Swiper
          className={styles.swiper}
          modules={[Autoplay, Pagination]}
          slidesPerView={1.1}
          spaceBetween={12}
          loop={banners.length > 1}
          centeredSlides
          watchOverflow
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true }}
          breakpoints={{
            768: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            1280: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          }}
          onSwiper={(s) => { swiperRef.current = s; }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id} className={styles.slide}>
              <article
                className={styles.heroBanner}
                role="button"
                tabIndex={0}
                onClick={() => void handleBannerClick(banner)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void handleBannerClick(banner);
                  }
                }}
              >
                <img
                  className={styles.heroBannerImage}
                  src={resolveUrl(banner.imageUrl)}
                  alt={banner.title}
                />
                <div className={styles.heroBannerOverlay} />
                <div className={styles.heroBannerText}>
                  {banner.subtitle ? <div className={styles.sub}>{banner.subtitle}</div> : null}
                  <div className={styles.title}>{banner.title}</div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        {banners.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="다음 배너"
          >
            ›
          </button>
        )}
      </div>
    </section>
  );
}
