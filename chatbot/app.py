from flask import Flask, redirect, request, jsonify, render_template

from config import SHOP_FRONTEND_BASE_URL
from kobert_similarity import get_answer

app = Flask(__name__)

# 선택: pip install flask-cors — 없으면 로컬·Vite 프록시(/chatbot)만으로도 동작
try:
    from flask_cors import CORS

    CORS(app, resources={r"/*": {"origins": "*"}})
except ImportError:
    print(
        "[안내] flask-cors 미설치: python -m pip install flask-cors "
        "(프론트를 다른 도메인 URL로 직접 붙일 때만 필요)"
    )

print("챗봇 서버 준비 완료!")

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
@app.route("/chatbot/health", methods=["GET"])
def health():
    """프론트에서 서버 연결(온라인) 여부 확인용 — 가벼운 응답만 반환."""
    return jsonify({"ok": True, "service": "chatbot"})


@app.route("/goto/shop")
def goto_shop():
    """쇼핑몰 메인(목록)으로 이동 — 상품 카드에서 id 없을 때 등."""
    return redirect(f"{SHOP_FRONTEND_BASE_URL.rstrip('/')}/shop", code=302)


@app.route("/goto/product/<int:item_id>")
def goto_product(item_id: int):
    """채팅의 '상품 상세 보기' → 실제 쇼핑몰 상세 URL로 리다이렉트."""
    url = f"{SHOP_FRONTEND_BASE_URL.rstrip('/')}/product/{item_id}"
    return redirect(url, code=302)

@app.route("/chat", methods=["POST"])
@app.route("/chatbot/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "")
    answer, answer_format = get_answer(user_input)

    # 카테고리 버튼 표시 신호
    if answer == "CATEGORY_BUTTON":
        return jsonify({
            "answer": "어떤 것이 궁금하신가요? 아래에서 선택해 주세요 😊",
            "answer_format": "text",
            "buttons": [
                {"label": "🛒 렌탈 신청", "query": "렌탈 신청은 어떻게 하나요?"},
                {"label": "💰 렌탈 요금", "query": "렌탈 요금은 어떻게 되나요?"},
                {"label": "🔨 입찰 참여", "query": "경매 참여하려면 어떻게 해요?"},
                {"label": "🚚 배송", "query": "배송은 보통 며칠 걸리나요?"},
                {"label": "🔄 취소·교환·반품", "query": "주문 취소는 언제까지 가능한가요?"},
                {"label": "📦 상품·AS", "query": "렌탈 상품이 고장 났어요."},
                {"label": "🛍️ 상품 문의", "query": "상품 문의"},
                {"label": "💳 주문·결제", "query": "어떤 결제 수단을 쓸 수 있나요?"},
                {"label": "👤 회원 정보", "query": "회원가입은 무료인가요?"},
                {"label": "📞 상담원 연결", "query": "AGENT"},
            ]
        })

    if answer == "PRODUCT_CHOICE_BUTTON":
        return jsonify({
            "answer": "어떤 상품을 찾으시나요? 아래에서 선택해 주세요 😊",
            "answer_format": "text",
            "button_style": "product-choice",
            "buttons": [
                {"label": "👟 신발",          "query": "신발 추천해줘"},
                {"label": "👕 상의",          "query": "상의 추천해줘"},
                {"label": "🧥 아우터",        "query": "아우터 추천해줘"},
                {"label": "👖 바지",          "query": "바지 추천해줘"},
                {"label": "👗 원피스/스커트", "query": "원피스/스커트 추천해줘"},
                {"label": "👜 가방",          "query": "가방 추천해줘"},
                {"label": "💍 소품",          "query": "소품 추천해줘"},
                {"label": "⚽ 스포츠/레저",   "query": "스포츠/레저 추천해줘"},
                {"label": "✨ 부티크",        "query": "부티크 추천해줘"},
            ]
        })

    if answer == "CLOTHING_CHOICE_BUTTON":
        return jsonify({
            "answer": "의류 중에서 어떤 종류를 찾으시나요? 아래에서 선택해 주세요 😊",
            "answer_format": "text",
            "button_style": "clothing-choice",
            "buttons": [
                {"label": "👕 상의",          "query": "상의 추천해줘"},
                {"label": "🧥 아우터",        "query": "아우터 추천해줘"},
                {"label": "👖 바지",          "query": "바지 추천해줘"},
                {"label": "👗 원피스/스커트", "query": "원피스/스커트 추천해줘"},
            ],
        })

    return jsonify({"answer": answer, "answer_format": answer_format, "buttons": []})

@app.route("/unknown-queries", methods=["GET"])
def unknown_queries():
    import json, os
    path = "data/unknown_queries.json"
    if not os.path.exists(path):
        return jsonify([])
    with open(path, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

if __name__ == "__main__":
    app.run(debug=False)