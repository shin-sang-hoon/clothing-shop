#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import time
import urllib.request
import urllib.error
from typing import Any, Optional

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/146.0.0.0 Safari/537.36"
)


def fetch_json(url: str) -> Any:
    body = fetch_text(url)
    return json.loads(body)


def fetch_text(url: str) -> str:
    last_error = None

    for attempt in range(4):
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json,text/plain,*/*",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                "Connection": "keep-alive",
                "Referer": "https://www.musinsa.com/",
            },
            method="GET",
        )

        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                body = response.read().decode(charset)
                return body
        except (urllib.error.HTTPError, urllib.error.URLError, ConnectionResetError) as exc:
            last_error = exc
            if attempt == 3:
                break
            time.sleep(1.2 * (attempt + 1))

    raise last_error


def normalize_text(value: Any) -> Optional[str]:
    if value is None:
        return None

    text = str(value).strip()
    return text if text else None


def normalize_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value

    if value is None:
        return False

    text = str(value).strip().lower()
    return text in ("true", "1", "y", "yes")


def normalize_brand_code(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    text = value.strip()
    return text if text else None


def normalize_list_to_text(values: Any) -> Optional[str]:
    if not isinstance(values, list):
        return None

    texts = [str(v).strip() for v in values if str(v).strip()]
    if not texts:
        return None

    return ", ".join(texts)
