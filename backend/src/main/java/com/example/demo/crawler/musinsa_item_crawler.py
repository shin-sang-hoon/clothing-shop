#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional

from musinsa_crawler_common import fetch_json, fetch_text, normalize_text

ITEM_LIST_URL_TEMPLATE = (
    "https://api.musinsa.com/api2/dp/v2/plp/goods"
    "?gf=A&category={category}&size=30&testGroup=&caller=CATEGORY&page=1&seen={seen}&seenAds="
)
ITEM_TAG_URL_TEMPLATE = "https://goods-detail.musinsa.com/api2/goods/{goods_no}/tags"
ITEM_OPTION_URL_TEMPLATE = "https://goods.musinsa.com/api2/review/v1/product/detail/filter?goodsNo={goods_no}"

NEXT_DATA_PATTERN = re.compile(
    r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
    re.DOTALL,
)


def crawl_item_nos_only(category_code: str, page: int = 1) -> Dict[str, Any]:
    """상세 정보 없이 goodsNo/goodsName 목록과 전체 상품 수를 빠르게 반환한다."""
    seen = (page - 1) * 30
    list_payload = fetch_json(ITEM_LIST_URL_TEMPLATE.format(category=category_code, seen=seen))
    goods_list = collect_goods_list(list_payload)
    total_count = extract_total_count(list_payload)
    items = [
        {"goodsNo": normalize_text(g.get("goodsNo")), "goodsName": normalize_text(g.get("goodsName"))}
        for g in goods_list
        if normalize_text(g.get("goodsNo"))
    ]
    return {"items": items, "catalogTotalCount": total_count}


def extract_total_count(payload: Any) -> int:
    try:
        return int(payload.get("data", {}).get("pagination", {}).get("totalCount", 0))
    except Exception:
        return 0


def crawl_items(category_code: str, page: int = 1) -> List[Dict[str, Any]]:
    result = crawl_items_with_metrics(category_code, page=page)
    return result.get("items", [])


def crawl_items_with_metrics(category_code: str, page: int = 1) -> Dict[str, Any]:
    started_at = time.perf_counter()

    item_list_started_at = time.perf_counter()
    seen = (page - 1) * 30
    list_payload = fetch_json(ITEM_LIST_URL_TEMPLATE.format(category=category_code, seen=seen))
    item_list_ms = int((time.perf_counter() - item_list_started_at) * 1000)
    goods_list = collect_goods_list(list_payload)

    crawled_items: List[Dict[str, Any]] = []
    failed_goods_count = 0

    def fetch_one(goods: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        goods_no = normalize_text(goods.get("goodsNo"))
        if not goods_no:
            return None
        goods_link_url = normalize_text(goods.get("goodsLinkUrl")) or f"https://www.musinsa.com/products/{goods_no}"

        # 상세페이지 · 태그 · 옵션 3개 요청을 동시에 실행
        with ThreadPoolExecutor(max_workers=3) as inner:
            f_detail = inner.submit(safe_fetch_text, goods_link_url)
            f_tag    = inner.submit(safe_fetch_json, ITEM_TAG_URL_TEMPLATE.format(goods_no=goods_no))
            f_option = inner.submit(safe_fetch_json, ITEM_OPTION_URL_TEMPLATE.format(goods_no=goods_no))
            detail_html    = f_detail.result()
            tag_payload    = f_tag.result()
            option_payload = f_option.result()

        detail_data = extract_detail_data(detail_html)
        return {
            "goodsNo": goods_no,
            "goodsName": normalize_text(goods.get("goodsName")) or normalize_text(detail_data.get("goodsNm")),
            "goodsLinkUrl": goods_link_url,
            "brandName": extract_brand_name(goods, detail_data),
            "brandCode": extract_brand_code(goods, detail_data),
            "categoryDepth1Name": extract_nested_text(detail_data, "category", "categoryDepth1Name"),
            "categoryDepth2Name": extract_nested_text(detail_data, "category", "categoryDepth2Name"),
            "categoryDepth2Code": extract_nested_text(detail_data, "category", "categoryDepth2Code"),
            "displayGenderText": normalize_text(goods.get("displayGenderText")) or extract_gender_text(detail_data),
            "normalPrice": to_int(goods.get("normalPrice")) or to_int(extract_nested(detail_data, "goodsPrice", "normalPrice")),
            "salePrice": to_int(goods.get("price")) or to_int(extract_nested(detail_data, "goodsPrice", "salePrice")),
            "thumbnailImageUrl": to_absolute_url(
                normalize_text(goods.get("thumbnail")) or normalize_text(detail_data.get("thumbnailImageUrl"))
            ),
            "goodsImageUrls": extract_goods_image_urls(detail_data),
            "goodsContents": normalize_text(detail_data.get("goodsContents")),
            "tags": extract_tag_names(tag_payload),
            "optionValues": extract_option_values(option_payload),
            "soldOut": bool(goods.get("isSoldOut")),
        }

    # 30개 상품을 최대 6개씩 병렬 처리
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fetch_one, g): g for g in goods_list}
        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    crawled_items.append(result)
            except Exception:
                failed_goods_count += 1

    total_ms = int((time.perf_counter() - started_at) * 1000)
    success_goods_count = len(crawled_items)
    total_goods_count = len(goods_list)

    return {
        "items": crawled_items,
        "timings": {
            "itemListMs": item_list_ms,
            "totalMs": total_ms,
            "totalGoodsCount": total_goods_count,
            "successGoodsCount": success_goods_count,
            "failedGoodsCount": failed_goods_count,
        },
    }


def crawl_item_images(goods_no: str) -> Optional[Dict[str, Any]]:
    normalized_goods_no = normalize_text(goods_no)
    if not normalized_goods_no:
        return None

    goods_link_url = f"https://www.musinsa.com/products/{normalized_goods_no}"
    detail_html = safe_fetch_text(goods_link_url)
    detail_data = extract_detail_data(detail_html)

    if not detail_data:
        return None

    thumbnail = to_absolute_url(normalize_text(detail_data.get("thumbnailImageUrl")))
    goods_image_urls = extract_goods_image_urls(detail_data)

    return {
        "goodsNo": normalized_goods_no,
        "goodsLinkUrl": goods_link_url,
        "thumbnailImageUrl": thumbnail,
        "goodsImageUrls": goods_image_urls,
        "goodsContents": normalize_text(detail_data.get("goodsContents")),
    }


def safe_fetch_json(url: str) -> Any:
    try:
        return fetch_json(url)
    except Exception:
        return {}


def safe_fetch_text(url: str) -> str:
    try:
        return fetch_text(url)
    except Exception:
        return ""


def collect_goods_list(payload: Any) -> List[Dict[str, Any]]:
    if not isinstance(payload, dict):
        return []

    data = payload.get("data")
    if not isinstance(data, dict):
        return []

    goods_list = data.get("list")
    if not isinstance(goods_list, list):
        return []

    return [item for item in goods_list if isinstance(item, dict)]


def extract_detail_data(html: str) -> Dict[str, Any]:
    if not html:
        return {}

    match = NEXT_DATA_PATTERN.search(html)
    if not match:
        return {}

    payload = json.loads(match.group(1))
    props = payload.get("props", {})
    page_props = props.get("pageProps", {})
    meta = page_props.get("meta", {})
    data = meta.get("data", {})

    return data if isinstance(data, dict) else {}


def extract_tag_names(payload: Any) -> List[str]:
    if not isinstance(payload, dict):
        return []

    data = payload.get("data")
    if not isinstance(data, dict):
        return []

    tags = data.get("tags")
    if not isinstance(tags, list):
        return []

    return [normalize_text(tag) for tag in tags if normalize_text(tag)]


def extract_goods_image_urls(detail_data: Dict[str, Any]) -> List[str]:
    goods_images = detail_data.get("goodsImages")
    if not isinstance(goods_images, list):
        return []

    image_urls: List[str] = []
    for image in goods_images:
        if not isinstance(image, dict):
            continue
        image_url = to_absolute_url(normalize_text(image.get("imageUrl")))
        if image_url:
            image_urls.append(image_url)

    return image_urls


def extract_option_values(payload: Any) -> List[Dict[str, Any]]:
    if not isinstance(payload, dict):
        return []

    data = payload.get("data")
    if not isinstance(data, dict):
        return []

    filter_option = data.get("filterOption")
    if not isinstance(filter_option, dict):
        return []

    option_values: List[Dict[str, Any]] = []
    array_keys = sorted(
        key for key, value in filter_option.items()
        if key.endswith("Options") and isinstance(value, list)
    )
    for option_key in array_keys:
        prefix = option_key[:-7] if option_key.endswith("Options") else option_key
        group_name = normalize_text(filter_option.get(f"{prefix}Name")) or normalize_text(option_key)
        option_values.extend(
            build_option_entries(
                group_name,
                filter_option.get(option_key),
            )
        )
    return option_values


def build_option_entries(group_name: Optional[str], options: Any) -> List[Dict[str, Any]]:
    if not group_name or not isinstance(options, list):
        return []

    entries: List[Dict[str, Any]] = []
    for option in options:
        if not isinstance(option, dict):
            continue
        value = normalize_text(option.get("name"))
        if not value:
            continue
        entries.append(
            {
                "groupName": group_name,
                "value": value,
            }
        )
    return entries


def extract_brand_name(goods: Dict[str, Any], detail_data: Dict[str, Any]) -> Optional[str]:
    return (
        normalize_text(goods.get("brandName"))
        or extract_nested_text(detail_data, "brandInfo", "brandName")
        or extract_nested_text(detail_data, "brandInfo", "brandEnglishName")
    )


def extract_brand_code(goods: Dict[str, Any], detail_data: Dict[str, Any]) -> Optional[str]:
    return normalize_text(goods.get("brand")) or normalize_text(detail_data.get("brand"))


def extract_gender_text(detail_data: Dict[str, Any]) -> Optional[str]:
    sex_values = detail_data.get("sex")
    if isinstance(sex_values, list) and sex_values:
        return normalize_text(sex_values[0])

    genders = detail_data.get("genders")
    if isinstance(genders, list) and genders:
        return normalize_text(genders[0])

    return None


def extract_nested(data: Dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def extract_nested_text(data: Dict[str, Any], *keys: str) -> Optional[str]:
    return normalize_text(extract_nested(data, *keys))


def to_absolute_url(url: Optional[str]) -> Optional[str]:
    normalized = normalize_text(url)
    if not normalized:
        return None

    if normalized.startswith("//"):
        return "https:" + normalized
    if normalized.startswith("/"):
        return "https://image.msscdn.net" + normalized

    return normalized


def to_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None
