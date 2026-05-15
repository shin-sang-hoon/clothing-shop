"""
카테고리 DB(실제로는 Spring이 노출하는 /api/categories)를 캐시하고,
사용자 발화에서 카테고리명/코드와 가장 잘 맞는 항목을 찾는다.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

try:
    from rapidfuzz import fuzz as _rfuzz, process as _rprocess
    _HAS_RAPIDFUZZ = True
except ImportError:
    _HAS_RAPIDFUZZ = False

from config import API_BASE_URL

# 의류 롤백 버튼이 보내는 문장 → DB 카테고리명(정확 일치)으로 바로 매칭
_CLOTHING_PRESET_QUERIES: dict[str, str] = {
    "상의 추천해줘": "상의",
    "아우터 추천해줘": "아우터",
    "바지 추천해줘": "바지",
    "원피스/스커트 추천해줘": "원피스/스커트",
}


def _normalize_preset_query_key(text: str) -> str:
    t = re.sub(r"\s+", " ", text.strip())
    t = re.sub(r"[!?.,~]+$", "", t)
    return t.strip()


@dataclass(frozen=True)
class CategoryRow:
    id: int
    name: str
    code: str
    depth: int | None
    parent_id: int | None
    image_url: str | None
    sort_order: int | None


class CategoryKnowledgeBase:
    def __init__(self, cache_path: Path | None = None) -> None:
        self._cache_path = cache_path or Path(__file__).resolve().parent / "data" / "categories.json"
        self._rows: list[CategoryRow] = []
        self._by_name_key: dict[str, CategoryRow] = {}

    @property
    def count(self) -> int:
        return len(self._rows)

    def load_from_api(self, base_url: str | None = None) -> None:
        base = (base_url or API_BASE_URL).rstrip("/")
        r = requests.get(f"{base}/api/categories", timeout=30)
        r.raise_for_status()
        raw: list[dict[str, Any]] = r.json()
        self._rows = [
            CategoryRow(
                id=int(x["id"]),
                name=str(x["name"]),
                code=str(x["code"]),
                depth=x.get("depth"),
                parent_id=x.get("parentId"),
                image_url=x.get("imageUrl"),
                sort_order=x.get("sortOrder"),
            )
            for x in raw
        ]
        self._build_indexes()
        self._save_cache()

    def load_from_cache_file(self) -> bool:
        if not self._cache_path.is_file():
            return False
        data = json.loads(self._cache_path.read_text(encoding="utf-8"))
        self._rows = [
            CategoryRow(
                id=int(x["id"]),
                name=str(x["name"]),
                code=str(x["code"]),
                depth=x.get("depth"),
                parent_id=x.get("parentId"),
                image_url=x.get("imageUrl"),
                sort_order=x.get("sortOrder"),
            )
            for x in data
        ]
        self._build_indexes()
        return True

    def _build_indexes(self) -> None:
        self._by_name_key = {}
        for row in self._rows:
            for key in self._name_keys(row.name):
                if key not in self._by_name_key:
                    self._by_name_key[key] = row

    def _save_cache(self) -> None:
        self._cache_path.parent.mkdir(parents=True, exist_ok=True)
        payload = [
            {
                "id": r.id,
                "name": r.name,
                "code": r.code,
                "depth": r.depth,
                "parentId": r.parent_id,
                "imageUrl": r.image_url,
                "sortOrder": r.sort_order,
            }
            for r in self._rows
        ]
        self._cache_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    @staticmethod
    def _name_keys(name: str) -> list[str]:
        n = name.strip()
        if not n:
            return []
        keys = [n, re.sub(r"\s+", "", n)]
        return list(dict.fromkeys(keys))

    def match_user_text(self, user_text: str, score_cutoff: int = 72) -> tuple[CategoryRow | None, int]:
        """
        사용자 문장에서 카테고리명과 유사도가 가장 높은 항목을 고른다.
        rapidfuzz partial_ratio — 짧은 단어가 긴 문장 안에 포함될 때 유리.
        rapidfuzz 미설치 시 difflib.SequenceMatcher 로 폴백.
        """
        if not self._rows or not user_text.strip():
            return None, 0

        if _HAS_RAPIDFUZZ:
            choices = [r.name for r in self._rows]
            result = _rprocess.extractOne(
                user_text.strip(),
                choices,
                scorer=_rfuzz.partial_ratio,
                score_cutoff=score_cutoff,
            )
            if result is None:
                return None, 0
            name, score, _ = result
            for r in self._rows:
                if r.name == name:
                    return r, int(score)
            return None, 0
        else:
            from difflib import SequenceMatcher
            best_row: CategoryRow | None = None
            best_score = 0
            query = user_text.strip()
            for r in self._rows:
                ratio = SequenceMatcher(None, r.name, query).ratio()
                score = int(ratio * 100)
                if score > best_score:
                    best_score, best_row = score, r
            if best_score < score_cutoff:
                return None, 0
            return best_row, best_score

    def match_by_keyword_inclusion(self, user_text: str) -> CategoryRow | None:
        """문장에 카테고리명(공백 제거)이 그대로 포함되면 우선 선택."""
        compact = re.sub(r"\s+", "", user_text)
        candidates: list[CategoryRow] = []
        for r in self._rows:
            if not r.name:
                continue
            cname = re.sub(r"\s+", "", r.name)
            if len(cname) >= 2 and cname in compact:
                candidates.append(r)
        if not candidates:
            return None

        def _rank(row: CategoryRow) -> tuple[int, int, int]:
            d = row.depth if row.depth is not None else 999
            so = row.sort_order if row.sort_order is not None else 999
            return (d, so, row.id)

        return min(candidates, key=_rank)

    def match_preset_branch_query(self, user_text: str) -> CategoryRow | None:
        """롤백 버튼 전용 문장(상의 추천해줘 등) → 대표 카테고리 행을 확정한다."""
        key = _normalize_preset_query_key(user_text)
        want_name = _CLOTHING_PRESET_QUERIES.get(key)
        if not want_name:
            return None
        rows = [r for r in self._rows if r.name == want_name]
        if not rows:
            return None

        def _rank(row: CategoryRow) -> tuple[int, int, int]:
            d = row.depth if row.depth is not None else 999
            so = row.sort_order if row.sort_order is not None else 999
            return (d, so, row.id)

        return min(rows, key=_rank)

    def resolve(self, user_text: str) -> tuple[CategoryRow | None, int, str]:
        """
        (matched_row, score 0~100, reason)
        """
        preset = self.match_preset_branch_query(user_text)
        if preset is not None:
            return preset, 100, "preset_branch"
        inc = self.match_by_keyword_inclusion(user_text)
        if inc is not None:
            return inc, 100, "keyword_inclusion"
        row, score = self.match_user_text(user_text)
        if row is not None:
            return row, score, "fuzzy"
        return None, 0, "none"


def sync_categories_from_api(base_url: str | None = None) -> int:
    kb = CategoryKnowledgeBase()
    kb.load_from_api(base_url)
    return kb.count
