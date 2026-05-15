"""실시간 기상 (Open-Meteo, API 키 불필요) — 위도·경도 기준 현재값."""
from __future__ import annotations

from typing import Any

import requests

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"


def _wmo_weather_label(code: int | None) -> str:
    if code is None:
        return "정보 없음"
    # WMO Weather interpretation codes (Open-Meteo)
    if code == 0:
        return "맑음"
    if code in (1, 2, 3):
        return "구름 많음"
    if code in (45, 48):
        return "안개"
    if code in (51, 53, 55, 56, 57):
        return "이슬비"
    if code in (61, 63, 65, 66, 67, 80, 81, 82):
        return "비"
    if code in (71, 73, 75, 77, 85, 86):
        return "눈"
    if code in (95, 96, 99):
        return "뇌우"
    return "흐림"


def fetch_current_weather(lat: float, lon: float, *, timeout: int = 15) -> dict[str, Any]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code",
        "timezone": "Asia/Seoul",
    }
    r = requests.get(OPEN_METEO, params=params, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    cur = data.get("current") or {}
    return {
        "temp_c": cur.get("temperature_2m"),
        "apparent_c": cur.get("apparent_temperature"),
        "humidity": cur.get("relative_humidity_2m"),
        "weather_code": cur.get("weather_code"),
        "label": _wmo_weather_label(cur.get("weather_code")),
    }
