"""카테고리 코드로 상품 목록 조회 (Spring GET /api/items)"""
from __future__ import annotations

import html
from typing import Any
from urllib.parse import urljoin

import requests

from config import API_BASE_URL, IMAGE_BASE_URL, SHOP_FRONTEND_BASE_URL


def fetch_items_by_category(
    category_code: str,
    *,
    page: int = 0,
    size: int = 10,
    base_url: str | None = None,
) -> dict[str, Any]:
    base = (base_url or API_BASE_URL).rstrip("/")
    params = {"page": page, "size": size, "categoryCode": category_code}
    r = requests.get(f"{base}/api/items", params=params, timeout=60)
    r.raise_for_status()
    return r.json()


def _absolute_image_url(path: str | None, api_base: str) -> str | None:
    if not path or not str(path).strip():
        return None
    p = str(path).strip()
    if p.startswith("http://") or p.startswith("https://"):
        return p
    base = api_base.rstrip("/") + "/"
    return urljoin(base, p.lstrip("/"))


def item_detail_page_url(item_id: int | None, frontend_base: str | None = None) -> str:
    """브라우저에서 직접 열 쇼핑몰 절대 URL (리다이렉트 설정·문서용)."""
    base = (frontend_base or SHOP_FRONTEND_BASE_URL).rstrip("/")
    if item_id is None:
        return base + "/shop"
    return f"{base}/product/{int(item_id)}"


def chat_goto_product_path(item_id: int | None) -> str:
    """상품 상세 페이지 — React Router 경로 /product/<id> 직접 사용."""
    if item_id is None:
        return "/shop"
    return f"/product/{int(item_id)}"


def format_items_for_llm(payload: dict[str, Any], max_items: int = 5) -> str:
    """챗봇 컨텍스트에 넣을 짧은 요약 문자열. (PageResponse JSON: content[])"""
    content = payload.get("content") or []
    lines: list[str] = []
    for i, it in enumerate(content[:max_items], 1):
        name = it.get("name") or str(it)
        item_id = it.get("id")
        item_no = it.get("itemNo")
        lines.append(f"{i}. id={item_id}, 상품번호={item_no}, {name}")
    if not lines:
        return "해당 카테고리에서 조회된 상품이 없습니다."
    return "\n".join(lines)


def format_items_as_html_cards(
    payload: dict[str, Any],
    *,
    max_items: int = 5,
    api_base: str | None = None,
) -> str:
    """채팅 UI용: 썸네일 + 상품명 + 상세 페이지 링크 (Flask 템플릿 innerHTML)."""
    api = (api_base or API_BASE_URL).rstrip("/")
    img_base = IMAGE_BASE_URL.rstrip("/")
    content = payload.get("content") or []
    cards: list[str] = []
    for it in content[:max_items]:
        name = it.get("name") or ""
        item_id = it.get("id")
        img_raw = it.get("img")
        img_url = _absolute_image_url(img_raw, img_base)
        detail = chat_goto_product_path(item_id)
        safe_name = html.escape(name, quote=True)
        thumb = (
            f'<img src="{html.escape(img_url, quote=True)}" alt="" loading="lazy" referrerpolicy="no-referrer" />'
            if img_url
            else '<div class="shop-no-img" aria-hidden="true">📦</div>'
        )
        item_no = it.get("itemNo") or ""
        safe_item_no = html.escape(item_no, quote=True)
        display_name = f"{safe_name} / {safe_item_no}" if item_no else safe_name
        cards.append(
            '<div class="shop-product-card">'
            f'<a class="shop-thumb-link" href="{html.escape(detail, quote=True)}" target="_blank" rel="noopener noreferrer">{thumb}</a>'
            '<div class="meta">'
            f'<a class="name name-link" href="{html.escape(detail, quote=True)}" target="_blank" rel="noopener noreferrer">{display_name}</a>'
            f'<a class="detail-link" href="{html.escape(detail, quote=True)}" target="_blank" rel="noopener noreferrer">상품 상세 보기</a>'
            "</div></div>"
        )
    if not cards:
        return ""
    return '<div class="shop-product-cards">' + "".join(cards) + "</div>"
