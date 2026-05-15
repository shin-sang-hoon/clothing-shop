import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── 데이터 불러오기 ────────────────────────
with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

questions = [item["question"] for item in data]
answers   = [item["answer"]   for item in data]

# ── TF-IDF 벡터화 ──────────────────────────
vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(questions)

print(f"질문 데이터 수: {len(questions)}개")
print("유사도 모델 준비 완료!\n")

# ── 답변 찾기 함수 ─────────────────────────
def get_answer(user_input, threshold=0.1):
    # 사용자 입력을 벡터로 변환
    user_vec = vectorizer.transform([user_input])

    # 모든 질문과 유사도 계산
    similarities = cosine_similarity(user_vec, tfidf_matrix)[0]

    # 가장 유사한 질문 찾기
    best_idx   = np.argmax(similarities)
    best_score = similarities[best_idx]

    if best_score < threshold:
        return "죄송합니다. 관련 답변을 찾지 못했습니다. 다시 질문해 주세요."

    return answers[best_idx]

# ── 테스트 ─────────────────────────────────
print("=" * 50)
print("챗봇 테스트 시작!")
print("=" * 50)

test_questions = [
    "렌탈 신청은 어떻게 하나요?",
    "렌탈 어떻게 해요?",
    "경매 참여하려면 어떻게 해요?",
    "배송은 얼마나 걸리나요?",
    "렌탈료는 얼마예요?",
    "경매 취소가 되나요?",
    "비밀번호 잊어버렸어요",
    "포인트 어떻게 써요?"
]

for q in test_questions:
    answer = get_answer(q)
    print(f"\n질문: {q}")
    print(f"답변: {answer}")

print("\n" + "=" * 50)
print("테스트 완료!")