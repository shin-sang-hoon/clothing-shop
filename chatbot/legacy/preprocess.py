import json
import numpy as np

# 1. 데이터 불러오기
with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"데이터 개수: {len(data)}개")

# 2. 문장을 글자 단위로 토큰화
def tokenize(sentence):
    return list(sentence)  # "안녕" → ["안", "녕"]

# 3. 어휘 사전 만들기
vocab = {"<PAD>": 0, "<START>": 1, "<END>": 2}
idx = 3

for item in data:
    for char in tokenize(item["question"]) + tokenize(item["answer"]):
        if char not in vocab:
            vocab[char] = idx
            idx += 1

print(f"어휘 사전 크기: {len(vocab)}개")

# 4. 문장을 숫자로 변환
def encode(sentence, max_len=30):
    tokens = tokenize(sentence)
    numbers = [vocab.get(c, 0) for c in tokens]
    # 패딩: 길이를 max_len으로 맞춤
    numbers = numbers[:max_len]
    numbers += [0] * (max_len - len(numbers))
    return numbers

# 5. 전체 데이터 변환
questions = np.array([encode(item["question"]) for item in data])
answers   = np.array([encode(item["answer"])   for item in data])

print(f"질문 데이터 shape: {questions.shape}")
print(f"답변 데이터 shape: {answers.shape}")
print("\n첫 번째 질문 숫자 변환 결과:")
print(questions[0])

# 6. 저장
np.save("data/questions.npy", questions)
np.save("data/answers.npy",   answers)
np.save("data/vocab.npy",     vocab)
print("\n전처리 완료! data 폴더에 저장됐어요.")