import { useEffect, useState } from "react";
import AddressInput, { type AddressValue } from "@/components/common/AddressInput";
import {
  apiChangeMyPassword,
  apiGetMyProfile,
  apiUpdateMyProfile,
  apiUpdateMyNickname,
} from "@/shared/api/meApi";
import { useAuthStore } from "@/shared/store/authStore";
import styles from "@/pages/MyPage.module.css";

type Props = {
  email: string;
  defaultName: string;
};

type ProfileForm = {
  name: string;
  phoneNumber: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

export default function MyInfoSection({ email, defaultName }: Props) {
  const me = useAuthStore((state) => state.me);
  const setMe = useAuthStore((state) => state.setMe);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: defaultName,
    phoneNumber: "",
  });
  const [nickname, setNickname] = useState(me?.nickname ?? "");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [address, setAddress] = useState<AddressValue>({
    zipCode: "",
    roadAddress: "",
    detailAddress: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("처리가 완료되었습니다.");

  useEffect(() => {
    apiGetMyProfile()
      .then((data) => {
        setProfileForm({
          name: data.name || defaultName,
          phoneNumber: data.phoneNumber || "",
        });
        setNickname(data.nickname || "");
        setAddress({
          zipCode: data.zipCode,
          roadAddress: data.roadAddress,
          detailAddress: data.detailAddress,
        });
      })
      .catch(() => {});
  }, [defaultName]);

  async function handleSaveNickname() {
    setNicknameError("");
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNicknameError("닉네임은 2자 이상 20자 이하로 입력해주세요.");
      return;
    }
    setNicknameSaving(true);
    try {
      await apiUpdateMyNickname(trimmed);
      if (me) setMe({ ...me, nickname: trimmed });
      setPopupMessage("닉네임이 저장되었습니다.");
      setShowPopup(true);
    } catch (error: unknown) {
      setNicknameError(getErrorMessage(error, "닉네임 저장 중 오류가 발생했습니다."));
    } finally {
      setNicknameSaving(false);
    }
  }

  async function handleSaveProfile() {
    setSaveError("");

    const nextName = profileForm.name.trim();
    const nextPhoneNumber = profileForm.phoneNumber.trim();
    const normalizedPhoneNumber = nextPhoneNumber.replace(/\D/g, "");

    if (nextPhoneNumber && !/^\d{10,11}$/.test(normalizedPhoneNumber)) {
      setSaveError("휴대폰 번호는 숫자 10자리 또는 11자리로 입력해주세요.");
      return;
    }

    try {
      await apiUpdateMyProfile({
        name: nextName,
        phoneNumber: normalizedPhoneNumber,
        zipCode: address.zipCode,
        roadAddress: address.roadAddress,
        detailAddress: address.detailAddress,
      });

      setProfileForm((prev) => ({ ...prev, phoneNumber: normalizedPhoneNumber }));

      if (me) {
        setMe({
          ...me,
          name: nextName,
          zipCode: address.zipCode || null,
          roadAddress: address.roadAddress || null,
          detailAddress: address.detailAddress || null,
        });
      }

      setPopupMessage("회원 정보가 저장되었습니다.");
      setShowPopup(true);
    } catch (error: unknown) {
      setSaveError(getErrorMessage(error, "저장 중 오류가 발생했습니다. 다시 시도해주세요."));
    }
  }

  async function handleChangePassword() {
    setPasswordError("");

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordForm.currentPassword.trim()) {
      setPasswordError("현재 비밀번호를 입력해주세요.");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("새 비밀번호를 입력해주세요.");
      return;
    }
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordError("비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.");
      return;
    }
    if (!passwordForm.confirmPassword) {
      setPasswordError("새 비밀번호 확인을 입력해주세요.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      await apiChangeMyPassword(passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPopupMessage("비밀번호가 변경되었습니다.");
      setShowPopup(true);
    } catch (error: unknown) {
      setPasswordError(
        getErrorMessage(error, "비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요."),
      );
    }
  }

  return (
    <div>
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "36px 48px",
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
              minWidth: 280,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{popupMessage}</div>
            <button
              type="button"
              style={{
                marginTop: 16,
                padding: "10px 32px",
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => setShowPopup(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}

      <h2 className={styles.sectionTitle}>로그인 정보</h2>
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>이메일</span>
          <span className={styles.infoValue}>{email}</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>닉네임</h2>
      <div className={styles.infoCard}>
        <div className={styles.profileGrid}>
          <div className={styles.profileField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.infoLabel}>
              닉네임 <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>(채팅에서 표시됩니다)</span>
            </label>
            <input
              className={styles.infoInput}
              placeholder="2~20자 이내로 입력하세요"
              value={nickname}
              maxLength={20}
              onChange={(event) => { setNickname(event.target.value); setNicknameError(""); }}
            />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <button type="button" className={styles.saveBtn} onClick={handleSaveNickname} disabled={nicknameSaving}>
            {nicknameSaving ? "저장 중..." : "닉네임 저장"}
          </button>
          {nicknameError && <p style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{nicknameError}</p>}
        </div>
      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>
        비밀번호 변경
      </h2>
      <div className={styles.infoCard}>
        <div className={styles.profileGrid}>
          <div className={styles.profileField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.infoLabel}>현재 비밀번호</label>
            <input
              type="password"
              className={styles.infoInput}
              placeholder="현재 비밀번호"
              value={passwordForm.currentPassword}
              onChange={(event) => {
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }));
                setPasswordError("");
              }}
            />
          </div>

          <div className={styles.profileField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.infoLabel}>새 비밀번호</label>
            <input
              type="password"
              className={styles.infoInput}
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              value={passwordForm.newPassword}
              onChange={(event) => {
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }));
                setPasswordError("");
              }}
            />
          </div>

          <div className={styles.profileField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.infoLabel}>새 비밀번호 확인</label>
            <input
              type="password"
              className={styles.infoInput}
              placeholder="새 비밀번호 확인"
              value={passwordForm.confirmPassword}
              onChange={(event) => {
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }));
                setPasswordError("");
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="button" className={styles.saveBtn} onClick={handleChangePassword}>
            비밀번호 변경
          </button>
          {passwordError && (
            <p style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{passwordError}</p>
          )}
        </div>
      </div>

      <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>
        내 정보 수정
      </h2>
      <div className={styles.infoCard}>
        <div className={styles.profileGrid}>
          <div className={styles.profileField}>
            <label className={styles.infoLabel}>이름</label>
            <input
              className={styles.infoInput}
              placeholder="이름을 입력하세요"
              value={profileForm.name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className={styles.profileField}>
            <label className={styles.infoLabel}>휴대폰 번호</label>
            <input
              className={styles.infoInput}
              placeholder="01012345678"
              value={profileForm.phoneNumber}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, "").slice(0, 11);
                setProfileForm((prev) => ({ ...prev, phoneNumber: nextValue }));
                setSaveError("");
              }}
            />
          </div>

          <div className={styles.profileField} style={{ gridColumn: "1 / -1" }}>
            <label className={styles.infoLabel}>주소</label>
            <AddressInput value={address} onChange={setAddress} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="button" className={styles.saveBtn} onClick={handleSaveProfile}>
            저장
          </button>
          {saveError && <p style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{saveError}</p>}
        </div>
      </div>
    </div>
  );
}
