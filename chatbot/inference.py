import numpy as np
import tensorflow as tf

# ── 저장된 모델과 어휘 사전 불러오기 ──────────
model = tf.keras.models.load_model("saved_model/best_model.keras")
vocab = np.load("saved_model/vocab.npy", allow_pickle=True).item()

# 숫자 → 글자 변환용 역방향 사전
idx2char = {v: k for k, v in vocab.items()}

max_len = 30

# ── 전처리 함수 ────────────────────────────
def encode(sentence):
    tokens = list(sentence)
    numbers = [vocab.get(c, 0) for c in tokens]
    numbers = numbers[:max_len]
    numbers += [0] * (max_len - len(numbers))
    return numbers

# ── 답변 생성 함수 ──────────────────────────
def get_answer(question):
    # 질문 숫자로 변환
    q_encoded = np.array([encode(question)])

    # 답변 시작 토큰 준비
    a_input = np.zeros((1, max_len - 1))
    a_input[0][0] = vocab.get("<START>", 1)

    # 글자 하나씩 생성
    result = ""
    for i in range(max_len - 2):
        pred = model.predict(
            [q_encoded, a_input],
            verbose=0
        )
        next_idx = np.argmax(pred[0][i])
        next_char = idx2char.get(next_idx, "")

        if next_char in ["<END>", "<PAD>", ""]:
            break

        result += next_char

        if i + 1 < max_len - 1:
            a_input[0][i + 1] = next_idx

    return result if result else "죄송합니다. 다시 질문해 주세요."

# ── 테스트 ─────────────────────────────────
print("=" * 50)
print("챗봇 테스트 시작!")
print("=" * 50)

test_questions = [
    "렌탈 신청은 어떻게 하나요?",
    "경매 참여하려면 어떻게 해요?",
    "배송은 얼마나 걸리나요?",
    "렌탈료는 얼마예요?",
    "경매 취소가 되나요?"
]

for q in test_questions:
    answer = get_answer(q)
    print(f"\n질문: {q}")
    print(f"답변: {answer}")

print("\n" + "=" * 50)
print("테스트 완료!")