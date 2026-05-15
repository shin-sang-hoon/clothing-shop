import styles from "./PolicyPage.module.css";

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>이용약관</h1>
      <p className={styles.updated}>시행일: 2026년 3월 26일</p>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제1장 총칙</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제1조 (목적)</h3>
          <p>이 약관은 MUREAM(이하 "회사")이 운영하는 MUREAM 서비스(이하 "서비스")의 이용에 관한 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제2조 (정의)</h3>
          <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol className={styles.list}>
            <li>"서비스"란 회사가 제공하는 온라인 패션 커머스 플랫폼 및 이와 관련된 모든 서비스를 의미합니다.</li>
            <li>"회원"이란 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
            <li>"비회원"이란 회원으로 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
            <li>"아이디(ID)"란 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인한 문자와 숫자의 조합을 의미합니다.</li>
            <li>"비밀번호"란 회원이 부여받은 아이디와 일치하는 회원임을 확인하고 회원의 개인정보를 보호하기 위하여 회원 스스로가 설정한 문자와 숫자의 조합을 의미합니다.</li>
            <li>"판매자"란 서비스를 통하여 상품을 판매하는 사업자를 의미합니다.</li>
            <li>"상품"이란 판매자가 서비스를 통하여 판매하는 물품을 의미합니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제3조 (약관의 효력 및 변경)</h3>
          <ol className={styles.list}>
            <li>이 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</li>
            <li>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」 등 관련 법을 위반하지 않는 범위 내에서 이 약관을 개정할 수 있습니다.</li>
            <li>회사가 약관을 변경할 경우에는 변경 사항을 시행일로부터 최소 7일 전에 공지합니다. 다만, 회원에게 불리한 약관의 변경의 경우에는 최소 30일 전에 공지합니다.</li>
            <li>회원이 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 이용계약을 해지할 수 있습니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제4조 (약관의 해석)</h3>
          <p>이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 관계 법령 및 상관례에 따릅니다.</p>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제2장 회원가입 및 이용계약</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제5조 (이용계약의 성립)</h3>
          <ol className={styles.list}>
            <li>이용계약은 회원이 되고자 하는 자가 약관의 내용에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써 성립합니다.</li>
            <li>회사는 회원가입 신청자의 신청에 대하여 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
              <ul className={styles.subList}>
                <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                <li>14세 미만 아동이 법정대리인의 동의를 얻지 않은 경우</li>
                <li>기타 회원으로 등록하는 것이 서비스 운영에 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제6조 (회원정보의 변경)</h3>
          <ol className={styles.list}>
            <li>회원은 회원정보 수정 페이지를 통하여 언제든지 개인정보를 열람하고 수정할 수 있습니다.</li>
            <li>회원은 가입신청 시 기재한 사항이 변경되었을 경우 이를 즉시 변경하여야 합니다.</li>
            <li>변경 미이행으로 인한 불이익은 회원의 책임으로 합니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제7조 (회원탈퇴 및 자격 상실)</h3>
          <ol className={styles.list}>
            <li>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다.</li>
            <li>회원이 다음 각 호의 사유에 해당하는 경우 회사는 회원자격을 제한 및 정지 또는 상실시킬 수 있습니다.
              <ul className={styles.subList}>
                <li>가입신청 시 허위 내용을 등록한 경우</li>
                <li>서비스 이용 요금 등 회원이 부담하는 채무를 기일에 이행하지 않는 경우</li>
                <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                <li>법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
              </ul>
            </li>
          </ol>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제3장 서비스 이용</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제8조 (서비스의 제공)</h3>
          <ol className={styles.list}>
            <li>회사는 다음과 같은 서비스를 제공합니다.
              <ul className={styles.subList}>
                <li>상품 판매 및 중개 서비스</li>
                <li>상품 렌탈 서비스</li>
                <li>경매 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </li>
            <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 시스템 점검 등 특별한 사유가 있는 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제9조 (구매신청 및 계약 성립)</h3>
          <ol className={styles.list}>
            <li>회원은 서비스상에서 다음 또는 이와 유사한 방법으로 구매를 신청하며, 회사는 회원이 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
              <ul className={styles.subList}>
                <li>재화 등의 검색 및 선택</li>
                <li>성명, 주소, 전화번호, 결제수단 등의 입력</li>
                <li>약관 내용 및 청약철회가 제한되는 서비스에 대한 확인</li>
                <li>구매신청 및 확인</li>
              </ul>
            </li>
            <li>이용계약은 회원의 구매신청에 대하여 회사가 수락의 의사표시를 한 때에 성립합니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제10조 (청약철회 및 반품)</h3>
          <ol className={styles.list}>
            <li>회원은 구매계약을 체결한 날부터 7일 이내에 청약을 철회할 수 있습니다.</li>
            <li>다음 각 호에 해당하는 경우에는 청약철회를 할 수 없습니다.
              <ul className={styles.subList}>
                <li>회원의 책임 있는 사유로 재화 등이 훼손된 경우</li>
                <li>회원의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우</li>
                <li>시간이 지나 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
              </ul>
            </li>
            <li>청약철회 시 반품 배송비는 회원이 부담하는 것을 원칙으로 하나, 재화 등의 내용이 표시·광고와 다른 경우에는 회사가 부담합니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제11조 (환불)</h3>
          <ol className={styles.list}>
            <li>회사는 회원이 구매 취소 및 반품 등으로 환불을 요구하는 경우, 환불 사유 확인 후 3영업일 이내에 환불 처리합니다.</li>
            <li>신용카드로 결제한 경우 카드사의 처리 기간에 따라 환불이 지연될 수 있습니다.</li>
          </ol>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제4장 개인정보 보호</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제12조 (개인정보의 보호)</h3>
          <ol className={styles.list}>
            <li>회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.</li>
            <li>회원의 개인정보 보호 및 이용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.</li>
            <li>회사는 회원의 귀책사유로 인해 노출된 정보에 대해서는 책임을 지지 않습니다.</li>
          </ol>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제5장 회사의 의무</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제13조 (회사의 의무)</h3>
          <ol className={styles.list}>
            <li>회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 지속적이고 안정적인 서비스를 제공하기 위해 최선을 다합니다.</li>
            <li>회사는 회원이 안전하게 서비스를 이용할 수 있도록 개인정보 보안을 위한 보안 시스템을 갖추어야 합니다.</li>
            <li>회사는 서비스 이용과 관련하여 회원으로부터 제기된 불만 또는 피해 요구 사항이 정당하다고 인정될 경우에는 이를 처리하여야 합니다.</li>
          </ol>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제6장 회원의 의무</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제14조 (회원의 의무)</h3>
          <ol className={styles.list}>
            <li>회원은 다음 행위를 하여서는 안 됩니다.
              <ul className={styles.subList}>
                <li>신청 또는 변경 시 허위 내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
                <li>회사 또는 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 또는 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제15조 (아이디 및 비밀번호 관리)</h3>
          <ol className={styles.list}>
            <li>아이디와 비밀번호에 관한 관리 책임은 회원에게 있습니다.</li>
            <li>회원은 자신의 아이디 및 비밀번호를 제3자에게 이용하게 해서는 안 됩니다.</li>
            <li>회원이 자신의 아이디 및 비밀번호를 도난당하거나 제3자가 사용하고 있음을 인지한 경우에는 즉시 회사에 통보하고 회사의 안내에 따라야 합니다.</li>
          </ol>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제7장 손해배상 및 면책</h2>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제16조 (손해배상)</h3>
          <ol className={styles.list}>
            <li>회사 또는 회원이 이 약관의 규정을 위반하여 상대방에게 손해를 입힌 경우, 손해를 입힌 자는 상대방에 대하여 그 손해를 배상할 책임이 있습니다.</li>
            <li>회사의 서비스 제공과 관련하여 회사의 고의 또는 과실이 없는 경우에는 회사는 어떠한 책임도 지지 않습니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제17조 (면책조항)</h3>
          <ol className={styles.list}>
            <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
            <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
            <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
          </ol>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>제18조 (분쟁 해결)</h3>
          <ol className={styles.list}>
            <li>회사와 회원 간에 발생한 분쟁에 관한 소송은 대한민국 법률을 적용하며, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
          </ol>
        </div>
      </section>

      <p className={styles.footer}>부칙: 이 약관은 2026년 3월 26일부터 시행합니다.</p>
    </div>
  );
}
