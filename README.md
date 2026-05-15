# 👕 MUREAM (무림)

> **의류 렌탈 · 경매 쇼핑몰 + AI 챗봇**  
> 무신사(스타일)와 크림(거래)을 결합한 컨셉의 풀스택 웹 서비스

<!-- 배지(샘플): 본인 저장소 이름으로 수정 후 주석 해제 -->
<!-- ![Last Commit](https://img.shields.io/github/last-commit/shin-sang-hoon/clothing-shop) -->
<!-- ![Top Language](https://img.shields.io/github/languages/top/shin-sang-hoon/clothing-shop) -->

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **프로젝트명** | MUREAM (무림) |
| **개발 기간** | 2026.03.09 ~ 2026.04.02 (약 25일) |
| **팀 구성** | 3인 |
| **나의 역할** | 백엔드(관리자/탈퇴), AI 챗봇, 크롤러, WebSocket, AWS 배포 |
| **배포 환경** | AWS S3 + CloudFront + EC2 |

### 한 줄 소개

> 렌탈 · 경매 · 일반 구매를 모두 지원하고, **TF-IDF + KoBERT 하이브리드 AI 챗봇**과 **실시간 날씨 기반 OOTD 추천**으로 상담 · 추천을 자동화한 의류 쇼핑몰 플랫폼.

---

## 🏗 시스템 아키텍처

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │◄────►│ Spring Boot API │◄────►│  Python Chatbot │
│   (Vite + TS)   │      │   (JPA + JWT)   │      │ (Flask + KoBERT)│
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │                        │
         │                ┌───────┴────────┐
         │                │                │
         │           ┌────▼────┐      ┌────▼────┐
         │           │  MySQL  │      │  Redis  │
         │           └─────────┘      └─────────┘
         │
         │  STOMP WebSocket (실시간 채팅)
         └─────────────────────────────────────────►
         
  🌐 배포: React → S3 → CloudFront / Spring Boot → EC2
```

---

## 🛠 기술 스택

### Backend
- **언어/프레임워크:** Java 17, Spring Boot, Spring Security
- **DB/ORM:** MySQL, Spring Data JPA (Hibernate), Redis
- **인증:** JWT (Access/Refresh), OAuth2 (Google / Kakao / Naver)
- **실시간:** STOMP WebSocket + SockJS
- **문서화:** Swagger (SpringDoc OpenAPI)

### Frontend
- **언어/프레임워크:** TypeScript, React 19, Vite
- **상태 관리:** Zustand
- **라우팅:** React Router v7
- **HTTP:** Axios (JWT 인터셉터 + 401 재로그인 처리)
- **결제:** PortOne V2

### AI Chatbot
- **언어:** Python 3.10
- **모델:** TF-IDF + KoBERT(KR-ELECTRA) **하이브리드**
- **프레임워크:** Flask, TensorFlow / Keras (legacy)
- **부가:** Open-Meteo API (날씨 기반 OOTD 추천)

### Crawler
- **수집:** Python `urllib.request` + `ThreadPoolExecutor` 병렬 처리
- **안정성:** 재시도 4회 + User-Agent 위장 + 정규식 기반 Next.js `__NEXT_DATA__` 추출
- **연동:** Spring Boot `ProcessBuilder` → 자식 프로세스로 Python 실행 → stdout JSON을 Jackson으로 역직렬화

### Infra / DevOps
- **클라우드:** AWS S3 (정적 호스팅) + CloudFront (CDN) + EC2 (백엔드)
- **컨테이너:** Docker (MySQL · Redis 환경 구성)

---

## 🙋‍♂️ 나의 주요 담당 영역

> 신입 개발자로서 백엔드 · AI · 인프라까지 폭넓게 담당하며 풀스택 통합 경험을 쌓았습니다.

### 1. 프론트엔드 AWS 배포 및 CloudFront CDN 구성
- React + Vite 빌드 → **S3 정적 호스팅** → **CloudFront CDN** 배포 전체 과정 수행
- `/api/*`, `/uploads/*`, `/ws/*` Behavior 규칙으로 EC2 백엔드 프록시 구성
- EC2 보안그룹 인바운드 규칙 관리, `.env` 환경변수 분리로 보안 강화

### 2. WebSocket 기반 실시간 채팅
- `ChatRoom · ChatMessage · ChatParticipant · ChatReport` **4개 도메인 ERD 설계**
- STOMP `/topic` (브로드캐스트), `/queue` (개인), `/app` (서버 수신) 라우팅 규칙 정의
- **JWT WebSocket 인증 인터셉터**(`WebSocketAuthChannelInterceptor`)로 인증된 사용자만 채팅 참여 허용
- 1:1 문의방 / 상품별 단체방을 `ChatRoomType enum(DIRECT/GROUP)`으로 분기 처리

### 3. AI 챗봇 (Python) 단계별 개발
- **Seq2Seq LSTM → TF-IDF → TF-IDF + KoBERT 하이브리드**로 단계 발전 (자세한 내용은 트러블슈팅 참고)
- **858개 QA 데이터셋 직접 구축** 및 6개 카테고리 키워드 필터링
- 임베딩 캐시(`embeddings_cache.npy`)로 응답 속도 최적화
- 유사도가 낮을 때는 **카테고리 버튼 폴백 UX**로 자연스러운 안내
- Open-Meteo API 연동 → 실시간 기온 · 체감온도 · 습도 기반 **OOTD 의류 추천**
- Flask 서버에서 Spring 백엔드의 `/api/categories`와 연동, 추천 상품 카드와 상세 링크까지 자동 매칭

### 4. 관리자 페이지 + 회원 탈퇴 정책 설계
- 이메일 · 이름 · 역할 · 상태별 **다중 검색 + 페이징 + CRUD**
- 회원 상태 `enum 3단계 (NORMAL · BLOCKED · WITHDRAWN)`, 인증 단계에서 차단 회원 로그인 거부
- **'보존 + 마스킹' 패턴** 직접 설계: DB에는 영구 보존, 응답 DTO 단계에서 탈퇴 회원의 이메일 · 이름 · 전화번호 · 주소를 `****`로 마스킹

### 5. 상품 크롤러 — Java ↔ Python 연동
- Python `urllib`로 외부 사이트 내부 JSON API를 직접 호출하는 **효율적 수집 구조** 설계
- `ThreadPoolExecutor` 멀티스레드 적용으로 상세 · 태그 · 옵션 3개 요청 병렬 처리
- 재시도 4회 + User-Agent 위장 + 정규식 기반 `__NEXT_DATA__` 추출로 안정성 확보
- Spring Boot `ProcessBuilder`로 Python을 자식 프로세스로 실행 → stdout JSON을 Jackson으로 역직렬화하는 **Java↔Python 연동 구조** 직접 구현

---

## 📸 주요 기능

| 기능 | 설명 |
|---|---|
| 회원 관리 | JWT 인증 + 소셜 로그인 (Google · Kakao · Naver) |
| 관리자 페이지 | 회원 검색 · 필터 · CRUD, 회원 상태 3단계 + 보존 마스킹 |
| 상품 | 렌탈 / 경매 / 일반 구매 분기, EC2 + CloudFront 이미지 |
| 실시간 채팅 | 1:1 관리자 문의 + 상품별 단체 채팅 (STOMP + SockJS) |
| AI 챗봇 | TF-IDF + KoBERT 하이브리드, 카테고리별 추천 |
| OOTD 추천 | 실시간 날씨 기반 의류 추천 → 상품 자동 매칭 |
| 상품 크롤러 | Python으로 외부 데이터 수집 후 자체 적재 (Java↔Python 연동) |

<!-- 시연 영상 / 스크린샷이 있다면 아래에 추가 -->
<!-- 🎬 **시연 영상:** https://youtu.be/... -->
<!-- 📷 **스크린샷:** `docs/screenshots/` 폴더 참고 -->

---

## 📁 프로젝트 구조

```
clothing-shop/
├── frontend/         # React 19 + Vite + TypeScript
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/          # Spring Boot + JPA
│   ├── src/main/java/com/example/demo/
│   │   ├── admin/        # 관리자 (회원 관리, 권한, 감사 로그)
│   │   ├── auth/         # JWT 인증/인가, OAuth2
│   │   ├── catalog/      # 상품 / 브랜드 / 카테고리 / 크롤러
│   │   ├── chat/         # WebSocket 실시간 채팅
│   │   ├── member/       # 회원 도메인
│   │   ├── rental/       # 렌탈 주문
│   │   ├── review/       # 리뷰 / 신고
│   │   └── trade/        # 입찰 경매 / 결제 (PortOne)
│   ├── pom.xml
│   └── compose.yaml
│
├── chatbot/          # Python AI 챗봇 (Flask)
│   ├── app.py                    # Flask 진입점
│   ├── kobert_similarity.py      # KoBERT 임베딩 + 유사도
│   ├── weather_service.py        # Open-Meteo 연동
│   ├── weather_outfit.py         # OOTD 추천 로직
│   ├── product_bridge.py         # Spring 백엔드 연동
│   ├── data/                     # 858개 QA 데이터
│   ├── legacy/                   # 초기 Seq2Seq LSTM
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## 🚀 실행 방법

### 사전 준비
- Java 17, Node.js 20+, Python 3.10, Docker Desktop

### 1) 백엔드 실행
```bash
cd backend
cp .env.properties.example .env.properties   # 환경변수 설정 후 값 입력
docker compose up -d                          # MySQL + Redis 실행
./mvnw spring-boot:run
```

### 2) 프론트엔드 실행
```bash
cd frontend
cp .env.example .env                          # 환경변수 설정
npm install
npm run dev
```

### 3) 챗봇 실행
```bash
cd chatbot
python -m venv venv
venv\Scripts\activate                          # Windows
# source venv/bin/activate                     # macOS / Linux
pip install -r requirements.txt
python app.py
```

### 환경변수 안내
- 각 폴더의 `.env.example` 참고
- OAuth2 클라이언트 ID / Secret은 Google / Kakao / Naver Developer 콘솔에서 발급

---

## 🤔 트러블슈팅

### AI 챗봇 Seq2Seq 모델의 답변 품질 문제

#### 문제
처음에는 **Seq2Seq LSTM** 모델로 챗봇을 구현했습니다. 300 epoch까지 학습시켰지만, 의류 도메인 질문에 대한 답변이 일관되지 않았고 같은 질문에도 매번 다른 답이 나오는 현상이 발생했습니다.

#### 원인
직접 구축한 **858개 QA 데이터셋**이 Seq2Seq 모델 학습에 필요한 양에 비해 너무 적었습니다. 일반적으로 Seq2Seq 같은 생성형 모델은 수십만 건 이상의 데이터가 필요한데, 도메인 특화 단어조차 충분히 학습되지 못한 상태였습니다.

#### 해결
검색해보니 **데이터가 적을 때는 검색형(retrieval-based) 모델이 더 안정적**이라는 자료를 찾았습니다. 생성형을 포기하고 다음과 같이 구조를 전면 개편했습니다.

1. **TF-IDF**로 858개 QA 중 후보 20개를 빠르게 추림 (1차 필터링)
2. **KoBERT(KR-ELECTRA)** 가 의미적 유사도로 최종 답변을 선택 (2차 정밀 검색)
3. **6개 카테고리 키워드 필터**로 의류 도메인 외 질문을 사전 차단
4. **유사도가 낮을 때는** 자연스러운 안내 메시지와 함께 **카테고리 버튼 폴백 UX** 제공
5. 자주 묻는 질문은 임베딩을 사전 계산하여 `embeddings_cache.npy`로 캐싱

#### 성과
- 답변 정확도가 눈에 띄게 향상되었고, 모호한 질문도 자연스럽게 카테고리 버튼으로 유도
- **응답 시간: 캐싱 적용 전 2~3초 → 적용 후 200ms 이내**
- **배운 점:** "모델 선택은 무조건 최신 기술이 아니라, 데이터 양과 도메인 특성에 맞춰야 한다"는 점을 처음으로 체감. 학교에서 배운 이론과 실제 프로덕션 환경의 차이를 실감한 경험이었습니다.

---

## 👥 팀 구성 및 역할 분담

| 이름 | 역할 | 담당 영역 |
|---|---|---|
| **황시영** | 조장 | 회원 도메인 (JWT 인증 · OAuth2 소셜 로그인), 결제 모듈 (PortOne V2), 프론트엔드 전체 아키텍처 (Vite 빌드 환경 · Zustand 상태 관리 · Axios 인터셉터), API 명세 / ERD 통합 · 일정 관리 |
| **김재혁** | 조원 | 상품 도메인 (브랜드 · 카테고리 · 필터 · 태그), **입찰 경매 시스템** (실시간 호가, BuyBid / SellBid), **렌탈 주문 시스템** (RentalOrder · 연체 감지 · 반납), 리뷰 / 신고, 메인 / 상품 상세 페이지 UI |
| **신상훈** (본인) | 조원 | 관리자 페이지 / 회원 탈퇴 정책, AI 챗봇 (Python), 상품 크롤러 (Java↔Python 연동), WebSocket 실시간 채팅, AWS S3 + CloudFront + EC2 배포 |

---

## 📚 참고 자료

- [KoBERT GitHub](https://github.com/SKTBrain/KoBERT)
- [Spring Security OAuth2 공식 문서](https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html)
- [PortOne V2 API](https://developers.portone.io/docs/ko/api/intro)
- [Open-Meteo API](https://open-meteo.com/)

---

## 📝 라이선스

This project is for educational and portfolio purposes only.
