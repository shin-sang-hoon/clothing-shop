import hashlib
import json
import numpy as np
import re
import os
import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as cos_sim
from transformers import AutoTokenizer, AutoModel
import torch

# ── 데이터 불러오기 ────────────────────────
with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

questions  = [item["question"]  for item in data]
answers    = [item["answer"]    for item in data]
categories = [item["category"]  for item in data]  # ← 추가!

# ── TF-IDF 모델 준비 ───────────────────────
print("TF-IDF 모델 준비 중...")
tfidf_vectorizer = TfidfVectorizer(
    stop_words=["어떻게", "어떻게요", "싶어요", "싶은데요",
                "언제", "얼마나", "있나요", "있어요",
                "되나요", "되요", "하나요", "해요"]
)
tfidf_matrix = tfidf_vectorizer.fit_transform(questions)
print("TF-IDF 준비 완료!")

# ── KoBERT 모델 로드 ───────────────────────
print("\nKoBERT 모델 로딩 중...")
MODEL_NAME = "snunlp/KR-ELECTRA-discriminator"
tokenizer  = AutoTokenizer.from_pretrained(MODEL_NAME)
model      = AutoModel.from_pretrained(MODEL_NAME)
model.eval()
print("KoBERT 로딩 완료!")

# ── KoBERT 임베딩 함수 ─────────────────────
def get_embedding(text):
    inputs = tokenizer(
        text, return_tensors="pt",
        padding=True, truncation=True, max_length=64
    )
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state[:, 0, :].numpy()

# ── 임베딩 캐시 경로 ───────────────────────
_CACHE_EMB  = "data/embeddings_cache.npy"
_CACHE_HASH = "data/embeddings_hash.txt"

def _questions_hash(qs: list[str]) -> str:
    content = "\n".join(qs).encode("utf-8")
    return hashlib.md5(content).hexdigest()

def _load_or_build_embeddings(qs: list[str]) -> np.ndarray:
    cur_hash = _questions_hash(qs)

    if os.path.exists(_CACHE_EMB) and os.path.exists(_CACHE_HASH):
        with open(_CACHE_HASH, "r", encoding="utf-8") as f:
            saved_hash = f.read().strip()
        if saved_hash == cur_hash:
            print("캐시된 임베딩 로드 중...")
            embs = np.load(_CACHE_EMB)
            print(f"캐시 로드 완료! ({len(embs)}개)\n")
            return embs

    print("\n질문 데이터 KoBERT 벡터화 중...")
    embs = []
    for i, q in enumerate(qs):
        embs.append(get_embedding(q)[0])
        if (i + 1) % 100 == 0:
            print(f"  {i+1}/{len(qs)} 완료...")
    embs = np.array(embs)
    print(f"벡터화 완료! ({len(qs)}개)")

    np.save(_CACHE_EMB, embs)
    with open(_CACHE_HASH, "w", encoding="utf-8") as f:
        f.write(cur_hash)
    print("임베딩 캐시 저장 완료!\n")
    return embs

# ── 전체 질문 벡터화 (캐시 우선) ───────────
question_embeddings = _load_or_build_embeddings(questions)

# ── 카테고리 키워드 감지 함수 ──────────────
def detect_category(user_input):
    category_keywords = {
        "렌탈신청": [
            "렌탈", "빌리", "대여", "신청", "렌트",
            "빌려", "이용", "물건 빌"
        ],
        "렌탈요금": [
            "요금", "렌탈료", "비용", "가격", "얼마",
            "납부", "자동이체", "금액", "해지",
            "위약금", "연체", "선납", "반납"
        ],
        "경매참여": [
            "경매", "입찰", "낙찰", "보증금", "참여",
            "참가", "응찰", "최고가"
        ],
        "경매환불": [
            "환불", "취소", "반품", "교환", "환급",
            "돌려", "취소되", "취소하", "반품하",
            "철회", "철회하", "무르", "되돌리",
            "낙찰 취소", "경매 취소"
        ],
        "배송수령": [
            "배송", "배달", "수령", "택배", "배송비",
            "도착", "받아볼"
        ],
        "회원계정": [
            "포인트", "회원", "로그인", "비밀번호",
            "계정", "쿠폰", "등급", "적립", "탈퇴",
            "아이디", "비번", "가입"
        ],
        # 무신사 FAQ 스타일 CS 카테고리 (렌탈·경매 쇼핑몰 MUREAM 맞춤)
        "배송": [
            "배송", "배달", "수령", "택배", "배송비",
            "출고", "배송조회", "운송", "도착", "받아볼", "합배송",
            "해외 배송",
        ],
        "취소/교환/반품": [
            "취소", "교환", "반품", "환불", "해지", "철회",
            "반납", "회수", "단순 변심",
        ],
        "상품/AS 문의": [
            "AS", "하자", "고장", "불량", "품질",
            "누락", "부속품", "세탁", "수선", "중고",
        ],
        "주문/결제": [
            "주문", "결제", "할부", "현금영수증",
            "세금계산서", "낙찰", "낙찰가", "청구",
            "자동이체", "렌탈료", "간편결제",
        ],
        "서비스": [
            "챗봇", "고객센터", "상담", "불만", "민원",
            "이벤트", "쿠폰", "앱",
        ],
        "이용 안내": [
            "이용약관", "약관", "개인정보", "렌탈과 경매",
            "청소년", "재판매", "픽업", "방문 수령",
            "사이트가 안", "합배송",
        ],
        "회원 정보": [
            "회원가입", "비밀번호", "개인정보",
            "적립금", "멤버십",
        ],
    }
    detected = []
    for cat, keywords in category_keywords.items():
        for kw in keywords:
            if kw in user_input:
                detected.append(cat)
                break
    detected = list(set(detected))
    return _refine_refund_categories(user_input, detected)


def _refine_refund_categories(user_input: str, detected: list[str]) -> list[str]:
    """
    일반 상품 환불·반품·취소·교환 문의는 '경매환불' FAQ(맞교환·수거 순서 등)와 섞이면 오답이 나올 수 있음.
    문장에 경매·입찰·낙찰·보증금·응찰 맥락이 없으면 경매환불 카테고리를 후보에서 제외한다.
    """
    u = user_input.strip()
    if not any(k in u for k in ("환불", "반품", "취소", "교환")):
        return detected
    auction_markers = ("경매", "입찰", "낙찰", "보증금", "응찰")
    if any(m in u for m in auction_markers):
        return detected
    out = [c for c in detected if c != "경매환불"]
    if "취소/교환/반품" not in out:
        out.append("취소/교환/반품")
    return out if out else ["취소/교환/반품"]

# ── 미인식 쿼리 로깅 함수 ──────────────────
def log_unknown_query(user_input, reason="미인식"):
    log_path = "data/unknown_queries.json"
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8") as f:
            logs = json.load(f)
    else:
        logs = []

    for log in logs:
        if log["question"] == user_input:
            log["count"] += 1
            log["last_seen"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(logs, f, ensure_ascii=False, indent=2)
            return

    logs.append({
        "question":   user_input,
        "reason":     reason,
        "count":      1,
        "first_seen": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "last_seen":  datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "category":   "",
        "answer":     ""
    })
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)
    print(f"  [로그] 미인식 쿼리 저장: {user_input}")


_CLOTHING_BRANCH_MARKERS = (
    "상의",
    "아우터",
    "바지",
    "원피스/스커트",
    "원피스",
    "스커트",
    "하의",
)


def _clothing_choice_needed(user_input: str) -> bool:
    """
    '의류'만 말하고 세부 카테고리를 고르지 않은 경우 → 상의/아우터/바지/원피스·스커트 선택 버튼.
    이미 위 분류 키워드가 들어 있으면 False.
    """
    if "의류" not in user_input:
        return False
    compact = re.sub(r"\s+", "", user_input.strip())
    for marker in _CLOTHING_BRANCH_MARKERS:
        if marker in compact:
            return False
    return True


def _try_shopping_category_response(user_input: str) -> tuple[str | None, str | None]:
    """
    Spring /api/categories·/api/items 와 연동된 카테고리 지식이 있으면
    렌탈 Q&A(TF-IDF) 차단 전에 우선 응답한다. app.py는 get_answer만 호출하므로 여기서 연결.
    Returns:
        (None, None) — 쇼핑 카테고리 매칭 없음
        (본문, "html") — 상품 카드 HTML
        (본문, "text") — 상품 없음 등 일반 문장
    """
    try:
        from chatbot_integration import build_category_aware_context
    except ImportError:
        return None, None

    try:
        ctx = build_category_aware_context(user_input, fetch_products=True, product_page_size=5)
    except Exception as e:  # noqa: BLE001
        print(f"  [쇼핑 카테고리] API/캐시 오류: {e}")
        return None, None

    m = ctx.get("matched")
    if not m:
        return None, None

    items_raw = ctx.get("items_raw")
    if items_raw:
        import html as html_module

        from product_bridge import format_items_as_html_cards

        content = items_raw.get("content") or []
        if not content:
            return "해당 카테고리에서 조회된 상품이 없습니다.", "text"
        nm = (m.get("name") or "").strip()
        intro = ""
        if nm:
            intro = (
                f'<p class="shop-reply-intro">「{html_module.escape(nm)}」 추천 상품이에요. '
                "썸네일 또는 「상품 상세 보기」를 눌러 주세요.</p>"
            )
        return intro + format_items_as_html_cards(items_raw), "html"
    return "해당 분야 상품을 더 찾으시려면 쇼핑몰에서 카테고리 메뉴를 이용해 주세요.", "text"


# ── TF-IDF + KoBERT 결합 함수 ─────────────
def get_answer(user_input, tfidf_threshold=0.05, top_k=20):

    # 모호한 지칭사 감지
    vague_patterns = [
        r'^(그거|이거|저거|그것|이것|저것)',
        r'^(네|아|예)\s.*(그거|이거|저거)',
        r'^(그|이|저)\s?거\s',
    ]
    for pattern in vague_patterns:
        if re.search(pattern, user_input.strip()):
            log_unknown_query(user_input, reason="모호한 지칭사")
            return "무엇에 대해 궁금하신가요? 렌탈, 경매, 배송, 회원 관련 질문을 구체적으로 말씀해 주시면 도움드릴게요 😊", "text"

    # 부정 표현 감지
    negative_patterns = [
        r'(안\s*하고\s*싶|하기\s*싫|안\s*할래|필요\s*없|하지\s*않)',
    ]
    for pattern in negative_patterns:
        if re.search(pattern, user_input.strip()):
            return "혹시 다른 도움이 필요하신가요? 렌탈, 경매, 배송, 회원 관련 질문을 말씀해 주세요 😊", "text"

    # ── 감정/불만/비정상 표현 감지 ─────────────
    angry_patterns = [
        r'(내놔|내놓아|돌려내|돌려줘|환불해|환불해줘)',
        r'(사기|거짓말|속았|짜증|화나|열받|어이없)',
        r'(왜이래|왜이러|뭐하는|말이돼|말이되)',
        r'(어떻게이래|너무하|황당|당장|빨리내)',
    ]
    for pattern in angry_patterns:
        if re.search(pattern, user_input.strip()):
            log_unknown_query(user_input, reason="감정/불만 표현")
            return "CATEGORY_BUTTON", "text"  # 카테고리 버튼 + 상담원 연결 표시

    # 날씨·기온 기반 코디 → 실시간 기상 + 카테고리별 상품 카드
    try:
        from weather_outfit import build_weather_outfit_html

        wx_reply, wx_fmt = build_weather_outfit_html(user_input)
        if wx_reply is not None:
            return wx_reply, wx_fmt
    except ImportError as e:
        print(f"  [날씨 코디] 모듈 없음: {e}")

    # 의류(미구분) → 상의·아우터·바지·원피스/스커트 선택 후 추천
    if _clothing_choice_needed(user_input):
        return "CLOTHING_CHOICE_BUTTON", "text"

    # 카테고리 롤백 UI 「상품 문의」 버튼 — 항상 상품 카테고리 선택(롤백)만 표시
    _btn = re.sub(r"\s+", "", user_input.strip())
    if _btn in ("상품문의",):
        print("  [상품 문의] 버튼 → 상품 카테고리 롤백")
        return "PRODUCT_CHOICE_BUTTON", "text"

    # 쇼핑몰 관리자 카테고리 DB(/api/categories 캐시) — 렌탈 Q&A와 별도 파이프라인
    shop_reply, shop_fmt = _try_shopping_category_response(user_input)
    if shop_reply is not None:
        return shop_reply, shop_fmt

    # ── 상품 문의 감지 → 상품 카테고리 롤백 (CS/FAQ 의도는 제외) ────
    # '문의' 단독은 제외: '문의사항' 등이 상품 롤백으로 잘못 가는 것 방지(→ 아래 CATEGORY_BUTTON).
    product_inquiry_keywords = [
        "상품", "제품", "물건", "구매", "쇼핑", "옷", "패션",
        "신발", "가방", "소품", "스포츠", "레저", "부티크",
        "추천해줘", "추천해주", "뭐 있어", "뭐가 있", "어떤 거",
        "살려고", "사고 싶", "사고싶", "구입",
    ]
    _cs_or_faq_intent_keywords = (
        "AS", "하자", "고장", "불량", "설명과", "누락", "부속품", "세탁", "수선",
        "교환", "반품", "환불", "취소", "배송", "택배", "결제", "주문", "낙찰",
        "회원가입", "탈퇴", "약관", "이용약관", "챗봇", "고객센터", "현금영수증",
        "세금계산서", "렌탈료", "해지", "포인트", "적립금", "민원", "불만",
        "개인정보", "비밀번호",
    )
    has_product_keyword = any(kw in user_input for kw in product_inquiry_keywords)
    has_cs_faq_intent = any(kw in user_input for kw in _cs_or_faq_intent_keywords)
    if has_product_keyword and not has_cs_faq_intent:
        print(f"  상품 문의 감지 → 상품 카테고리 롤백!")
        return "PRODUCT_CHOICE_BUTTON", "text"

    # ── 서비스 관련 키워드 없으면 → 롤백 ───────
    service_keywords = [
        "렌탈", "경매", "배송", "반납", "환불", "취소", "반품",
        "포인트", "회원", "로그인", "비밀번호", "계정", "쿠폰",
        "배달", "택배", "낙찰", "입찰", "보증금", "요금", "납부",
        "위약금", "연체", "해지", "신청", "등급", "적립", "가입",
        "주문", "결제", "교환", "AS", "상담", "약관", "이용",
        "고장", "하자", "불량", "세금", "현금영수증", "할부",
    ]
    has_service_keyword = any(kw in user_input for kw in service_keywords)
    # CS/FAQ 의도(하자·설명 불일치 등)인데 '렌탈' 같은 서비스 단어가 없으면
    # 여기서 막히면 FAQ 매칭 전에 CATEGORY_BUTTON으로 떨어짐 → 예외 처리
    if not has_service_keyword and not has_cs_faq_intent:
        print(f"  서비스 키워드 없음 → 롤백!")
        log_unknown_query(user_input, reason="서비스 키워드 없음")
        return "CATEGORY_BUTTON", "text"

    # 결제 수단 개별 질문 — 짧은 문장은 TF-IDF 임계 미달로 오답 방지
    _pay_compact = re.sub(r"\s+", "", user_input.strip())
    if _pay_compact in (
        "신용카드로결제되?",
        "체크카드로결제되?",
        "간편결제로결제되?",
    ):
        return (
            "결제 화면에 표시된 수단으로 결제 가능합니다. 일부 상품·서비스는 제한될 수 있습니다.",
            "text",
        )

    if _pay_compact == "결제문의":
        return (
            "브라우저 캐시 삭제·다른 브라우저 이용·네트워크 확인 후 재시도해 주세요. 지속되면 상담원 연결을 해주세요.",
            "text",
        )

    # 1차: TF-IDF 후보 추리기
    user_tfidf   = tfidf_vectorizer.transform([user_input])
    tfidf_scores = cos_sim(user_tfidf, tfidf_matrix)[0]
    top_indices  = np.argsort(tfidf_scores)[::-1][:top_k]
    top_scores   = tfidf_scores[top_indices]

    if top_scores[0] < tfidf_threshold:
        print(f"  TF-IDF 점수: {top_scores[0]:.3f} → 차단!")
        log_unknown_query(user_input, reason="TF-IDF 점수 미달")
        return "죄송합니다. 렌탈·경매 관련 질문만 답변 가능합니다.", "text"

    print(f"  TF-IDF 1차 통과 (최고점: {top_scores[0]:.3f})")

    # 카테고리 필터링 (핵심 개선!)
    detected_cats = detect_category(user_input)
    if detected_cats:
        filtered = [i for i in top_indices if categories[i] in detected_cats]
        if len(filtered) >= 3:
            top_indices = np.array(filtered[:top_k])
            print(f"  카테고리 필터: {detected_cats} → {len(filtered)}개로 좁힘")
        else:
            print(f"  카테고리 필터 후보 부족 → 전체 후보 유지")
    else:
        print(f"  카테고리 감지 안됨 → 전체 후보 유지")

    # 2차: KoBERT로 최적 선택
    user_emb             = get_embedding(user_input)
    candidate_embeddings = question_embeddings[top_indices]
    kobert_scores        = cos_sim(user_emb, candidate_embeddings)[0]
    best_local_idx       = np.argmax(kobert_scores)
    best_idx             = top_indices[best_local_idx]
    best_score           = kobert_scores[best_local_idx]

    print(f"  KoBERT 2차 유사도: {best_score:.3f}")
    print(f"  매칭된 질문: {questions[best_idx]}")

    # KoBERT 유사도 낮으면 → 롤백!
    if best_score < 0.88:
        log_unknown_query(user_input, reason=f"KoBERT 유사도 낮음({best_score:.3f})")
        return "CATEGORY_BUTTON", "text"

    return answers[best_idx], "text"

# ── 테스트 (직접 실행할 때만 동작) ─────────
if __name__ == "__main__":

    print("=" * 55)
    print("테스트 1 — 비슷한 표현 (다양한 말투)")
    print("=" * 55)
    test_1 = [
        "렌탈 어떻게 신청해?",
        "렌탈 신청하고 싶은데요",
        "렌탈 하는 법 좀 알려주실래요?",
        "렌탈 절차가 어떻게 되나요?",
        "렌탈 하려면 뭐 해야 돼?",
        "렌탈은 어떻게 하는거야?",
        "경매 어떻게 해?",
        "경매 참가 방법이 뭐예요?",
        "배송 며칠 걸려요?",
        "배송 기간이 어떻게 되나요?",
        "포인트 사용 방법 알려주세요",
    ]
    for q in test_1:
        print(f"\n질문: {q}")
        ans, _fmt = get_answer(q)
        print(f"답변: {ans}")

    print("\n" + "=" * 55)
    print("전체 테스트 완료!")