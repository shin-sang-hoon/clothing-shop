import json
import re
from collections import Counter

with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"정제 전 총 데이터: {len(data)}개")

# K쇼핑 콜센터 대화 특유의 패턴만 제거
# 우리가 만든 데이터는 절대 건드리지 않음
remove_patterns = [

    # 콜센터 용어 포함된 문장
    lambda q: any(w in q for w in [
        '고객님', '상담사이기', '상담원으로',
        '말씀드릴', '수박에', '잠시만요'
    ]),

    # "아 " 로 시작하는 K쇼핑 대화체 (30자 미만)
    lambda q: q.startswith('아 ') and len(q) < 30,

    # "네 " 로 시작하는 K쇼핑 대화체 (30자 미만)
    lambda q: q.startswith('네 ') and len(q) < 30,

    # K쇼핑 특유의 긴 대화 문장 (100자 이상)
    lambda q: len(q) > 100,
]

clean_data = []
removed = []

for item in data:
    q = item['question'].strip()
    should_remove = False

    for pattern in remove_patterns:
        if pattern(q):
            should_remove = True
            break

    if should_remove:
        removed.append(item)
    else:
        clean_data.append(item)

print(f"제거된 데이터: {len(removed)}개")
print(f"정제 후 데이터: {len(clean_data)}개")

print("\n제거된 문장 전체:")
for item in removed:
    print(f"  [{item['category']}] {item['question']}")

cats = Counter([q['category'] for q in clean_data])
print(f"\n정제 후 카테고리별 분포:")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}개")

print("\n정제된 데이터를 저장할까요?")
print("저장하려면 yes 입력, 취소하려면 no 입력")
answer = input("> ").strip().lower()

if answer == 'yes':
    with open("data/qa_data_backup.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("기존 데이터 백업 완료!")
    with open("data/qa_data.json", "w", encoding="utf-8") as f:
        json.dump(clean_data, f, ensure_ascii=False, indent=2)
    print(f"정제 완료! ({len(clean_data)}개)")
else:
    print("저장 취소됐어요.")