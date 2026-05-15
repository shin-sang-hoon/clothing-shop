#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from typing import Any, Dict, List

from musinsa_crawler_common import (
    fetch_json,
    normalize_bool,
    normalize_brand_code,
    normalize_list_to_text,
    normalize_text,
)

BRAND_KR_URL = "https://static.msscdn.net/display/brand/brand-list.json?v=2026031318"
BRAND_EN_URL = "https://static.msscdn.net/display/brand/brand-list-eng.json?v=2026031318"


def collect_brands(kr_payload: Any, en_payload: Any) -> List[Dict[str, Any]]:
    kr_items = kr_payload if isinstance(kr_payload, list) else []
    en_items = en_payload if isinstance(en_payload, list) else []

    en_map: Dict[str, Dict[str, Any]] = {}
    for item in en_items:
        if not isinstance(item, dict):
            continue

        brand_id = normalize_text(item.get("id"))
        if brand_id:
            en_map[brand_id] = item

    results: List[Dict[str, Any]] = []

    for index, item in enumerate(kr_items, start=1):
        if not isinstance(item, dict):
            continue

        brand_id = normalize_brand_code(normalize_text(item.get("id")))
        if not brand_id:
            continue

        en_item = en_map.get(brand_id, {})

        name_ko = normalize_text(item.get("name"))
        name_en = normalize_text(item.get("englishName")) or normalize_text(en_item.get("englishName"))
        logo_image_url = normalize_text(item.get("logoImageUrl")) or normalize_text(en_item.get("logoImageUrl"))
        exclusive_yn = normalize_bool(item.get("isExclusive"))
        category_text = normalize_list_to_text(item.get("categoryList"))

        if not name_ko:
            continue

        results.append(
            {
                "rawId": brand_id,
                "code": brand_id,
                "nameKr": name_ko,
                "nameEn": name_en or brand_id.upper(),
                "displayOrder": index,
                "exclusiveYn": exclusive_yn,
                "logoImageUrl": logo_image_url,
                "categoryText": category_text,
            }
        )

    return results


def crawl_brands() -> List[Dict[str, Any]]:
    brand_kr_payload = fetch_json(BRAND_KR_URL)
    brand_en_payload = fetch_json(BRAND_EN_URL)
    return collect_brands(brand_kr_payload, brand_en_payload)
