import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LikedBrandsSection from "@/components/user/mypage/LikedBrandsSection";
import LikedItemsSection from "@/components/user/mypage/LikedItemsSection";
import MyInfoSection from "@/components/user/mypage/MyInfoSection";
import MyPageProfileCard from "@/components/user/mypage/MyPageProfileCard";
import SocialAccountsSection from "@/components/user/mypage/SocialAccountsSection";
import MyPageSidebar from "@/components/user/mypage/MyPageSidebar";
import BidSection from "@/components/user/mypage/BidSection";
import RentalPurchaseSection from "@/components/user/mypage/RentalPurchaseSection";
import {
  DEFAULT_DISPLAY_NAME,
  DEFAULT_EMAIL,
} from "@/components/user/mypage/constants";
import type { MenuKey } from "@/components/user/mypage/types";
import { useAuthStore } from "@/shared/store/authStore";
import { http } from "@/shared/api/http";
import styles from "./MyPage.module.css";

export default function MyPage() {
  const me = useAuthStore((state) => state.me);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const location = useLocation();
  const navigate = useNavigate();
  const initialMenu = (location.state as { menu?: MenuKey } | null)?.menu ?? "my-info";
  const [menu, setMenu] = useState<MenuKey>(initialMenu);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const displayName = me?.name ?? DEFAULT_DISPLAY_NAME;
  const email = me?.email ?? DEFAULT_EMAIL;

  useEffect(() => {
    const nextMenu = (location.state as { menu?: MenuKey } | null)?.menu ?? "my-info";
    setMenu(nextMenu);
  }, [location.key, location.state]);

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await http.post("/me/withdraw");
      clearAuth();
      navigate("/");
    } catch {
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setWithdrawing(false);
      setShowWithdrawModal(false);
    }
  }

  function renderContent() {
    switch (menu) {
      case "bid":
        return <BidSection />;
      case "rental-history":
        return <RentalPurchaseSection />;
      case "liked-brands":
        return <LikedBrandsSection />;
      case "liked-items":
        return <LikedItemsSection />;
      case "my-info":
        return <MyInfoSection email={email} defaultName={displayName} />;
      case "social-accounts":
        return <SocialAccountsSection />;
      default:
        return <BidSection />;
    }
  }

  return (
    <div className={styles.page}>
      <MyPageSidebar menu={menu} onChangeMenu={setMenu} />

      <main className={styles.main}>
        <MyPageProfileCard
          displayName={displayName}
          email={email}
          onMoveMyInfo={() => setMenu("my-info")}
        />

        <div className={styles.contentArea}>{renderContent()}</div>

        <div style={{ textAlign: "right", paddingTop: "8px" }}>
          <button
            onClick={() => setShowWithdrawModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            회원탈퇴
          </button>
        </div>
      </main>

      {showWithdrawModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: "14px", padding: "32px 28px",
            width: "360px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 800, color: "#111827" }}>
              회원탈퇴
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280", lineHeight: 1.6 }}>
              탈퇴하시면 계정 정보가 비활성화되며 복구할 수 없습니다.<br />
              정말 탈퇴하시겠습니까?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                style={{
                  height: "38px", padding: "0 18px", border: "1px solid #d1d5db",
                  borderRadius: "8px", background: "#fff", color: "#374151",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                style={{
                  height: "38px", padding: "0 18px", border: "none",
                  borderRadius: "8px", background: "#ef4444", color: "#fff",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  opacity: withdrawing ? 0.6 : 1,
                }}
              >
                {withdrawing ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
