// ============================================================
// 관리자 더미 데이터
// ============================================================

// ── 렌탈 아이템 ──────────────────────────────────────────────
export type RentalStatus = "대기중" | "렌탈중" | "반납완료" | "취소";

export interface RentalItem {
  id: number;
  title: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  rentalPrice: number;       // 1일 기준
  deposit: number;
  status: RentalStatus;
  renter?: string;
  startDate?: string;
  endDate?: string;
  img: string;
  createdAt: string;
}

export const RENTAL_ITEMS: RentalItem[] = [
  { id: 1,  title: "Samba OG 삼바 오지",               brand: "아디다스",        category: "신발",   size: "265",  color: "화이트/그린",  rentalPrice: 8000,  deposit: 80000,  status: "렌탈중",   renter: "user01@test.com", startDate: "2026-03-01", endDate: "2026-03-07", img: "👟", createdAt: "2026-02-15" },
  { id: 2,  title: "Air Force 1 Low 에어포스",          brand: "나이키",          category: "신발",   size: "270",  color: "화이트",       rentalPrice: 7000,  deposit: 60000,  status: "반납완료", renter: "user02@test.com", startDate: "2026-02-20", endDate: "2026-02-26", img: "👟", createdAt: "2026-02-10" },
  { id: 3,  title: "T-Light Jacket Grey",               brand: "디스이즈네버댓",  category: "아우터", size: "M",    color: "그레이",       rentalPrice: 12000, deposit: 120000, status: "대기중",   img: "🧥", createdAt: "2026-03-01" },
  { id: 4,  title: "HIMALAYAN PARKA 히말라얀",          brand: "노스페이스",      category: "아우터", size: "L",    color: "블랙",         rentalPrice: 20000, deposit: 200000, status: "렌탈중",   renter: "user03@test.com", startDate: "2026-03-05", endDate: "2026-03-10", img: "🧥", createdAt: "2026-02-28" },
  { id: 5,  title: "Nano Puff Jacket 나노 퍼프",        brand: "파타고니아",      category: "아우터", size: "M",    color: "네이비",       rentalPrice: 15000, deposit: 150000, status: "반납완료", renter: "user04@test.com", startDate: "2026-02-10", endDate: "2026-02-17", img: "🧥", createdAt: "2026-02-01" },
  { id: 6,  title: "Box Logo Hoodie 박스 로고",         brand: "슈프림",          category: "상의",   size: "L",    color: "레드",         rentalPrice: 25000, deposit: 250000, status: "취소",     img: "👕", createdAt: "2026-01-20" },
  { id: 7,  title: "Beta AR Jacket 베타 AR",            brand: "아크테릭스",      category: "아우터", size: "S",    color: "블랙",         rentalPrice: 35000, deposit: 350000, status: "대기중",   img: "🧥", createdAt: "2026-03-08" },
  { id: 8,  title: "993 Made in USA 스니커즈",          brand: "뉴발란스",        category: "신발",   size: "255",  color: "그레이",       rentalPrice: 10000, deposit: 100000, status: "렌탈중",   renter: "user05@test.com", startDate: "2026-03-07", endDate: "2026-03-12", img: "👟", createdAt: "2026-03-02" },
  { id: 9,  title: "크루넥 스웨트셔츠 블랙",            brand: "무신사 스탠다드", category: "상의",   size: "XL",   color: "블랙",         rentalPrice: 3000,  deposit: 20000,  status: "반납완료", renter: "user06@test.com", startDate: "2026-02-14", endDate: "2026-02-20", img: "👕", createdAt: "2026-02-08" },
  { id: 10, title: "8 Ball Fleece Crew 플리스",         brand: "스투시",          category: "상의",   size: "M",    color: "블랙",         rentalPrice: 6000,  deposit: 50000,  status: "대기중",   img: "👕", createdAt: "2026-03-09" },
];

// ── 입찰(경매) 아이템 ─────────────────────────────────────────
export type AuctionStatus = "입찰중" | "낙찰완료" | "유찰" | "취소";

export interface BidRecord {
  bidder: string;
  amount: number;
  bidAt: string;
}

export interface AuctionItem {
  id: number;
  title: string;
  brand: string;
  category: string;
  size: string;
  startPrice: number;
  currentBid: number;
  status: AuctionStatus;
  winner?: string;
  endDate: string;
  bidCount: number;
  img: string;
  createdAt: string;
  bids: BidRecord[];
}

export const AUCTION_ITEMS: AuctionItem[] = [
  { id: 1, title: "Dunk Low 덩크 로우 판다 희귀 샘플",  brand: "나이키",    category: "신발",   size: "260", startPrice: 200000, currentBid: 520000, status: "입찰중",   endDate: "2026-03-20", bidCount: 8,  img: "👟", createdAt: "2026-03-01", bids: [{ bidder: "user01@test.com", amount: 520000, bidAt: "2026-03-10 14:22" }, { bidder: "user07@test.com", amount: 480000, bidAt: "2026-03-09 09:11" }, { bidder: "user02@test.com", amount: 350000, bidAt: "2026-03-08 17:05" }] },
  { id: 2, title: "Box Logo Hoodie 2024 FW 초기 버전",  brand: "슈프림",    category: "상의",   size: "L",   startPrice: 500000, currentBid: 1200000, status: "낙찰완료", winner: "user03@test.com", endDate: "2026-02-28", bidCount: 14, img: "👕", createdAt: "2026-02-10", bids: [{ bidder: "user03@test.com", amount: 1200000, bidAt: "2026-02-28 23:55" }, { bidder: "user08@test.com", amount: 1100000, bidAt: "2026-02-28 20:00" }] },
  { id: 3, title: "Air Jordan 1 Retro OG 시카고",       brand: "나이키",    category: "신발",   size: "270", startPrice: 300000, currentBid: 300000, status: "유찰",     endDate: "2026-02-25", bidCount: 0,  img: "👟", createdAt: "2026-02-05", bids: [] },
  { id: 4, title: "Beta AR Jacket 아크테릭스 비매품",   brand: "아크테릭스", category: "아우터", size: "M",  startPrice: 800000, currentBid: 950000, status: "입찰중",   endDate: "2026-03-25", bidCount: 3,  img: "🧥", createdAt: "2026-03-05", bids: [{ bidder: "user04@test.com", amount: 950000, bidAt: "2026-03-11 10:00" }] },
  { id: 5, title: "Samba OG x Wales Bonner 콜라보",     brand: "아디다스",  category: "신발",   size: "255", startPrice: 150000, currentBid: 380000, status: "낙찰완료", winner: "user05@test.com", endDate: "2026-03-01", bidCount: 6,  img: "👟", createdAt: "2026-02-20", bids: [{ bidder: "user05@test.com", amount: 380000, bidAt: "2026-03-01 22:10" }] },
  { id: 6, title: "993 Made in USA 아메리칸 팩 한정판",  brand: "뉴발란스",  category: "신발",   size: "265", startPrice: 250000, currentBid: 250000, status: "취소",     endDate: "2026-02-15", bidCount: 0,  img: "👟", createdAt: "2026-02-01", bids: [] },
];

// ── 채팅 ──────────────────────────────────────────────────────
export interface ChatRoom {
  id: number;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastAt: string;
  isRead: boolean;
  messageCount: number;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  sender: "user" | "admin";
  content: string;
  sentAt: string;
}

// 더미 데이터 제거 - 실제 API 연동으로 전환
export const CHAT_ROOMS: ChatRoom[] = [];
export const CHAT_MESSAGES: ChatMessage[] = [];

// ── 일람(로그) ────────────────────────────────────────────────
export type LogType = "렌탈" | "입찰" | "시스템";

export interface LogEntry {
  id: number;
  type: LogType;
  action: string;
  target: string;
  actor: string;
  detail: string;
  createdAt: string;
}

export const LOG_ENTRIES: LogEntry[] = [
  { id: 1,  type: "렌탈",   action: "렌탈 시작",   target: "Samba OG #1",       actor: "user01@test.com",    detail: "2026-03-01 ~ 2026-03-07",        createdAt: "2026-03-01 10:00" },
  { id: 2,  type: "렌탈",   action: "반납 완료",   target: "Air Force 1 #2",    actor: "user02@test.com",    detail: "정상 반납",                       createdAt: "2026-02-26 15:30" },
  { id: 3,  type: "입찰",   action: "입찰 등록",   target: "Dunk Low #1",       actor: "user01@test.com",    detail: "520,000원 입찰",                  createdAt: "2026-03-10 14:22" },
  { id: 4,  type: "입찰",   action: "낙찰 완료",   target: "Box Logo Hoodie #2", actor: "user03@test.com",   detail: "1,200,000원 낙찰",                createdAt: "2026-02-28 23:55" },
  { id: 5,  type: "시스템", action: "회원 정지",   target: "user07@test.com",   actor: "admin@muream.com",   detail: "규정 위반(허위 입찰)",            createdAt: "2026-03-09 11:00" },
  { id: 6,  type: "렌탈",   action: "렌탈 취소",   target: "Box Logo Hoodie #6", actor: "admin@muream.com",  detail: "관리자 취소 처리",                createdAt: "2026-01-20 09:00" },
  { id: 7,  type: "입찰",   action: "경매 등록",   target: "Beta AR Jacket #4", actor: "admin@muream.com",   detail: "시작가 800,000원",                createdAt: "2026-03-05 08:00" },
  { id: 8,  type: "시스템", action: "배너 수정",   target: "메인 배너 #1",      actor: "admin@muream.com",   detail: "이미지/링크 변경",                createdAt: "2026-03-08 13:00" },
  { id: 9,  type: "렌탈",   action: "렌탈 시작",   target: "993 Made in USA #8", actor: "user05@test.com",   detail: "2026-03-07 ~ 2026-03-12",        createdAt: "2026-03-07 10:00" },
  { id: 10, type: "입찰",   action: "유찰 처리",   target: "Air Jordan 1 #3",   actor: "시스템",             detail: "입찰자 없음 자동 유찰",           createdAt: "2026-02-25 23:59" },
];

// ── 태그 ──────────────────────────────────────────────────────
export interface Tag {
  id: number;
  name: string;
  itemCount: number;
  createdAt: string;
}

export const TAGS: Tag[] = [
  // ── 상품 상태
  { id: 1,  name: "신상품",        itemCount: 8,  createdAt: "2026-01-10" },
  { id: 2,  name: "한정판",        itemCount: 5,  createdAt: "2026-01-10" },
  { id: 3,  name: "인기",          itemCount: 12, createdAt: "2026-01-10" },
  { id: 4,  name: "할인",          itemCount: 3,  createdAt: "2026-01-15" },
  { id: 5,  name: "콜라보",        itemCount: 4,  createdAt: "2026-02-05" },
  { id: 6,  name: "재입고",        itemCount: 2,  createdAt: "2026-02-08" },
  { id: 7,  name: "시즌오프",      itemCount: 3,  createdAt: "2026-02-10" },
  // ── 스타일
  { id: 8,  name: "스트릿",        itemCount: 9,  createdAt: "2026-01-20" },
  { id: 9,  name: "빈티지",        itemCount: 7,  createdAt: "2026-02-10" },
  { id: 10, name: "데일리룩",      itemCount: 11, createdAt: "2026-03-01" },
  { id: 11, name: "캐주얼",        itemCount: 14, createdAt: "2026-03-01" },
  { id: 12, name: "스포츠",        itemCount: 6,  createdAt: "2026-03-02" },
  { id: 13, name: "포멀",          itemCount: 2,  createdAt: "2026-03-02" },
  { id: 14, name: "미니멀",        itemCount: 5,  createdAt: "2026-03-03" },
  { id: 15, name: "오버사이즈",    itemCount: 4,  createdAt: "2026-03-03" },
  // ── 카테고리
  { id: 16, name: "신발",          itemCount: 15, createdAt: "2026-02-15" },
  { id: 17, name: "상의",          itemCount: 10, createdAt: "2026-02-15" },
  { id: 18, name: "아우터",        itemCount: 8,  createdAt: "2026-02-20" },
  { id: 19, name: "하의",          itemCount: 6,  createdAt: "2026-02-20" },
  { id: 20, name: "악세서리",      itemCount: 5,  createdAt: "2026-02-25" },
  { id: 21, name: "가방",          itemCount: 3,  createdAt: "2026-02-25" },
  { id: 22, name: "모자",          itemCount: 4,  createdAt: "2026-02-26" },
  { id: 25, name: "양말",          itemCount: 3,  createdAt: "2026-02-27" },
  // ── 브랜드
  { id: 30, name: "나이키",        itemCount: 4,  createdAt: "2026-01-01" },
  { id: 31, name: "아디다스",      itemCount: 2,  createdAt: "2026-01-01" },
  { id: 32, name: "뉴발란스",      itemCount: 1,  createdAt: "2026-01-01" },
  { id: 33, name: "슈프림",        itemCount: 1,  createdAt: "2026-01-01" },
  { id: 34, name: "노스페이스",    itemCount: 1,  createdAt: "2026-01-01" },
  { id: 35, name: "파타고니아",    itemCount: 1,  createdAt: "2026-01-01" },
  { id: 36, name: "아크테릭스",    itemCount: 1,  createdAt: "2026-01-01" },
  { id: 37, name: "스투시",        itemCount: 1,  createdAt: "2026-01-01" },
  { id: 38, name: "무신사스탠다드",itemCount: 2,  createdAt: "2026-01-05" },
  { id: 39, name: "디스이즈네버댓",itemCount: 0,  createdAt: "2026-01-10" },
  { id: 40, name: "커버낫",        itemCount: 0,  createdAt: "2026-01-10" },
  { id: 41, name: "앤더슨벨",      itemCount: 0,  createdAt: "2026-01-10" },
  { id: 42, name: "살로몬",        itemCount: 0,  createdAt: "2026-01-10" },
  { id: 43, name: "컨버스",        itemCount: 0,  createdAt: "2026-01-10" },
  { id: 44, name: "반스",          itemCount: 0,  createdAt: "2026-01-10" },
];

// ── 상품(Product) ─────────────────────────────────────────────
export type ProductKind = "신발" | "의류" | "액세서리";
export type ProductGender = "Men" | "Women" | "Unisex";
export type ProductStatus = "판매중" | "품절" | "숨김";

// 상위 카테고리 목록 (관리자 상품 등록 폼에서 사용)
export const PARENT_CATEGORIES = ["신발", "상의", "하의", "아우터", "액세서리"] as const;
export type ParentCategory = typeof PARENT_CATEGORIES[number];

// 상위 카테고리 → kind 매핑
export const PARENT_CATEGORY_KIND_MAP: Record<ParentCategory, ProductKind> = {
  "신발":    "신발",
  "상의":    "의류",
  "하의":    "의류",
  "아우터":  "의류",
  "액세서리": "액세서리",
};

export interface ProductItem {
  id: number;
  name: string;
  brand: string;
  kind: ProductKind;
  category: string;
  gender: ProductGender;
  retailPrice: number;
  rentalPrice: number;
  status: ProductStatus;
  img: string;
  tagIds: number[];
  createdAt: string;
}

export const ADMIN_PRODUCTS: ProductItem[] = [
  { id: 1,  name: "Samba OG 삼바 오지",               brand: "아디다스",        kind: "신발",     category: "스니커즈",     gender: "Unisex", retailPrice: 129000, rentalPrice: 8000,  status: "판매중", img: "👟", tagIds: [1,3,9],  createdAt: "2026-01-10" },
  { id: 2,  name: "Air Force 1 Low 에어포스",          brand: "나이키",          kind: "신발",     category: "스니커즈",     gender: "Unisex", retailPrice: 119000, rentalPrice: 7000,  status: "판매중", img: "👟", tagIds: [3,9],    createdAt: "2026-01-11" },
  { id: 3,  name: "Dunk Low 덩크 로우 판다",           brand: "나이키",          kind: "신발",     category: "스니커즈",     gender: "Men",    retailPrice: 129000, rentalPrice: 9000,  status: "품절",   img: "👟", tagIds: [2,3,9],  createdAt: "2026-01-12" },
  { id: 4,  name: "Box Logo Hoodie 박스 로고",         brand: "슈프림",          kind: "의류",     category: "후드",          gender: "Unisex", retailPrice: 198000, rentalPrice: 25000, status: "판매중", img: "👕", tagIds: [2,5,10], createdAt: "2026-01-15" },
  { id: 5,  name: "HIMALAYAN PARKA 히말라얀",          brand: "노스페이스",      kind: "의류",     category: "패딩",          gender: "Men",    retailPrice: 498000, rentalPrice: 20000, status: "판매중", img: "🧥", tagIds: [6,11],   createdAt: "2026-01-20" },
  { id: 6,  name: "Nano Puff Jacket 나노 퍼프",        brand: "파타고니아",      kind: "의류",     category: "패딩",          gender: "Unisex", retailPrice: 358000, rentalPrice: 15000, status: "판매중", img: "🧥", tagIds: [6,11],   createdAt: "2026-01-22" },
  { id: 7,  name: "Beta AR Jacket 베타 AR",            brand: "아크테릭스",      kind: "의류",     category: "재킷/점퍼",     gender: "Men",    retailPrice: 698000, rentalPrice: 35000, status: "판매중", img: "🧥", tagIds: [2,6,11], createdAt: "2026-02-01" },
  { id: 8,  name: "993 Made in USA",                   brand: "뉴발란스",        kind: "신발",     category: "스니커즈",     gender: "Men",    retailPrice: 249000, rentalPrice: 10000, status: "판매중", img: "👟", tagIds: [3,8,9],  createdAt: "2026-02-05" },
  { id: 9,  name: "크루넥 스웨트셔츠",                  brand: "무신사 스탠다드", kind: "의류",     category: "맨투맨/스웨트", gender: "Unisex", retailPrice: 49000,  rentalPrice: 3000,  status: "판매중", img: "👕", tagIds: [12,10],  createdAt: "2026-02-10" },
  { id: 10, name: "8 Ball Fleece Crew 플리스",         brand: "스투시",          kind: "의류",     category: "맨투맨/스웨트", gender: "Unisex", retailPrice: 148000, rentalPrice: 6000,  status: "판매중", img: "👕", tagIds: [5,10],   createdAt: "2026-02-12" },
  { id: 11, name: "Air Jordan 1 Retro OG 시카고",      brand: "나이키",          kind: "신발",     category: "스니커즈",     gender: "Men",    retailPrice: 189000, rentalPrice: 12000, status: "품절",   img: "👟", tagIds: [2,3,9],  createdAt: "2026-02-15" },
  { id: 12, name: "Stan Smith 스탠스미스",              brand: "아디다스",        kind: "신발",     category: "스니커즈",     gender: "Unisex", retailPrice: 109000, rentalPrice: 6000,  status: "숨김",   img: "👟", tagIds: [8,9],    createdAt: "2026-02-20" },
  { id: 13, name: "캡 로고 버킷햇",                     brand: "무신사 스탠다드", kind: "액세서리", category: "모자",          gender: "Unisex", retailPrice: 29000,  rentalPrice: 2000,  status: "판매중", img: "🧢", tagIds: [12],     createdAt: "2026-03-01" },
  { id: 14, name: "Swoosh Mini Bag",                   brand: "나이키",          kind: "액세서리", category: "가방",          gender: "Unisex", retailPrice: 45000,  rentalPrice: 3000,  status: "판매중", img: "👜", tagIds: [3],      createdAt: "2026-03-05" },
];

// ── 카테고리 태그 속성 (태그 그룹 내 선택 가능한 값들) ──────────
export interface CategoryTagAttribute {
  id: number;
  name: string;
}

export interface CategoryTagAttributeGroup {
  groupLabel: string;
  attributes: CategoryTagAttribute[];
}

// ── 카테고리 ──────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  parentName: ParentCategory;  // 상위 카테고리
  kind: ProductKind;            // API 전송용 kind
  productCount: number;
  createdAt: string;
  tagAttributeGroups?: CategoryTagAttributeGroup[]; // 이 카테고리(태그 그룹)에 속한 태그 속성들
}

export const CATEGORIES: Category[] = [
  // 신발
  { id: 1,  name: "스니커즈",    parentName: "신발",    kind: "신발",     productCount: 6, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:104,name:"베이지"},{id:105,name:"네이비"}] },
      { groupLabel: "사이즈", attributes: [{id:201,name:"230"},{id:202,name:"240"},{id:203,name:"250"},{id:204,name:"260"},{id:205,name:"270"},{id:206,name:"280"}] },
    ]},
  { id: 2,  name: "스포츠화",    parentName: "신발",    kind: "신발",     productCount: 0, createdAt: "2026-01-01" },
  { id: 3,  name: "구두",        parentName: "신발",    kind: "신발",     productCount: 0, createdAt: "2026-01-01" },
  { id: 4,  name: "부츠/워커",   parentName: "신발",    kind: "신발",     productCount: 0, createdAt: "2026-01-01" },
  { id: 5,  name: "샌들/슬리퍼", parentName: "신발",    kind: "신발",     productCount: 0, createdAt: "2026-01-01" },
  // 상의
  { id: 6,  name: "반소매 티셔츠", parentName: "상의",  kind: "의류",    productCount: 1, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:104,name:"베이지"},{id:105,name:"네이비"},{id:106,name:"레드"}] },
      { groupLabel: "패턴/무늬", attributes: [{id:301,name:"단색"},{id:302,name:"스트라이프"},{id:303,name:"체크"},{id:304,name:"로고/그래픽"}] },
      { groupLabel: "주요소재", attributes: [{id:401,name:"면"},{id:402,name:"폴리에스터"},{id:403,name:"린넨"},{id:404,name:"텐셀"}] },
      { groupLabel: "핏", attributes: [{id:501,name:"오버사이즈"},{id:502,name:"레귤러"},{id:503,name:"슬림"}] },
    ]},
  { id: 7,  name: "맨투맨/스웨트", parentName: "상의",  kind: "의류",    productCount: 1, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:104,name:"베이지"},{id:105,name:"네이비"}] },
      { groupLabel: "패턴/무늬", attributes: [{id:301,name:"단색"},{id:302,name:"스트라이프"},{id:304,name:"로고/그래픽"}] },
      { groupLabel: "주요소재", attributes: [{id:401,name:"면"},{id:402,name:"폴리에스터"},{id:405,name:"기모"}] },
      { groupLabel: "핏", attributes: [{id:501,name:"오버사이즈"},{id:502,name:"레귤러"}] },
    ]},
  { id: 8,  name: "후드",          parentName: "상의",  kind: "의류",    productCount: 1, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:105,name:"네이비"}] },
      { groupLabel: "핏", attributes: [{id:501,name:"오버사이즈"},{id:502,name:"레귤러"}] },
    ]},
  { id: 9,  name: "셔츠/블라우스", parentName: "상의",  kind: "의류",    productCount: 0, createdAt: "2026-01-01" },
  { id: 10, name: "니트/스웨터",   parentName: "상의",  kind: "의류",    productCount: 0, createdAt: "2026-01-01" },
  // 하의
  { id: 11, name: "청바지",    parentName: "하의",    kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  { id: 12, name: "슬랙스",    parentName: "하의",    kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  { id: 13, name: "조거팬츠",  parentName: "하의",    kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  { id: 14, name: "반바지",    parentName: "하의",    kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  // 아우터
  { id: 15, name: "코트",      parentName: "아우터",  kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  { id: 16, name: "재킷/점퍼", parentName: "아우터",  kind: "의류",      productCount: 2, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:105,name:"네이비"},{id:107,name:"카키"}] },
      { groupLabel: "핏", attributes: [{id:501,name:"오버사이즈"},{id:502,name:"레귤러"}] },
    ]},
  { id: 17, name: "패딩",      parentName: "아우터",  kind: "의류",      productCount: 1, createdAt: "2026-01-01",
    tagAttributeGroups: [
      { groupLabel: "컬러", attributes: [{id:101,name:"블랙"},{id:102,name:"화이트"},{id:103,name:"그레이"},{id:105,name:"네이비"}] },
    ]},
  { id: 18, name: "베스트",    parentName: "아우터",  kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  { id: 19, name: "바람막이",  parentName: "아우터",  kind: "의류",      productCount: 0, createdAt: "2026-01-01" },
  // 액세서리
  { id: 20, name: "모자",    parentName: "액세서리", kind: "액세서리",   productCount: 1, createdAt: "2026-01-01" },
  { id: 21, name: "가방",    parentName: "액세서리", kind: "액세서리",   productCount: 1, createdAt: "2026-01-01" },
  { id: 24, name: "벨트",    parentName: "액세서리", kind: "액세서리",   productCount: 0, createdAt: "2026-01-01" },
  { id: 25, name: "양말",    parentName: "액세서리", kind: "액세서리",   productCount: 0, createdAt: "2026-01-01" },
  { id: 26, name: "선글라스", parentName: "액세서리", kind: "액세서리",  productCount: 0, createdAt: "2026-01-01" },
];

// ── 브랜드 ────────────────────────────────────────────────────
export interface Brand {
  id: number;
  name: string;
  nameEn: string;
  origin: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
}

export const BRANDS: Brand[] = [
  { id: 1,  name: "나이키",          nameEn: "Nike",              origin: "미국",  productCount: 4,  isActive: true,  createdAt: "2026-01-01" },
  { id: 2,  name: "아디다스",        nameEn: "Adidas",            origin: "독일",  productCount: 2,  isActive: true,  createdAt: "2026-01-01" },
  { id: 3,  name: "뉴발란스",        nameEn: "New Balance",       origin: "미국",  productCount: 1,  isActive: true,  createdAt: "2026-01-01" },
  { id: 4,  name: "슈프림",          nameEn: "Supreme",           origin: "미국",  productCount: 1,  isActive: true,  createdAt: "2026-01-01" },
  { id: 5,  name: "노스페이스",      nameEn: "The North Face",    origin: "미국",  productCount: 1,  isActive: true,  createdAt: "2026-01-01" },
  { id: 6,  name: "파타고니아",      nameEn: "Patagonia",         origin: "미국",  productCount: 1,  isActive: true,  createdAt: "2026-01-01" },
  { id: 7,  name: "아크테릭스",      nameEn: "Arc'teryx",         origin: "캐나다", productCount: 1, isActive: true,  createdAt: "2026-01-01" },
  { id: 8,  name: "스투시",          nameEn: "Stüssy",            origin: "미국",  productCount: 1,  isActive: true,  createdAt: "2026-01-01" },
  { id: 9,  name: "무신사 스탠다드", nameEn: "Musinsa Standard",  origin: "한국",  productCount: 2,  isActive: true,  createdAt: "2026-01-05" },
  { id: 10, name: "디스이즈네버댓", nameEn: "thisisneverthat",   origin: "한국",  productCount: 0,  isActive: false, createdAt: "2026-01-10" },
];

// ── 태그 그룹 ─────────────────────────────────────────────────
export interface TagGroup {
  id: number;
  name: string;
  description: string;
  tagCount: number;
  createdAt: string;
}

export const TAG_GROUPS: TagGroup[] = [
  { id: 1, name: "상품 상태",   description: "신상품/한정판/인기 등 상품 상태 관련 태그",   tagCount: 4, createdAt: "2026-01-01" },
  { id: 2, name: "스타일",      description: "스트릿/빈티지/데일리룩 등 스타일 태그",         tagCount: 3, createdAt: "2026-01-01" },
  { id: 3, name: "카테고리",    description: "신발/상의/아우터 등 카테고리 분류 태그",         tagCount: 3, createdAt: "2026-01-01" },
  { id: 4, name: "활동/장르",   description: "아웃도어/콜라보 등 활동 관련 태그",              tagCount: 2, createdAt: "2026-01-10" },
];

// ── 배너 ──────────────────────────────────────────────────────
export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  img: string;
  link: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export const BANNERS: Banner[] = [
  { id: 1, title: "SPRING COLLECTION 2026", subtitle: "새 시즌의 시작",  img: "🌸", link: "/shop", isActive: true,  order: 1, createdAt: "2026-03-01" },
  { id: 2, title: "나이키 에어맥스 한정 출시", subtitle: "지금 바로 입찰", img: "👟", link: "/auction", isActive: true,  order: 2, createdAt: "2026-03-05" },
  { id: 3, title: "프리미엄 렌탈 서비스",      subtitle: "합리적인 가격으로", img: "🏷️", link: "/rental", isActive: false, order: 3, createdAt: "2026-02-20" },
];
