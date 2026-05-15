import { useEffect, useState } from "react";
import { apiGetLinkedSocialAccounts, apiUnlinkSocialAccount } from "@/shared/api/meApi";
import { BACKEND_ORIGIN } from "@/shared/config/env";
import { useModalStore } from "@/shared/store/modalStore";
import styles from "@/pages/MyPage.module.css";

const SOCIAL_CONNECT_MODE_COOKIE = "social_connect_mode";

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#FEE500"/>
      <path
        fill="#3C1E1E"
        d="M12 5C7.58 5 4 7.92 4 11.5c0 2.28 1.47 4.28 3.69 5.44l-.94 3.46c-.08.3.25.54.52.37L11.4 18.1c.19.02.39.04.6.04 4.42 0 8-2.92 8-6.54C20 7.92 16.42 5 12 5z"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#03C75A"/>
      <path
        fill="#fff"
        d="M13.37 12.27L10.48 7H7v10h3.63v-5.27L13.52 17H17V7h-3.63z"
      />
    </svg>
  );
}

const SOCIAL_PROVIDERS = [
  { key: "google", label: "Google", Icon: GoogleIcon },
  { key: "kakao", label: "Kakao", Icon: KakaoIcon },
  { key: "naver", label: "Naver", Icon: NaverIcon },
];

function getErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

function setSocialConnectModeCookie() {
  document.cookie = [
    `${SOCIAL_CONNECT_MODE_COOKIE}=1`,
    "Path=/",
    "Max-Age=600",
    "SameSite=Lax",
  ].join("; ");
}

export default function SocialAccountsSection() {
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openAlert = useModalStore((state) => state.openAlert);

  useEffect(() => {
    apiGetLinkedSocialAccounts()
      .then(setLinkedProviders)
      .catch(() => {});
  }, []);

  async function unlinkSocialAccount(provider: string, label: string) {
    try {
      await apiUnlinkSocialAccount(provider);
      setLinkedProviders((prev) => prev.filter((item) => item !== provider));
      openAlert("success", "연동 해제 완료", `${label} 계정 연동이 해제되었습니다.`);
    } catch (error: unknown) {
      openAlert("error", "연동 해제 실패", getErrorMessage(error, "연동 해제 중 오류가 발생했습니다."));
    }
  }

  function handleLinkSocial(provider: string, label: string) {
    openConfirm(
      "warning",
      "소셜 연동",
      `${label} 계정을 연동하시겠습니까?`,
      () => {
        setSocialConnectModeCookie();
        window.location.href = `${BACKEND_ORIGIN}/oauth2/authorization/${provider}`;
      },
      "연동",
      "취소",
    );
  }

  function handleUnlinkSocial(provider: string, label: string) {
    openConfirm(
      "warning",
      "연동 해제",
      `${label} 계정 연동을 해제하시겠습니까?`,
      () => {
        void unlinkSocialAccount(provider, label);
      },
      "해제",
      "취소",
    );
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>소셜 로그인 연동</h2>
      <div className={styles.infoCard}>
        {SOCIAL_PROVIDERS.map((provider) => {
          const isLinked = linkedProviders.includes(provider.key);
          return (
            <div
              key={provider.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <provider.Icon />
                {provider.label}
                {isLinked && (
                  <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 400, marginLeft: 4 }}>
                    연동됨
                  </span>
                )}
              </span>
              {isLinked ? (
                <button
                  type="button"
                  style={{
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #dc2626",
                    background: "#fff",
                    color: "#dc2626",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                  onClick={() => handleUnlinkSocial(provider.key, provider.label)}
                >
                  연동 해제
                </button>
              ) : (
                <button
                  type="button"
                  style={{
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #222",
                    background: "#222",
                    color: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                  onClick={() => handleLinkSocial(provider.key, provider.label)}
                >
                  연동하기
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
