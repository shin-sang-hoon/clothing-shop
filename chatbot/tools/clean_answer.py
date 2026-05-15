import json
import re
from collections import Counter

with open("data/qa_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"정제 전 총 데이터: {len(data)}개")

# K쇼핑 콜센터 답변 특유의 패턴
remove_patterns = [
    # 콜센터 답변 특유 표현
    lambda a: any(w in a for w in [
        '고객님', '상담사', '상담원',
        '말씀드릴', '잠시만요', '수고하십시오',
        '네 제품', '네 고객님', '아 고객님',
        '카드는 주말 공휴일', '삼 사일 안에 취소',
        '방송', '케이', '홈쇼핑'
    ]),

    # 숫자 금액이 들어간 K쇼핑 특유 답변
    lambda a: re.search(r'(만원|천원|백원|[0-9]+만|[0-9]+천)', a) is not None
              and any(w in a for w in ['주문', '결제하셨', '입금']),

    # 너무 긴 K쇼핑 대화체 답변 (200자 초과)
    lambda a: len(a) > 200,

    # K쇼핑 특유 답변 패턴
    lambda a: re.match(r'^(네|아|예)\s', a) is not None and len(a) < 50,
]

clean_data = []
removed = []

for item in data:
    a = item['answer'].strip()
    should_remove = False

    for pattern in remove_patterns:
        if pattern(a):
            should_remove = True
            break

    if should_remove:
        removed.append(item)
    else:
        clean_data.append(item)

print(f"제거된 데이터: {len(removed)}개")
print(f"정제 후 데이터: {len(clean_data)}개")

print("\n제거된 답변 샘플 30개:")
for item in removed[:30]:
    print(f"\n  [{item['category']}]")
    print(f"  Q: {item['question']}")
    print(f"  A: {item['answer'][:80]}...")

cats = Counter([q['category'] for q in clean_data])
print(f"\n정제 후 카테고리별 분포:")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}개")

print("\n정제된 데이터를 저장할까요?")
print("저장하려면 yes 입력, 취소하려면 no 입력")
answer = input("> ").strip().lower()

if answer == 'yes':
    with open("data/qa_data_backup2.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("기존 데이터 백업 완료! (qa_data_backup2.json)")

    with open("data/qa_data.json", "w", encoding="utf-8") as f:
        json.dump(clean_data, f, ensure_ascii=False, indent=2)
    print(f"정제 완료! ({len(clean_data)}개)")
else:
    print("저장 취소됐어요.")