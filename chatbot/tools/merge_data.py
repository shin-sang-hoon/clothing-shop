import json

# ── 기존 데이터 불러오기 ───────────────────
with open("data/qa_data.json", "r", encoding="utf-8") as f:
    existing = json.load(f)

# ── K쇼핑 데이터 불러오기 ──────────────────
# 다운로드한 kshoping_converted.json을 data 폴더에 넣어주세요!
with open("data/kshoping_converted.json", "r", encoding="utf-8") as f:
    kshoping = json.load(f)

# ── 추가 데이터 불러오기 ───────────────────
with open("data/additional_data.json", "r", encoding="utf-8") as f:
    additional = json.load(f)

# ── 합치기 ────────────────────────────────
merged = existing + kshoping + additional

# ── 중복 제거 (같은 질문 제거) ─────────────
seen = set()
unique = []
for qa in merged:
    q = qa['question'].strip()
    if q not in seen:
        seen.add(q)
        unique.append(qa)

# ── 저장 ──────────────────────────────────
with open("data/qa_data.json", "w", encoding="utf-8") as f:
    json.dump(unique, f, ensure_ascii=False, indent=2)

# ── 결과 출력 ─────────────────────────────
from collections import Counter
cats = Counter([q['category'] for q in unique])

print(f"기존 데이터:     {len(existing)}개")
print(f"K쇼핑 데이터:    {len(kshoping)}개")
print(f"추가 데이터:     {len(additional)}개")
print(f"합친 후 총합:    {len(unique)}개 (중복 제거 완료)")
print(f"\n카테고리별 분포:")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}개")