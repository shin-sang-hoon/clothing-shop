"""
날씨·체감 온도에 맞춰 쇼핑 카테고리 상품(썸네일 + 상세 링크)을 제안한다.
WeatherFit류 UX의 단순 버전 — Open-Meteo + 기존 /api/items.
"""
from __future__ import annotations

import html as html_module
import re
from typing import Any

from config import WEATHER_LABEL, WEATHER_LAT, WEATHER_LON
from product_bridge import fetch_items_by_category, format_items_as_html_cards
from weather_service import fetch_current_weather


def _weather_outfit_intent(user_input: str) -> bool:
    t = user_input.strip()
    if "렌탈" in t or "경매" in t:
        return False
    has_w = bool(re.search(r"날씨|기온|체감|온도|기상", t))
    has_c = bool(re.search(r"옷|코디|의류|입을|입어|뭐\s*입|입지|차림|맞게|맞춰", t))
    if "옷차림" in t:
        return True
    if re.search(r"날씨에\s*맞", t):
        return True
    if has_w and has_c:
        return True
    return False


def _pick_categories(feels_like: float | None, temp: float | None) -> list[tuple[str, str]]:
    """(카테고리명, 한 줄 팁) — 체감 우선."""
    t = feels_like if feels_like is not None else temp
    if t is None:
        return [("상의", "기온 정보가 부족해 일반적인 상의를 골랐어요.")]

    if t < 5:
        return [
            ("아우터", "체감이 매우 낮아 보온이 필요해요."),
            ("상의", "이너로 레이어드하기 좋은 상의예요."),
            ("바지", "기모·데님 등 보온에 좋은 하의까지 함께 맞춰 보세요."),
        ]
    if t < 12:
        return [
            ("아우터", "쌀쌀해서 겉옷을 챙기면 좋아요."),
            ("상의", "가벼운 니트·맨투맨 등이 무난해요."),
            ("바지", "긴바지·슬랙스 등으로 하의 코디까지 챙기면 좋아요."),
        ]
    if t < 20:
        return [
            ("상의", "선선한 날씨에 맞는 상의예요."),
            ("바지", "일교차에 맞춰 바지도 함께 보세요."),
        ]
    if t < 26:
        return [
            ("상의", "활동하기 편한 상의가 좋아요."),
            ("바지", "가벼운 소재의 하의를 추천해요."),
        ]
    return [
        ("상의", "더운 날씨에 통풍이 좋은 상의를 골랐어요."),
        ("원피스/스커트", "가벼운 원피스·스커트도 좋아요."),
        ("바지", "반바지·얇은 면바지 등 시원한 하의도 함께 보세요."),
    ]


def _rainy(code: int | None) -> bool:
    if code is None:
        return False
    return code in (
        51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
    )


def build_weather_outfit_html(user_input: str) -> tuple[str | None, str | None]:
    if not _weather_outfit_intent(user_input):
        return None, None

    try:
        w = fetch_current_weather(WEATHER_LAT, WEATHER_LON)
    except Exception as e:  # noqa: BLE001
        print(f"  [날씨 API] {e}")
        return "실시간 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", "text"

    temp = w.get("temp_c")
    app = w.get("apparent_c")
    hum = w.get("humidity")
    label = w.get("label") or ""
    code = w.get("weather_code")

    tip_extra = ""
    if _rainy(code):
        tip_extra = " 비·눈이 예상돼 방수 아우터나 우산을 챙기면 좋아요."

    hum_txt = f", 습도 {hum}%" if hum is not None else ""
    t_str = f"{temp:.1f}°C" if isinstance(temp, (int, float)) else "—"
    a_str = f"{app:.1f}°C" if isinstance(app, (int, float)) else "—"

    intro = (
        f'<p class="shop-reply-intro weather-intro">'
        f"<strong>{html_module.escape(WEATHER_LABEL)}</strong> 기준 "
        f"현재 기온 <strong>{html_module.escape(t_str)}</strong>, "
        f"체감 <strong>{html_module.escape(a_str)}</strong>"
        f"{html_module.escape(hum_txt)}, "
        f"<strong>{html_module.escape(label)}</strong>예요.{html_module.escape(tip_extra)} "
        f"아래는 이런 날씨에 어울리는 카테고리 상품이에요. 썸네일·「상품 상세 보기」로 이동할 수 있어요."
        f"</p>"
    )

    pairs = _pick_categories(app if isinstance(app, (int, float)) else None, temp if isinstance(temp, (int, float)) else None)
    from chatbot_integration import get_kb

    kb = get_kb()
    sections: list[str] = [intro]

    for cat_name, tip in pairs:
        row = kb.match_preset_branch_query(f"{cat_name} 추천해줘")
        if row is None:
            r2, _, _ = kb.resolve(f"{cat_name} 추천해줘")
            row = r2
        if row is None:
            continue
        try:
            payload: dict[str, Any] = fetch_items_by_category(row.code, size=4)
        except Exception as e:  # noqa: BLE001
            print(f"  [날씨 코디] 상품 API: {e}")
            continue
        content = payload.get("content") or []
        if not content:
            continue
        tip_html = html_module.escape(tip)
        sections.append(f'<p class="shop-section-title">「{html_module.escape(cat_name)}」 — {tip_html}</p>')
        sections.append(format_items_as_html_cards(payload, max_items=4))

    if len(sections) <= 1:
        msg = (
            f"{WEATHER_LABEL} 기준 기온 {t_str}, 체감 {a_str}{hum_txt}, {label}. "
            "추천 카테고리 상품을 불러오지 못했습니다. 쇼핑몰에서 해당 카테고리를 확인해 주세요."
        )
        return msg, "text"

    return "".join(sections), "html"
