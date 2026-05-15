"""
기존 딥러닝 챗봇 파이프라인에 끼워 넣을 진입점.

사용 예:
  from chatbot_integration import build_category_aware_context

  ctx = build_category_aware_context("스킨케어 상품 추천해줘")
  # ctx["system_hint"] 를 시스템 프롬프트에 추가하거나
  # ctx["user_augmented"] 를 사용자 메시지 앞에 붙인다.
"""
from __future__ import annotations

from typing import Any

from category_knowledge import CategoryKnowledgeBase
from product_bridge import fetch_items_by_category, format_items_for_llm


_kb: CategoryKnowledgeBase | None = None


def get_kb() -> CategoryKnowledgeBase:
    global _kb
    if _kb is None:
        _kb = CategoryKnowledgeBase()
        if not _kb.load_from_cache_file():
            _kb.load_from_api()
    return _kb


def build_category_aware_context(
    user_message: str,
    *,
    fetch_products: bool = True,
    product_page_size: int = 5,
) -> dict[str, Any]:
    """
    Returns:
      matched: 카테고리 매칭 결과 (없으면 None)
      system_hint: LLM에 줄 배경 설명 (한국어)
      user_augmented: (선택) 사용자 질의 뒤에 붙일 요약
    """
    kb = get_kb()
    row, score, reason = kb.resolve(user_message)

    out: dict[str, Any] = {
        "matched": None,
        "match_score": 0,
        "match_reason": reason,
        "system_hint": "",
        "user_augmented": user_message,
        "items_raw": None,
    }

    if row is None:
        out["system_hint"] = (
            "사용자 질문에서 특정 쇼핑 카테고리(예: 스킨케어, 신발)가 명확히 드러나지 않았다. "
            "필요하면 어떤 종류 상품인지 한 번 더 물어본다."
        )
        return out

    out["matched"] = {
        "id": row.id,
        "name": row.name,
        "code": row.code,
        "depth": row.depth,
    }
    out["match_score"] = score
    out["match_reason"] = reason

    hint_parts = [
        f"사용자 질문이 쇼핑 카테고리 「{row.name}」(코드 {row.code})와 연관될 가능성이 높다 (판단 근거: {reason}, 점수 {score}).",
        "답변 시 이 카테고리 맥락을 반영하고, 구체 상품명이 필요하면 아래 목록을 참고한다.",
    ]

    if fetch_products:
        try:
            payload = fetch_items_by_category(row.code, size=product_page_size)
            out["items_raw"] = payload
            hint_parts.append(format_items_for_llm(payload))
        except Exception as e:  # noqa: BLE001
            hint_parts.append(f"(상품 목록 API 호출 실패: {e})")

    out["system_hint"] = "\n".join(hint_parts)
    return out


def reload_categories_from_api() -> int:
    """백엔드 카테고리가 갱신됐을 때 캐시 다시 받기."""
    global _kb
    _kb = CategoryKnowledgeBase()
    _kb.load_from_api()
    return _kb.count
