import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as cos_sim
from transformers import AutoTokenizer, AutoModel
import torch

# ── 한글 폰트 설정 ─────────────────────────
plt.rcParams['axes.unicode_minus'] = False
for font in ['Malgun Gothic', 'NanumGothic', 'AppleGothic']:
    if font in [f.name for f in fm.fontManager.ttflist]:
        plt.rcParams['font.family'] = font
        break

# ── 데이터 불러오기 ────────────────────────
with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

questions  = [item["question"]  for item in data]
answers    = [item["answer"]    for item in data]
categories = [item["category"]  for item in data]

print("=" * 50)
print("1단계: TF-IDF 모델 준비 중...")
tfidf = TfidfVectorizer(
    stop_words=["어떻게", "어떻게요", "싶어요", "싶은데요",
                "언제", "얼마나", "있나요", "있어요",
                "되나요", "되요", "하나요", "해요"]
)
tfidf_matrix = tfidf.fit_transform(questions)
print("TF-IDF 준비 완료!")

# ── 카테고리 키워드 감지 함수 ──────────────
def detect_category(user_input):
    category_keywords = {
        "렌탈신청": ["렌탈", "빌리", "대여", "신청", "렌트", "빌려", "이용", "물건 빌"],
        "렌탈요금": ["요금", "렌탈료", "비용", "가격", "얼마", "납부", "자동이체", "금액", "해지", "위약금", "연체", "선납", "반납"],
        "경매참여": ["경매", "입찰", "낙찰", "보증금", "참여", "참가", "응찰", "최고가"],
        "경매환불": ["환불", "취소", "반품", "교환", "환급", "돌려", "취소되", "취소하", "반품하"],
        "배송수령": ["배송", "배달", "수령", "택배", "배송비", "도착", "받아볼"],
        "회원계정": ["포인트", "회원", "로그인", "비밀번호", "계정", "쿠폰", "등급", "적립", "탈퇴", "아이디", "비번", "가입"],
    }
    detected = []
    for cat, keywords in category_keywords.items():
        for kw in keywords:
            if kw in user_input:
                detected.append(cat)
                break
    return list(set(detected))

print("\n2단계: KoBERT 모델 로딩 중...")
MODEL_NAME = "snunlp/KR-ELECTRA-discriminator"
tokenizer  = AutoTokenizer.from_pretrained(MODEL_NAME)
model      = AutoModel.from_pretrained(MODEL_NAME)
model.eval()
print("KoBERT 로딩 완료!")

def get_embedding(text):
    inputs = tokenizer(text, return_tensors="pt",
                       padding=True, truncation=True, max_length=64)
    with torch.no_grad():
        out = model(**inputs)
    return out.last_hidden_state[:, 0, :].numpy()

print("\n3단계: 전체 질문 KoBERT 벡터화 중...")
q_embeddings = []
for i, q in enumerate(questions):
    q_embeddings.append(get_embedding(q)[0])
    if (i+1) % 100 == 0:
        print(f"  {i+1}/{len(questions)} 완료...")
q_embeddings = np.array(q_embeddings)
print("벡터화 완료!")

# ──────────────────────────────────────────
# [핵심 수정] 테스트 세트 정답 카테고리 수정
# - "렌탈 신청하고 배송은 얼마나 걸려요?" → 렌탈신청 (복합 질문, 렌탈이 주어)
# - "포인트로 렌탈료 낼 수 있나요?"       → 회원계정 (포인트 결제 = 회원계정 영역)
# ──────────────────────────────────────────
test_set = [
    ("렌탈 신청은 어떻게 하나요?",              "렌탈신청"),
    ("렌탈 어떻게 해요?",                       "렌탈신청"),
    ("제품 빌리고 싶어요",                      "렌탈신청"),
    ("렌탈 절차가 어떻게 되나요?",              "렌탈신청"),
    ("렌탈 하려면 뭐 해야 돼?",                 "렌탈신청"),
    ("경매 참여하려면 어떻게 해요?",             "경매참여"),
    ("입찰 어떻게 하나요?",                     "경매참여"),
    ("경매 어떻게 해?",                         "경매참여"),
    ("경매 참가 방법이 뭐예요?",                "경매참여"),
    ("보증금 돌려받을 수 있어요?",              "경매참여"),
    ("배송은 얼마나 걸려요?",                   "배송수령"),
    ("물건 언제 와요?",                         "배송수령"),
    ("배송 며칠 걸려요?",                       "배송수령"),
    ("배송 기간이 어떻게 되나요?",              "배송수령"),
    ("포인트 어떻게 써요?",                     "회원계정"),
    ("포인트 사용 방법 알려주세요",             "회원계정"),
    ("로그인이 안 돼요",                        "회원계정"),
    ("렌탈료는 언제 빠져나가나요?",             "렌탈요금"),
    ("돈 언제 빠져나가요?",                     "렌탈요금"),
    ("렌탈 중도 해지하면 환불은 얼마나 되나요?","렌탈요금"),
    ("경매 낙찰 후 취소하면 환불 되나요?",      "경매환불"),
    ("경매 환불되?",                            "경매환불"),
    ("배송 받았는데 파손됐어요 어떻게 해요?",   "경매환불"),
    ("이거 취소하고 싶은데요",                  "경매환불"),
    # 복합 질문 — 수정된 정답 카테고리
    ("렌탈 신청하고 배송은 얼마나 걸려요?",     "렌탈신청"),  # 수정: 배송수령 → 렌탈신청
    ("포인트로 렌탈료 낼 수 있나요?",           "회원계정"),  # 수정: 렌탈요금 → 회원계정
    ("회원가입하고 바로 경매 참여 가능한가요?",  "경매참여"),
    ("렌탈 기간 중에 이사가면 배송지 바꿀 수 있나요?", "렌탈신청"),
]

print("\n4단계: TF-IDF 단독 정확도 측정 중...")
tfidf_correct = 0
tfidf_results = []
for q, true_cat in test_set:
    scores   = cos_sim(tfidf.transform([q]), tfidf_matrix)[0]
    best_idx = np.argmax(scores)
    pred_cat = categories[best_idx]
    correct  = (pred_cat == true_cat)
    if correct:
        tfidf_correct += 1
    tfidf_results.append(correct)

tfidf_acc = tfidf_correct / len(test_set) * 100
print(f"TF-IDF 단독 정확도: {tfidf_acc:.1f}%")

print("\n5단계: TF-IDF + KoBERT 정확도 측정 중...")
kobert_correct = 0
kobert_results = []
for q, true_cat in test_set:
    user_vec     = tfidf.transform([q])
    tfidf_scores = cos_sim(user_vec, tfidf_matrix)[0]
    top_indices  = np.argsort(tfidf_scores)[::-1][:20]
    top_scores   = tfidf_scores[top_indices]

    # [핵심 수정] TF-IDF 완벽 매칭 시 KoBERT 생략
    if top_scores[0] >= 0.8:
        best_idx = top_indices[0]
        pred_cat = categories[best_idx]
    else:
        user_emb      = get_embedding(q)
        cand_embs     = q_embeddings[top_indices]
        kobert_scores = cos_sim(user_emb, cand_embs)[0]
        best_local    = np.argmax(kobert_scores)
        best_idx      = top_indices[best_local]
        pred_cat      = categories[best_idx]

    correct = (pred_cat == true_cat)
    if correct:
        kobert_correct += 1
    kobert_results.append(correct)

kobert_acc = kobert_correct / len(test_set) * 100
print(f"TF-IDF + KoBERT 정확도: {kobert_acc:.1f}%")

# ── 카테고리별 정확도 비교 ─────────────────
cat_list   = ["렌탈신청", "경매참여", "배송수령", "회원계정", "렌탈요금", "경매환불"]
cat_tfidf  = {c: {"total": 0, "correct": 0} for c in cat_list}
cat_kobert = {c: {"total": 0, "correct": 0} for c in cat_list}

for (q, true_cat), t_res, k_res in zip(test_set, tfidf_results, kobert_results):
    if true_cat in cat_list:
        cat_tfidf[true_cat]["total"]  += 1
        cat_kobert[true_cat]["total"] += 1
        if t_res: cat_tfidf[true_cat]["correct"]  += 1
        if k_res: cat_kobert[true_cat]["correct"] += 1

cat_tfidf_acc  = [
    (cat_tfidf[c]["correct"]  / cat_tfidf[c]["total"]  * 100)
    if cat_tfidf[c]["total"] > 0 else 0 for c in cat_list
]
cat_kobert_acc = [
    (cat_kobert[c]["correct"] / cat_kobert[c]["total"] * 100)
    if cat_kobert[c]["total"] > 0 else 0 for c in cat_list
]

print("\n6단계: 그래프 생성 중...")
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle("TF-IDF vs TF-IDF + KoBERT 성능 비교 분석", fontsize=16, fontweight='bold')

short = {
    '렌탈신청':'렌탈\n신청', '경매참여':'경매\n참여',
    '배송수령':'배송\n수령', '회원계정':'회원\n계정',
    '렌탈요금':'렌탈\n요금', '경매환불':'경매\n환불'
}
labels = [short[c] for c in cat_list]
x = np.arange(len(cat_list))
w = 0.35

# 그래프 1: 전체 정확도 비교
ax1 = axes[0, 0]
bars1 = ax1.bar(['TF-IDF\n단독', 'TF-IDF +\nKoBERT'],
                [tfidf_acc, kobert_acc],
                color=['#4A90D9', '#1D9E75'], width=0.4,
                edgecolor='white', linewidth=1.5)
ax1.set_title("전체 정확도 비교", fontsize=12, fontweight='bold')
ax1.set_ylabel("정확도 (%)")
ax1.set_ylim(0, 115)
ax1.grid(True, alpha=0.3, axis='y')
for bar, val in zip(bars1, [tfidf_acc, kobert_acc]):
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
             f'{val:.1f}%', ha='center', fontsize=13, fontweight='bold')
ax1.axhline(y=tfidf_acc,  color='#4A90D9', linestyle='--', alpha=0.5)
ax1.axhline(y=kobert_acc, color='#1D9E75', linestyle='--', alpha=0.5)

# 그래프 2: 카테고리별 정확도 비교
ax2 = axes[0, 1]
b1 = ax2.bar(x - w/2, cat_tfidf_acc,  w, label='TF-IDF 단독',
             color='#4A90D9', edgecolor='white')
b2 = ax2.bar(x + w/2, cat_kobert_acc, w, label='TF-IDF + KoBERT',
             color='#1D9E75', edgecolor='white')
ax2.set_title("카테고리별 정확도 비교", fontsize=12, fontweight='bold')
ax2.set_ylabel("정확도 (%)")
ax2.set_ylim(0, 120)
ax2.set_xticks(x)
ax2.set_xticklabels(labels, fontsize=9)
ax2.legend(fontsize=9)
ax2.grid(True, alpha=0.3, axis='y')
for bar in b1:
    if bar.get_height() > 0:
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                 f'{bar.get_height():.0f}%', ha='center', fontsize=8)
for bar in b2:
    if bar.get_height() > 0:
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                 f'{bar.get_height():.0f}%', ha='center', fontsize=8)

# 그래프 3: 질문별 정답/오답 비교
ax3 = axes[1, 0]
q_labels   = [f"Q{i+1}" for i in range(len(test_set))]
tfidf_bar  = [1 if r else 0 for r in tfidf_results]
kobert_bar = [1 if r else 0 for r in kobert_results]
x2 = np.arange(len(test_set))
ax3.bar(x2 - 0.2, tfidf_bar,  0.4,
        color=['#4A90D9' if v else '#FFAAAA' for v in tfidf_bar],
        edgecolor='white', label='TF-IDF')
ax3.bar(x2 + 0.2, kobert_bar, 0.4,
        color=['#1D9E75' if v else '#FFAAAA' for v in kobert_bar],
        edgecolor='white', label='KoBERT')
ax3.set_title(f"질문별 정답(1) / 오답(0) 비교 (총 {len(test_set)}개)", fontsize=12, fontweight='bold')
ax3.set_xlabel("질문 번호")
ax3.set_ylabel("정답 여부")
ax3.set_xticks(x2)
ax3.set_xticklabels(q_labels, fontsize=7, rotation=45)
ax3.set_ylim(0, 1.4)
ax3.legend(fontsize=9)
ax3.grid(True, alpha=0.3, axis='y')
ax3.text(len(test_set)*0.5, 1.25,
         f'TF-IDF: {tfidf_correct}/{len(test_set)}  |  KoBERT: {kobert_correct}/{len(test_set)}',
         ha='center', fontsize=11, fontweight='bold',
         bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))

# 그래프 4: 카테고리별 개선율
ax4 = axes[1, 1]
improvements = [k - t for t, k in zip(cat_tfidf_acc, cat_kobert_acc)]
colors_imp   = ['#1D9E75' if v >= 0 else '#E24B4A' for v in improvements]
bars_imp     = ax4.bar(labels, improvements, color=colors_imp,
                       edgecolor='white', linewidth=1.5)
ax4.set_title("KoBERT 적용 후 카테고리별 개선율 (%p)", fontsize=12, fontweight='bold')
ax4.set_ylabel("개선율 (%p)")
ax4.axhline(y=0, color='black', linewidth=0.8)
ax4.grid(True, alpha=0.3, axis='y')
for bar, val in zip(bars_imp, improvements):
    ax4.text(bar.get_x() + bar.get_width()/2,
             bar.get_height() + (1 if val >= 0 else -4),
             f'{val:+.0f}%p', ha='center', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig("performance_analysis.png", dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')

print("\n" + "=" * 50)
print("그래프 저장 완료: performance_analysis.png")
print(f"\n▶ TF-IDF 단독 정확도:      {tfidf_acc:.1f}% ({tfidf_correct}/{len(test_set)})")
print(f"▶ TF-IDF + KoBERT 정확도: {kobert_acc:.1f}% ({kobert_correct}/{len(test_set)})")
print(f"▶ 전체 개선율:             {kobert_acc - tfidf_acc:+.1f}%p")
print("\n카테고리별 결과:")
for c, t, k in zip(cat_list, cat_tfidf_acc, cat_kobert_acc):
    arrow = "→" if k == t else ("↑" if k > t else "↓")
    print(f"  {c}: {t:.0f}% {arrow} {k:.0f}% ({k-t:+.0f}%p)")
