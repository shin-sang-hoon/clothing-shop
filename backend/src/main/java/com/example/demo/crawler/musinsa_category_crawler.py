#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from typing import Any, Dict, List

from musinsa_crawler_common import fetch_json, normalize_text

CATEGORY_URL = "https://api.musinsa.com/api2/dp/v5/menu?tabId=category&gf=A"


def collect_categories(payload: Any) -> List[Dict[str, Any]]:
    if not isinstance(payload, dict):
        return []

    data = payload.get("data")
    if not isinstance(data, dict):
        return []

    root_items = data.get("list")
    if not isinstance(root_items, list):
        return []

    results: List[Dict[str, Any]] = []
    seen_codes = set()

    for root_index, root_item in enumerate(root_items, start=1):
        if not isinstance(root_item, dict):
            continue

        root_code = normalize_text(root_item.get("code"))
        root_name = normalize_text(root_item.get("title"))
        root_image_url = normalize_text(root_item.get("storeIconImage"))
        root_description = normalize_text(root_item.get("storeTitle"))

        if not root_code or not root_name:
            continue

        if root_code not in seen_codes:
            results.append(
                {
                    "depth": 1,
                    "name": root_name,
                    "code": root_code,
                    "parentCode": None,
                    "parentName": None,
                    "sortOrder": root_index,
                    "imageUrl": root_image_url,
                    "description": root_description,
                }
            )
            seen_codes.add(root_code)

        groups = root_item.get("list")
        if not isinstance(groups, list):
            continue

        child_sort_order = 0

        for group in groups:
            if not isinstance(group, dict):
                continue

            group_title = normalize_text(group.get("title"))
            child_items = group.get("list")

            if not isinstance(child_items, list):
                continue

            for child_item in child_items:
                if not isinstance(child_item, dict):
                    continue

                child_code = normalize_text(child_item.get("code"))
                child_name = normalize_text(child_item.get("title"))
                child_image_url = normalize_text(child_item.get("thumbnail"))

                if not child_code or not child_name:
                    continue

                if child_code in seen_codes:
                    continue

                child_sort_order += 1

                results.append(
                    {
                        "depth": 2,
                        "name": child_name,
                        "code": child_code,
                        "parentCode": root_code,
                        "parentName": root_name,
                        "sortOrder": child_sort_order,
                        "imageUrl": child_image_url,
                        "description": group_title,
                    }
                )
                seen_codes.add(child_code)

    return results


def crawl_categories() -> List[Dict[str, Any]]:
    category_payload = fetch_json(CATEGORY_URL)
    return collect_categories(category_payload)
