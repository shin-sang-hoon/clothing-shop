import styles from "@/pages/MyPage.module.css";

type Props = {
  displayName: string;
  email: string;
  onMoveMyInfo: () => void;
};

export default function MyPageProfileCard({
  displayName,
  email,
  onMoveMyInfo,
}: Props) {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileCardLeft}>
        <div>
          <div className={styles.profileCardName}>{displayName}</div>
          <div className={styles.profileCardEmail}>{email}</div>
        </div>
      </div>
      <div className={styles.profileCardBtns}>
        <button type="button" className={styles.profileCardBtn} onClick={onMoveMyInfo}>
          프로필 관리
        </button>
      </div>
    </div>
  );
}
