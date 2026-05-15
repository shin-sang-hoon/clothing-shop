"""터미널에서 동작 확인: python example_run.py"""
from chatbot_integration import build_category_aware_context, reload_categories_from_api

if __name__ == "__main__":
    n = reload_categories_from_api()
    print(f"카테고리 {n}건 동기화됨")
    for q in ["스킨케어 추천해줘", "신발 뭐 있어?", "그냥 잡담이야"]:
        ctx = build_category_aware_context(q)
        print("\n=== 질문:", q)
        print("매칭:", ctx["matched"])
        print("힌트:\n", ctx["system_hint"][:500], "...")
