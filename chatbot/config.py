"""백엔드(Spring) 기본 URL — movie-frontend / demo 백엔드 주소에 맞게 수정"""
import os

API_BASE_URL = os.environ.get("SHOP_API_BASE_URL", "http://localhost:8080")
# 쇼핑몰 사용자 화면 — /goto/product/<id> 리다이렉트 목적지 (movie-frontend vite: VITE_DEV_PORT 기본 80)
# 다른 포트로 띄우면 예: http://localhost:5173
SHOP_FRONTEND_BASE_URL = os.environ.get("SHOP_FRONTEND_BASE_URL", "http://localhost")
# 이미지 베이스 URL — /uploads/... 경로를 절대 URL로 변환할 때 사용
# 미설정 시 API_BASE_URL을 사용 (로컬 개발 환경)
IMAGE_BASE_URL = os.environ.get("SHOP_IMAGE_BASE_URL", API_BASE_URL)

# 날씨 기반 코디 추천 (Open-Meteo, 무료) — 위도·경도 기본값: 서울 시청 부근
WEATHER_LAT = float(os.environ.get("WEATHER_LAT", "37.5665"))
WEATHER_LON = float(os.environ.get("WEATHER_LON", "126.9780"))
WEATHER_LABEL = os.environ.get("WEATHER_LABEL", "서울")
