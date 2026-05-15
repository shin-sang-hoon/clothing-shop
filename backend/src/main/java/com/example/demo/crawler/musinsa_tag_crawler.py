#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from typing import Any, Dict

from musinsa_crawler_common import fetch_json

TAG_FILTER_URL_TEMPLATE = "https://api.musinsa.com/api2/dp/v1/plp/filter?gf=A&category={category}&caller=CATEGORY"


def collect_tag_groups(payload: Any) -> Dict[str, Dict[str, Any]]:
    if not isinstance(payload, dict):
        return {}

    data = payload.get("data")
    if not isinstance(data, dict):
        return {}

    detail = data.get("detail")
    if not isinstance(detail, dict):
        return {}

    return detail


def crawl_tags(category_code: str) -> Dict[str, Dict[str, Any]]:
    payload = fetch_json(TAG_FILTER_URL_TEMPLATE.format(category=category_code))
    return collect_tag_groups(payload)
