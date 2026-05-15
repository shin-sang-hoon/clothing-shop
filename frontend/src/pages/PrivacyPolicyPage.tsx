import styles from "./PolicyPage.module.css";

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>개인정보처리방침</h1>
      <p className={styles.updated}>시행일: 2026년 3월 26일</p>

      <p className={styles.intro}>
        MUREAM(이하 "회사")은 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
      </p>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제1조 (수집하는 개인정보 항목)</h2>
        <p>회사는 서비스 제공을 위하여 다음과 같은 개인정보를 수집합니다.</p>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>1. 회원가입 시</h3>
          <ul className={styles.list}>
            <li><strong>필수항목:</strong> 이메일 주소, 비밀번호, 이름(닉네임)</li>
            <li><strong>선택항목:</strong> 프로필 사진, 연락처</li>
          </ul>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>2. 서비스 이용 시</h3>
          <ul className={styles.list}>
            <li><strong>필수항목:</strong> 배송지 정보(이름, 주소, 연락처), 결제정보(카드번호, 유효기간 등)</li>
            <li><strong>자동수집 항목:</strong> IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 기기 정보</li>
          </ul>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>3. 소셜 로그인 이용 시</h3>
          <ul className={styles.list}>
            <li>소셜 서비스(카카오, 네이버 등)에서 제공하는 이메일 주소, 닉네임, 프로필 사진</li>
          </ul>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제2조 (개인정보의 수집 및 이용 목적)</h2>
        <p>회사는 수집한 개인정보를 다음의 목적을 위하여 처리합니다.</p>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>1. 회원 관리</h3>
          <p>회원제 서비스 이용에 따른 본인 확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 민원 처리, 고지사항 전달</p>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>2. 서비스 제공</h3>
          <p>상품 구매 및 결제, 상품 배송, 청약철회·환불 처리, 렌탈 서비스 제공, 경매 서비스 제공</p>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>3. 마케팅 및 광고 활용</h3>
          <p>신규 서비스(상품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인, 통계학적 특성에 따른 서비스 제공 및 광고 게재</p>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제3조 (개인정보의 보유 및 이용 기간)</h2>
        <p>회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.</p>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>1. 회원 탈퇴 시</h3>
          <p>탈퇴 후 즉시 삭제. 단, 법령에 의한 보존 의무가 있는 경우 해당 기간 동안 보존합니다.</p>
        </div>

        <div className={styles.article}>
          <h3 className={styles.articleTitle}>2. 관련 법령에 의한 보존</h3>
          <ul className={styles.list}>
            <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
            <li><strong>접속에 관한 기록:</strong> 3개월 (통신비밀보호법)</li>
          </ul>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제4조 (개인정보의 제3자 제공)</h2>
        <ol className={styles.list}>
          <li>회사는 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적을 초과하여 처리하거나 제3자에게 제공하지 않습니다.
            <ul className={styles.subList}>
              <li>정보주체로부터 별도의 동의를 받은 경우</li>
              <li>법률에 특별한 규정이 있는 경우</li>
              <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
            </ul>
          </li>
          <li>회사는 상품 배송 및 결제를 위하여 다음과 같이 개인정보를 제3자에게 제공합니다.
            <ul className={styles.subList}>
              <li><strong>제공받는 자:</strong> 택배사, 결제대행사</li>
              <li><strong>제공 목적:</strong> 배송, 결제 처리</li>
              <li><strong>제공 항목:</strong> 이름, 주소, 연락처, 결제정보</li>
              <li><strong>보유 기간:</strong> 서비스 제공 완료 후 5년</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제5조 (개인정보 처리의 위탁)</h2>
        <p>회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 위탁합니다.</p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>수탁업체</th>
                <th>위탁 업무 내용</th>
                <th>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>결제대행사</td>
                <td>전자결제 처리</td>
                <td>회원탈퇴 또는 위탁계약 종료 시</td>
              </tr>
              <tr>
                <td>택배사</td>
                <td>상품 배송</td>
                <td>배송 완료 후 즉시 파기</td>
              </tr>
              <tr>
                <td>클라우드 서비스 업체</td>
                <td>데이터 보관 및 시스템 운영</td>
                <td>위탁계약 종료 시</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제6조 (정보주체의 권리·의무 및 그 행사방법)</h2>
        <ol className={styles.list}>
          <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            <ul className={styles.subList}>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </li>
          <li>권리 행사는 회사에 대하여 서면, 전화, 이메일, 고객센터 등을 통하여 하실 수 있으며 회사는 이에 대하여 지체 없이 조치하겠습니다.</li>
          <li>만 14세 미만 아동의 경우, 법정대리인이 아동의 개인정보에 대한 권리를 행사할 수 있습니다.</li>
        </ol>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제7조 (개인정보의 파기)</h2>
        <ol className={styles.list}>
          <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
          <li>파기 방법은 다음과 같습니다.
            <ul className={styles.subList}>
              <li><strong>전자적 파일 형태:</strong> 복원이 불가능한 방법으로 영구 삭제</li>
              <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제8조 (쿠키의 사용)</h2>
        <ol className={styles.list}>
          <li>회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
          <li>쿠키는 웹사이트를 운영하는 데 이용되는 서버가 이용자의 컴퓨터 브라우저에 보내는 소량의 정보이며 이용자 PC 컴퓨터 내의 하드디스크에 저장됩니다.</li>
          <li>이용자는 웹 브라우저 설정을 통해 쿠키 수락 여부를 직접 선택할 수 있습니다. 다만, 쿠키 저장을 거부하는 경우 서비스 이용에 불편이 있을 수 있습니다.</li>
        </ol>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제9조 (개인정보 보호책임자)</h2>
        <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>

        <div className={styles.infoBox}>
          <p><strong>개인정보 보호책임자</strong></p>
          <p>이름: MUREAM 개인정보보호팀</p>
          <p>이메일: privacy@muream.com</p>
          <p>고객센터: 1:1 채팅 상담</p>
        </div>

        <p style={{ marginTop: 12 }}>정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다.</p>
      </section>

      <section className={styles.chapter}>
        <h2 className={styles.chapterTitle}>제10조 (개인정보 처리방침의 변경)</h2>
        <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
      </section>

      <p className={styles.footer}>부칙: 이 개인정보처리방침은 2026년 3월 26일부터 시행합니다.</p>
    </div>
  );
}
