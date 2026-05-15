#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import sys
import urllib.error
from typing import Any, Dict, List, Optional

from musinsa_brand_crawler import crawl_brands
from musinsa_category_crawler import crawl_categories
from musinsa_item_crawler import crawl_item_images, crawl_item_nos_only, crawl_items_with_metrics
from musinsa_tag_crawler import crawl_tags


def build_response(
    mode: str,
    category_code: Optional[str] = None,
    page: int = 1,
    item_no: Optional[str] = None,
) -> Dict[str, Any]:
    categories: List[Dict[str, Any]] = []
    brands: List[Dict[str, Any]] = []
    items: List[Dict[str, Any]] = []
    tags: Dict[str, Dict[str, Any]] = {}
    timings: Dict[str, Any] = {}
    catalog_total_count: int = 0

    if mode in ("all", "category"):
        categories = crawl_categories()

    if mode in ("all", "brand"):
        brands = crawl_brands()

    if mode == "item":
        if not category_code:
            raise ValueError("item mode requires category")
        item_result = crawl_items_with_metrics(category_code, page=page)
        items = item_result.get("items", [])
        timings["item"] = item_result.get("timings", {})

    if mode == "itemlist":
        if not category_code:
            raise ValueError("itemlist mode requires category")
        itemlist_result = crawl_item_nos_only(category_code, page=page)
        items = itemlist_result.get("items", [])
        catalog_total_count = itemlist_result.get("catalogTotalCount", 0)

    if mode == "item-image":
        if not item_no:
            raise ValueError("item-image mode requires item-no")
        image_item = crawl_item_images(item_no)
        items = [image_item] if image_item else []

    if mode == "tag":
        if not category_code:
            raise ValueError("tag mode requires category")
        tags = crawl_tags(category_code)

    tag_count = sum(len(group.get("list", [])) for group in tags.values()) if tags else 0

    return {
        "source": "musinsa",
        "categoryCount": len(categories),
        "brandCount": len(brands),
        "itemCount": len(items),
        "tagGroupCount": len(tags),
        "tagCount": tag_count,
        "catalogTotalCount": catalog_total_count,
        "categories": categories,
        "brands": brands,
        "items": items,
        "tags": tags,
        "timings": timings,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--mode",
        choices=("all", "category", "brand", "item", "itemlist", "item-image", "tag"),
        default="all",
        help="crawler mode",
    )
    parser.add_argument(
        "--category",
        default=None,
        help="item/tag category code",
    )
    parser.add_argument(
        "--page",
        type=int,
        default=1,
        help="item crawl page number (default: 1)",
    )
    parser.add_argument(
        "--item-no",
        default=None,
        help="single item number for item-image mode",
    )
    args = parser.parse_args()

    try:
        result = build_response(args.mode, args.category, args.page, args.item_no)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except urllib.error.HTTPError as exc:
        print(
            json.dumps(
                {
                    "message": "remote request failed",
                    "status": exc.code,
                    "reason": str(exc),
                },
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return 1
    except urllib.error.URLError as exc:
        print(
            json.dumps(
                {
                    "message": "remote connection failed",
                    "reason": str(exc),
                },
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return 1
    except Exception as exc:
        print(
            json.dumps(
                {
                    "message": "crawl failed",
                    "reason": str(exc),
                },
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
