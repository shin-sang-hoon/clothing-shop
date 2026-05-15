import styles from "@/pages/MyPage.module.css";

type Props = {
  status: string;
};

const CLASS_MAP: Record<string, string> = {
  입찰중: styles.statusBlue,
  낙찰완료: styles.statusGreen,
  유찰: styles.statusGray,
  취소: styles.statusRed,
  대기중: styles.statusGray,
  렌탈중: styles.statusBlue,
  반납완료: styles.statusGreen,
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`${styles.statusBadge} ${CLASS_MAP[status] ?? styles.statusGray}`}>
      {status}
    </span>
  );
}
