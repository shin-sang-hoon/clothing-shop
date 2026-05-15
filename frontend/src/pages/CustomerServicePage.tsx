import styles from "./CustomerServicePage.module.css";

const FAQ = [
  {
    q: "주문한 상품은 언제 배송되나요?",
    a: "결제 완료 후 영업일 기준 1~3일 이내 출고됩니다. 출고 후 택배사 상황에 따라 1~2일 소요됩니다.",
  },
  {
    q: "반품/교환은 어떻게 신청하나요?",
    a: "상품 수령 후 7일 이내에 1:1 채팅 상담을 통해 신청해 주세요. 단순 변심의 경우 반품 배송비는 고객 부담입니다.",
  },
  {
    q: "렌탈 상품 반납은 어떻게 하나요?",
    a: "렌탈 기간 종료 전날까지 택배로 반납해 주시면 됩니다. 반납 택배비는 고객 부담이며, 반납 전 1:1 채팅으로 안내받으실 수 있습니다.",
  },
  {
    q: "경매 낙찰 후 결제는 어떻게 진행되나요?",
    a: "경매 종료 후 낙찰 안내 메일이 발송됩니다. 24시간 이내에 결제하지 않으면 낙찰이 취소될 수 있습니다.",
  },
  {
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "마이페이지 > 계정 설정에서 탈퇴 신청이 가능합니다. 탈퇴 후 30일간 재가입이 제한됩니다.",
  },
  {
    q: "결제 오류가 발생했어요.",
    a: "결제 오류는 카드사 또는 결제 수단 문제일 수 있습니다. 다른 결제 수단을 시도해 보시고, 문제가 지속되면 1:1 채팅으로 문의해 주세요.",
  },
  {
    q: "비밀번호를 잊어버렸어요.",
    a: "로그인 페이지의 '비밀번호 찾기'를 통해 가입하신 이메일로 재설정 링크를 받으실 수 있습니다.",
  },
];

export default function CustomerServicePage() {
  return (
    <div className={styles.page}>
      {/* 상단 배너 */}
      <div className={styles.banner}>
        <h1 className={styles.bannerTitle}>고객센터</h1>
        <p className={styles.bannerSub}>무엇을 도와드릴까요?</p>
      </div>

      <div className={styles.content}>
        {/* 1:1 채팅 안내 */}
        <section className={styles.chatSection}>
          <div className={styles.chatCard}>
            <div className={styles.chatIcon}>💬</div>
            <div className={styles.chatInfo}>
              <h2 className={styles.chatTitle}>1:1 채팅 상담</h2>
              <p className={styles.chatDesc}>
                화면 우측 하단의 <strong>💬 채팅 버튼</strong>을 클릭하신 후<br />
                <strong>관리자 문의</strong>를 선택하시면 실시간으로 상담을 받으실 수 있습니다.
              </p>
              <ul className={styles.chatMeta}>
                <li>운영 시간: 평일 09:00 ~ 18:00 (주말·공휴일 휴무)</li>
                <li>점심 시간: 12:00 ~ 13:00</li>
                <li>로그인 후 이용 가능합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>자주 묻는 질문</h2>
          <div className={styles.faqList}>
            {FAQ.map((item, idx) => (
              <details key={idx} className={styles.faqItem}>
                <summary className={styles.faqQ}>
                  <span className={styles.faqQIcon}>Q</span>
                  {item.q}
                </summary>
                <div className={styles.faqA}>
                  <span className={styles.faqAIcon}>A</span>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
