import { useEffect, useState } from "react";
import PopularSection from "@/components/user/main/PopularSection";
import HeroBanners from "@/components/user/main/HeroBanners";
import RecommendSection from "@/components/user/main/RecommendSection";
import ItemScrollSection from "@/components/user/main/ItemScrollSection";
import {
  apiGetHomePopularItems,
  apiGetHomeRecommendItems,
  type ShopItemResponse,
} from "@/shared/api/itemApi";

export default function HomePage() {
  const [popular, setPopular] = useState<ShopItemResponse[]>([]);
  const [recommend, setRecommend] = useState<ShopItemResponse[]>([]);
  const [rentalItems, setRentalItems] = useState<ShopItemResponse[]>([]);
  const [auctionItems, setAuctionItems] = useState<ShopItemResponse[]>([]);

  useEffect(() => {
    apiGetHomePopularItems({ size: 20 })
      .then((rows) => setPopular(rows))
      .catch(() => {});

    apiGetHomeRecommendItems({ size: 10 })
      .then((rows) => setRecommend(rows))
      .catch(() => {});

    apiGetHomePopularItems({ size: 20, itemMode: "RENTAL" })
      .then((rows) => setRentalItems(rows))
      .catch(() => {});

    apiGetHomePopularItems({ size: 20, itemMode: "AUCTION" })
      .then((rows) => setAuctionItems(rows))
      .catch(() => {});
  }, []);

  return (
    <>
      <HeroBanners />
      <PopularSection products={popular} />
      <ItemScrollSection
        title="인기 렌탈 아이템"
        dot="#0ea5e9"
        products={rentalItems}
        morePath="/rental"
        background="#f0f8ff"
        mode="rental"
      />
      <ItemScrollSection
        title="인기 입찰 아이템"
        dot="#f59e0b"
        products={auctionItems}
        morePath="/auction"
        background="#fffbeb"
        mode="auction"
      />
      <RecommendSection products={recommend} />
    </>
  );
}
