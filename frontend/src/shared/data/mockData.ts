// ============================================================
// 공유 더미 데이터 - SpringProject2 data.js 기반
// ============================================================

export interface ProductItem {
  id: number;
  brand: string;
  name: string;
  price: number;
  discountRate: number;
  img: string;
  subImgs: string[];
  category: string;
  subcategory?: string; // 하위 카테고리(태그 그룹)
  gender: "all" | "male" | "female";
  sizes: string[];
  likes: number;
  tagIds?: number[]; // ShopPage 필터용 태그 ID 목록
  description?: string; // HTML 형식 상세 설명 (에디터로 작성된 콘텐츠)
}

export interface BrandItem {
  id: number;
  name: string;
  nameEn: string;
  exclusive: boolean;
  icon: string;
}

export interface ReviewItem {
  id: number;
  productId: number;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface TradeEntry {
  size: string;
  price: number;
  date?: string;
  count?: number;
}

export interface ProductTrades {
  concluded: TradeEntry[];
  sellBids: TradeEntry[];
  buyBids: TradeEntry[];
  priceHistory: number[];
  instantSellPrice: number;
  instantBuyPrice: number;
}

// ============================================================
// 상품 데이터 (20개)
// ============================================================

export const PRODUCTS: ProductItem[] = [
  { id: 1,  brand: "아디다스",        name: "Samba OG 삼바 오지",                   price: 139000, discountRate: 0,  img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스니커즈",     gender: "all",    sizes: ["230","240","250","260","270","280"], likes: 9800,  tagIds: [13,22,41],
    description: `<div class="pd-section"><h2 class="pd-heading">아디다스 삼바 OG — 클래식의 귀환</h2><p class="pd-text">1950년대 실내 축구 코트에서 태어난 삼바는 수십 년을 거쳐 스트리트 패션의 아이콘이 되었습니다. 원형에 충실한 OG 실루엣, 부드러운 가죽 갑피, 고무 강화 토캡이 완벽한 내구성과 스타일을 동시에 선사합니다.</p></div><div class="pd-img-wrap"><div class="pd-img-placeholder">👟</div></div><div class="pd-section"><h3 class="pd-subheading">소재 &amp; 디테일</h3><ul class="pd-list"><li>천연 가죽 갑피 — 부드러운 착용감</li><li>고무 컵솔 — 뛰어난 접지력</li><li>T자형 스트라이프 오버레이 — 클래식 아이덴티티</li><li>패딩 칼라 — 발목 편안한 쿠셔닝</li></ul></div><div class="pd-section pd-bg-gray"><h3 class="pd-subheading">사이즈 가이드</h3><p class="pd-text">삼바 OG는 평소 신으시는 사이즈보다 <strong>5mm 작게</strong> 선택하시길 권장합니다. 발볼이 넓으신 분은 반 사이즈 업을 추천드립니다.</p></div><div class="pd-img-wrap"><div class="pd-img-placeholder" style="font-size:80px">👟👟</div></div><div class="pd-section"><p class="pd-caption">※ 상품 이미지는 실제 색상과 다소 차이가 있을 수 있습니다.</p></div>` },
  { id: 2,  brand: "나이키",          name: "Air Force 1 Low 에어포스 1",            price: 129000, discountRate: 15, img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스니커즈",     gender: "male",   sizes: ["250","260","270","280"], likes: 8500,  tagIds: [11,22,42],
    description: `<div class="pd-section"><h2 class="pd-heading">나이키 에어포스 1 로우 — 영원한 레전드</h2><p class="pd-text">1982년 Bruce Kilgore가 설계한 에어포스 1은 농구화 최초로 Air 쿠셔닝을 탑재한 혁신적인 모델입니다. 깨끗한 화이트 가죽 갑피와 풀그레인 가죽 오버레이가 어떤 스타일에도 자연스럽게 어우러집니다.</p></div><div class="pd-img-wrap"><div class="pd-img-placeholder">👟</div></div><div class="pd-section pd-bg-gray"><h3 class="pd-subheading">주요 특징</h3><ul class="pd-list"><li>Nike Air 미드솔 — 하루 종일 편안한 착용감</li><li>풀그레인 가죽 갑피 — 내구성과 깔끔한 마감</li><li>퍼포레이션 디테일 — 통기성 강화</li><li>저포인트 인서트 — 착화 편의성</li></ul></div><div class="pd-section"><p class="pd-caption">※ 상품 이미지는 실제 색상과 다소 차이가 있을 수 있습니다.</p></div>` },
  { id: 3,  brand: "디스이즈네버댓",  name: "T-Light Jacket Grey",                   price: 139000, discountRate: 0,  img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "재킷/점퍼",    gender: "all",    sizes: ["S","M","L","XL"],            likes: 6200,  tagIds: [13,23,45] },
  { id: 4,  brand: "노이아고",        name: "NOI1067 라이트웨이트 히트 자켓 블랙",   price: 63900,  discountRate: 58, img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "재킷/점퍼",    gender: "male",   sizes: ["S","M","L"],                 likes: 5400,  tagIds: [11,21,42] },
  { id: 5,  brand: "아디다스",        name: "메르세데스 AMG F1 팀 메카닉스 베스트",  price: 179000, discountRate: 0,  img: "🦺", subImgs: ["🦺","🦺","🦺","🦺","🦺"], category: "상의",   subcategory: "반소매 티셔츠",gender: "male",   sizes: ["S","M","L","XL"],            likes: 4100,  tagIds: [11,21,45] },
  { id: 6,  brand: "디미트리블랙",    name: "에센셜 체크 후드 아노락",               price: 71500,  discountRate: 33, img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "후드",          gender: "all",    sizes: ["Free"],                      likes: 7300,  tagIds: [13,63,42] },
  { id: 7,  brand: "뉴발란스",        name: "993 Made in USA 스니커즈",              price: 249000, discountRate: 0,  img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스니커즈",     gender: "all",    sizes: ["240","250","260","270","280"], likes: 7900, tagIds: [13,23,42] },
  { id: 8,  brand: "살로몬",          name: "XT-6 GORE-TEX 트레일 러닝화",           price: 199000, discountRate: 0,  img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스포츠화",     gender: "all",    sizes: ["250","260","270","280"],      likes: 6700,  tagIds: [13,27,45] },
  { id: 9,  brand: "무신사 스탠다드", name: "크루넥 스웨트셔츠 블랙",               price: 29900,  discountRate: 0,  img: "👕", subImgs: ["👕","👕","👕","👕","👕"], category: "상의",   subcategory: "맨투맨/스웨트",gender: "all",    sizes: ["S","M","L","XL","2XL"],      likes: 11200, tagIds: [13,21,92] },
  { id: 10, brand: "노스페이스",      name: "HIMALAYAN PARKA 히말라얀 파카",         price: 499000, discountRate: 0,  img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "패딩",          gender: "all",    sizes: ["S","M","L","XL"],            likes: 8900,  tagIds: [13,21,45] },
  { id: 11, brand: "나이키",          name: "Dunk Low 덩크 로우 판다",               price: 119000, discountRate: 0,  img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스니커즈",     gender: "all",    sizes: ["240","250","260","270","280"], likes: 10500,tagIds: [13,21,41] },
  { id: 12, brand: "반스",            name: "Old Skool 올드스쿨 블랙",               price: 89000,  discountRate: 10, img: "👟", subImgs: ["👟","👟","👟","👟","👟"], category: "신발",   subcategory: "스니커즈",     gender: "all",    sizes: ["240","250","260","270","280"], likes: 5600, tagIds: [13,21,41] },
  { id: 13, brand: "무신사 스탠다드", name: "스트레이트 데님 팬츠 인디고",           price: 39900,  discountRate: 0,  img: "👖", subImgs: ["👖","👖","👖","👖","👖"], category: "바지",   subcategory: "청바지",       gender: "all",    sizes: ["28","30","32","34"],          likes: 8100,  tagIds: [13,27,42] },
  { id: 14, brand: "커버낫",          name: "BC 스몰 로고 티셔츠",                   price: 32000,  discountRate: 0,  img: "👕", subImgs: ["👕","👕","👕","👕","👕"], category: "상의",   subcategory: "반소매 티셔츠",gender: "all",    sizes: ["S","M","L","XL"],            likes: 4800,  tagIds: [13,22,42] },
  { id: 15, brand: "아크테릭스",      name: "Beta AR Jacket 베타 AR",                price: 689000, discountRate: 0,  img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "재킷/점퍼",    gender: "all",    sizes: ["S","M","L","XL"],            likes: 9200,  tagIds: [13,21,44] },
  { id: 16, brand: "스투시",          name: "8 Ball Fleece Crew 플리스",             price: 99000,  discountRate: 20, img: "👕", subImgs: ["👕","👕","👕","👕","👕"], category: "상의",   subcategory: "맨투맨/스웨트",gender: "all",    sizes: ["S","M","L","XL"],            likes: 7600,  tagIds: [13,21,41] },
  { id: 17, brand: "칼하트",          name: "WIP Chase Sweat 체이스 스웻",           price: 139000, discountRate: 0,  img: "👕", subImgs: ["👕","👕","👕","👕","👕"], category: "상의",   subcategory: "맨투맨/스웨트",gender: "all",    sizes: ["S","M","L","XL"],            likes: 6300,  tagIds: [13,22,42] },
  { id: 18, brand: "파타고니아",      name: "Nano Puff Jacket 나노 퍼프",            price: 259000, discountRate: 0,  img: "🧥", subImgs: ["🧥","🧥","🧥","🧥","🧥"], category: "아우터", subcategory: "패딩",          gender: "all",    sizes: ["S","M","L","XL"],            likes: 8700,  tagIds: [13,25,45] },
  { id: 19, brand: "마뗑킴",          name: "LOGO BALL CAP 로고 볼캡",               price: 49000,  discountRate: 0,  img: "🧢", subImgs: ["🧢","🧢","🧢","🧢","🧢"], category: "소품",   subcategory: "모자",          gender: "all",    sizes: ["Free"],                      likes: 6900,  tagIds: [13,21,41] },
  { id: 20, brand: "슈프림",          name: "Box Logo Hoodie 박스 로고 후디",         price: 389000, discountRate: 0,  img: "👕", subImgs: ["👕","👕","👕","👕","👕"], category: "상의",   subcategory: "후드",          gender: "all",    sizes: ["S","M","L","XL"],            likes: 13400, tagIds: [13,21,41] },
];

// ============================================================
// 브랜드 데이터 (전체)
// ============================================================

export const BRANDS: BrandItem[] = [
  { id: 42, name: "갭",                nameEn: "GAP",                    exclusive: false, icon: "👕" },
  { id: 43, name: "구찌",              nameEn: "GUCCI",                  exclusive: false, icon: "💎" },
  { id: 44, name: "겐조",              nameEn: "KENZO",                  exclusive: false, icon: "🌺" },
  { id: 45, name: "골든구스",           nameEn: "GOLDEN GOOSE",           exclusive: false, icon: "✨" },
  { id: 46, name: "게스",              nameEn: "GUESS",                  exclusive: false, icon: "🔺" },
  { id: 47, name: "그라미치",           nameEn: "GRAMICCI",               exclusive: false, icon: "🧗" },
  { id: 48, name: "기프트샵",           nameEn: "GIFT SHOP",              exclusive: true,  icon: "🎁" },
  { id: 3,  name: "나이키",             nameEn: "NIKE",                   exclusive: false, icon: "✔️" },
  { id: 24, name: "나나미카",           nameEn: "NANAMICA",               exclusive: false, icon: "🌊" },
  { id: 6,  name: "뉴발란스",           nameEn: "NEW BALANCE",            exclusive: false, icon: "🔵" },
  { id: 8,  name: "노스페이스",         nameEn: "THE NORTH FACE",         exclusive: false, icon: "⛰️" },
  { id: 12, name: "노이아고",           nameEn: "NOIAGO",                 exclusive: false, icon: "🏔️" },
  { id: 49, name: "낫아워스",           nameEn: "NOT OUR'S",              exclusive: true,  icon: "🚫" },
  { id: 50, name: "내셔널지오그래픽",   nameEn: "NATIONAL GEOGRAPHIC",    exclusive: false, icon: "🌍" },
  { id: 9,  name: "디미트리블랙",       nameEn: "DIMITRI BLACK",          exclusive: true,  icon: "⬛" },
  { id: 11, name: "디스이즈네버댓",     nameEn: "thisisneverthat",        exclusive: false, icon: "🔠" },
  { id: 51, name: "더콜디스트모멘트",   nameEn: "THE COLDEST MOMENT",     exclusive: false, icon: "❄️" },
  { id: 52, name: "던스트",             nameEn: "DUNST",                  exclusive: false, icon: "🌬️" },
  { id: 53, name: "딕키즈",             nameEn: "DICKIES",                exclusive: false, icon: "🔧" },
  { id: 25, name: "로아",              nameEn: "ROA",                    exclusive: false, icon: "🥾" },
  { id: 54, name: "랄프로렌",           nameEn: "RALPH LAUREN",           exclusive: false, icon: "🐎" },
  { id: 55, name: "러쉬",              nameEn: "RUSH",                   exclusive: false, icon: "💨" },
  { id: 56, name: "레이",              nameEn: "RAY",                    exclusive: true,  icon: "☀️" },
  { id: 1,  name: "무신사 스탠다드",    nameEn: "MUSINSA STANDARD",       exclusive: true,  icon: "🏷️" },
  { id: 4,  name: "무신사 스탠다드 우먼", nameEn: "MUSINSA STANDARD WOMAN", exclusive: true, icon: "🌸" },
  { id: 10, name: "마뗑킴",            nameEn: "MATIN KIM",              exclusive: false, icon: "🎀" },
  { id: 57, name: "메종키츠네",         nameEn: "MAISON KITSUNÉ",         exclusive: false, icon: "🦊" },
  { id: 58, name: "몽클레어",           nameEn: "MONCLER",                exclusive: false, icon: "🏔️" },
  { id: 59, name: "밀레",              nameEn: "MILLET",                 exclusive: false, icon: "⛰️" },
  { id: 60, name: "므아므",             nameEn: "MMMM",                   exclusive: true,  icon: "🖤" },
  { id: 15, name: "반스",              nameEn: "VANS",                   exclusive: false, icon: "🛹" },
  { id: 22, name: "빈폴",              nameEn: "BEANPOLE",               exclusive: false, icon: "🫘" },
  { id: 61, name: "버버리",             nameEn: "BURBERRY",               exclusive: false, icon: "🏰" },
  { id: 62, name: "발렌시아가",         nameEn: "BALENCIAGA",             exclusive: false, icon: "👟" },
  { id: 63, name: "버켄스탁",           nameEn: "BIRKENSTOCK",            exclusive: false, icon: "👡" },
  { id: 64, name: "빔즈",              nameEn: "BEAMS",                  exclusive: false, icon: "🇯🇵" },
  { id: 7,  name: "살로몬",             nameEn: "SALOMON",                exclusive: false, icon: "🔺" },
  { id: 18, name: "슈프림",             nameEn: "SUPREME",                exclusive: false, icon: "🅱️" },
  { id: 19, name: "스톤 아일랜드",      nameEn: "STONE ISLAND",           exclusive: false, icon: "🧭" },
  { id: 65, name: "스투시",             nameEn: "STÜSSY",                 exclusive: false, icon: "🌊" },
  { id: 66, name: "스파오",             nameEn: "SPAO",                   exclusive: false, icon: "🎠" },
  { id: 67, name: "슬로우애시드",       nameEn: "SLOWACID",               exclusive: true,  icon: "🧪" },
  { id: 2,  name: "아디다스",           nameEn: "ADIDAS",                 exclusive: false, icon: "⚡" },
  { id: 16, name: "앤더슨벨",           nameEn: "ANDERSSON BELL",         exclusive: true,  icon: "🔔" },
  { id: 17, name: "아크테릭스",         nameEn: "ARC'TERYX",              exclusive: false, icon: "🦅" },
  { id: 29, name: "에이피씨",           nameEn: "A.P.C",                  exclusive: false, icon: "🇫🇷" },
  { id: 23, name: "엔지니어드가먼츠",   nameEn: "ENGINEERED GARMENTS",    exclusive: false, icon: "🔧" },
  { id: 30, name: "오베이",             nameEn: "OBEY",                   exclusive: false, icon: "👁️" },
  { id: 35, name: "아모멘토",           nameEn: "AMOMENT",                exclusive: true,  icon: "🌿" },
  { id: 68, name: "우영미",             nameEn: "WOOYOUNGMI",             exclusive: false, icon: "🖤" },
  { id: 69, name: "이스트팩",           nameEn: "EASTPAK",                exclusive: false, icon: "🎒" },
  { id: 70, name: "어글리월드와이드",   nameEn: "UGLY WORLDWIDE",         exclusive: true,  icon: "🌐" },
  { id: 31, name: "자라",              nameEn: "ZARA",                   exclusive: false, icon: "🪡" },
  { id: 32, name: "지오다노",           nameEn: "GIORDANO",               exclusive: false, icon: "🏷️" },
  { id: 36, name: "저스트 돈",          nameEn: "JUST DON",               exclusive: false, icon: "🎱" },
  { id: 71, name: "자주",              nameEn: "JAJU",                   exclusive: false, icon: "🏠" },
  { id: 72, name: "지프",              nameEn: "JEEP",                   exclusive: false, icon: "🚙" },
  { id: 73, name: "질샌더",             nameEn: "JIL SANDER",             exclusive: false, icon: "⚪" },
  { id: 37, name: "챔피언",             nameEn: "CHAMPION",               exclusive: false, icon: "🏆" },
  { id: 38, name: "청키",              nameEn: "CHUNKY",                 exclusive: true,  icon: "🟤" },
  { id: 74, name: "차이나타운마켓",     nameEn: "CHINATOWN MARKET",       exclusive: false, icon: "🏮" },
  { id: 75, name: "체리코코",           nameEn: "CHERRYKOKO",             exclusive: true,  icon: "🍒" },
  { id: 13, name: "커버낫",             nameEn: "COVERNAT",               exclusive: false, icon: "🧢" },
  { id: 14, name: "컨버스",             nameEn: "CONVERSE",               exclusive: false, icon: "⭐" },
  { id: 21, name: "코오롱스포츠",       nameEn: "KOLON SPORT",            exclusive: false, icon: "🏕️" },
  { id: 28, name: "크리틱",             nameEn: "CRITIC",                 exclusive: false, icon: "📝" },
  { id: 27, name: "칼하트",             nameEn: "CARHARTT WIP",           exclusive: false, icon: "🔨" },
  { id: 76, name: "키스",              nameEn: "KITH",                   exclusive: false, icon: "💋" },
  { id: 77, name: "키르시",             nameEn: "KIRSH",                  exclusive: false, icon: "🍒" },
  { id: 39, name: "탐버린스",           nameEn: "TAMBURINS",              exclusive: false, icon: "🌸" },
  { id: 40, name: "트리플에이에프",     nameEn: "TRIPLE AF",              exclusive: true,  icon: "🔱" },
  { id: 78, name: "톰브라운",           nameEn: "THOM BROWNE",            exclusive: false, icon: "🎓" },
  { id: 79, name: "탑텐",              nameEn: "TOP TEN",                exclusive: false, icon: "🔟" },
  { id: 80, name: "타미힐피거",         nameEn: "TOMMY HILFIGER",         exclusive: false, icon: "🇺🇸" },
  { id: 5,  name: "푸마",              nameEn: "PUMA",                   exclusive: false, icon: "🐆" },
  { id: 20, name: "팔라스",             nameEn: "PALACE",                 exclusive: false, icon: "👑" },
  { id: 26, name: "포터",              nameEn: "PORTER",                 exclusive: false, icon: "🎒" },
  { id: 81, name: "파타고니아",         nameEn: "PATAGONIA",              exclusive: false, icon: "🏞️" },
  { id: 82, name: "피어오브갓",         nameEn: "FEAR OF GOD",            exclusive: false, icon: "😇" },
  { id: 83, name: "폴로랄프로렌",       nameEn: "POLO RALPH LAUREN",      exclusive: false, icon: "🐎" },
  { id: 33, name: "휠라",              nameEn: "FILA",                   exclusive: false, icon: "🎾" },
  { id: 34, name: "헤지스",             nameEn: "HAZZYS",                 exclusive: false, icon: "🐴" },
  { id: 41, name: "헬리녹스",           nameEn: "HELINOX",                exclusive: false, icon: "🏕️" },
  { id: 84, name: "휴먼메이드",         nameEn: "HUMAN MADE",             exclusive: false, icon: "❤️" },
  { id: 85, name: "한섬",              nameEn: "HANDSOME",               exclusive: false, icon: "✨" },
];

// ============================================================
// 카테고리 / 알파벳
// ============================================================

export const CATEGORIES: string[] = [
  "신발", "상의", "아우터", "바지", "원피스/스커트",
  "가방", "소품", "속옷/홈웨어", "스포츠/레저",
  "디지털/라이프", "아울렛", "뷰티", "부티크", "키즈",
  "어스", "K-커넥트", "유즈드",
];

export const ALPHABET: string[] = [
  "인기", "♡", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ",
  "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "가나다 ↕",
];

// ============================================================
// 계층형 카테고리 (상위 → 하위)
// ============================================================

export interface SubcategoryItem {
  name: string;
  icon: string;
}

// ShopPage 필터 태그 구조
export interface ShopFilterTag {
  id: number;
  name: string;
}

export interface ShopFilterGroup {
  id: number;
  name: string;
  tags: ShopFilterTag[];
  popup: boolean; // true = 팝업으로 펼쳐서 선택
}

export interface CategoryGroup {
  name: string;
  subcategories: SubcategoryItem[];
  filterGroups: ShopFilterGroup[];
}

// 공통 필터 태그 그룹 (여러 카테고리에서 재사용)
const GENDER_FILTER: ShopFilterGroup = {
  id: 1, name: "성별", popup: false,
  tags: [{ id: 11, name: "남성" }, { id: 12, name: "여성" }, { id: 13, name: "공용" }],
};
const COLOR_FILTER: ShopFilterGroup = {
  id: 2, name: "컬러", popup: true,
  tags: [
    { id: 21, name: "블랙" }, { id: 22, name: "화이트" }, { id: 23, name: "그레이" },
    { id: 24, name: "베이지" }, { id: 25, name: "네이비" }, { id: 26, name: "레드" },
    { id: 27, name: "블루" }, { id: 28, name: "그린" }, { id: 29, name: "옐로우" },
    { id: 30, name: "핑크" }, { id: 31, name: "브라운" }, { id: 32, name: "카키" },
    { id: 33, name: "오렌지" }, { id: 34, name: "퍼플" }, { id: 35, name: "라이트그레이" },
  ],
};
const STYLE_FILTER: ShopFilterGroup = {
  id: 3, name: "스타일", popup: false,
  tags: [
    { id: 41, name: "스트릿" }, { id: 42, name: "캐주얼" }, { id: 43, name: "빈티지" },
    { id: 44, name: "미니멀" }, { id: 45, name: "스포츠" },
  ],
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "신발",
    subcategories: [
      { name: "스니커즈",      icon: "👟" },
      { name: "스포츠화",      icon: "👟" },
      { name: "구두",          icon: "👞" },
      { name: "부츠/워커",     icon: "🥾" },
      { name: "샌들/슬리퍼",   icon: "🩴" },
      { name: "패딩/퍼 신발",  icon: "🧸" },
      { name: "신발용품",      icon: "🪥" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      {
        id: 5, name: "사이즈", popup: true,
        tags: [
          { id: 51, name: "220" }, { id: 52, name: "230" }, { id: 53, name: "240" },
          { id: 54, name: "250" }, { id: 55, name: "260" }, { id: 56, name: "270" },
          { id: 57, name: "280" }, { id: 58, name: "290" },
        ],
      },
      STYLE_FILTER,
    ],
  },
  {
    name: "상의",
    subcategories: [
      { name: "반소매 티셔츠",  icon: "👕" },
      { name: "긴소매 티셔츠",  icon: "👕" },
      { name: "맨투맨/스웨트",  icon: "👕" },
      { name: "후드",           icon: "🧥" },
      { name: "셔츠/블라우스",  icon: "👔" },
      { name: "니트/스웨터",    icon: "🧶" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      {
        id: 6, name: "패턴/무늬", popup: true,
        tags: [
          { id: 61, name: "단색" }, { id: 62, name: "스트라이프" }, { id: 63, name: "체크" },
          { id: 64, name: "로고/그래픽" }, { id: 65, name: "타이다이" }, { id: 66, name: "애니멀" },
          { id: 67, name: "패치워크" }, { id: 68, name: "플라워" }, { id: 69, name: "도트" },
          { id: 70, name: "컬러블록" }, { id: 71, name: "카모" }, { id: 72, name: "드로잉" },
          { id: 73, name: "그라데이션" }, { id: 74, name: "아가일" },
        ],
      },
      {
        id: 7, name: "주요소재", popup: true,
        tags: [
          { id: 81, name: "코튼" }, { id: 82, name: "기모" }, { id: 83, name: "폴리에스터" },
          { id: 84, name: "린넨" }, { id: 85, name: "텐셀" }, { id: 86, name: "울" },
          { id: 87, name: "아크릴" }, { id: 88, name: "나일론" },
        ],
      },
      STYLE_FILTER,
      {
        id: 8, name: "핏", popup: false,
        tags: [
          { id: 91, name: "오버사이즈" }, { id: 92, name: "레귤러" }, { id: 93, name: "슬림" },
        ],
      },
    ],
  },
  {
    name: "아우터",
    subcategories: [
      { name: "코트",      icon: "🧥" },
      { name: "재킷/점퍼", icon: "🧥" },
      { name: "패딩",      icon: "🧥" },
      { name: "베스트",    icon: "🦺" },
      { name: "바람막이",  icon: "🧥" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      {
        id: 9, name: "주요소재", popup: true,
        tags: [
          { id: 81, name: "코튼" }, { id: 82, name: "기모" }, { id: 83, name: "폴리에스터" },
          { id: 86, name: "울" }, { id: 88, name: "나일론" }, { id: 89, name: "다운" },
        ],
      },
      STYLE_FILTER,
      {
        id: 8, name: "핏", popup: false,
        tags: [
          { id: 91, name: "오버사이즈" }, { id: 92, name: "레귤러" }, { id: 93, name: "슬림" },
        ],
      },
    ],
  },
  {
    name: "바지",
    subcategories: [
      { name: "청바지",    icon: "👖" },
      { name: "슬랙스",    icon: "👖" },
      { name: "조거팬츠",  icon: "👖" },
      { name: "반바지",    icon: "🩳" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      {
        id: 10, name: "사이즈", popup: true,
        tags: [
          { id: 101, name: "26" }, { id: 102, name: "28" }, { id: 103, name: "30" },
          { id: 104, name: "32" }, { id: 105, name: "34" },
        ],
      },
      STYLE_FILTER,
    ],
  },
  {
    name: "가방",
    subcategories: [
      { name: "백팩",     icon: "🎒" },
      { name: "크로스백", icon: "👜" },
      { name: "토트백",   icon: "👜" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      STYLE_FILTER,
    ],
  },
  {
    name: "소품",
    subcategories: [
      { name: "모자",     icon: "🧢" },
      { name: "양말",     icon: "🧦" },
      { name: "벨트",     icon: "🪢" },
      { name: "선글라스", icon: "🕶️" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      STYLE_FILTER,
    ],
  },
  {
    name: "속옷/홈웨어",
    subcategories: [
      { name: "속옷",   icon: "🩲" },
      { name: "잠옷",   icon: "💤" },
      { name: "홈웨어", icon: "🏠" },
    ],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
    ],
  },
  {
    name: "스포츠/레저",
    subcategories: [],
    filterGroups: [
      GENDER_FILTER,
      COLOR_FILTER,
      STYLE_FILTER,
    ],
  },
];

// ============================================================
// 검색 - 인기 검색어 / 급상승 검색어
// ============================================================

export type SearchTrend = "up" | "down" | "none";

export interface TrendingSearch {
  rank: number;
  term: string;
  trend: SearchTrend;
}

export interface RisingSearch {
  rank: number;
  term: string;
}

export const TRENDING_SEARCHES: TrendingSearch[] = [
  { rank: 1,  term: "후드집업",       trend: "none" },
  { rank: 2,  term: "바람막이",       trend: "none" },
  { rank: 3,  term: "후드티",         trend: "none" },
  { rank: 4,  term: "맨투맨",         trend: "up"   },
  { rank: 5,  term: "경량패딩",       trend: "down" },
  { rank: 6,  term: "자켓",           trend: "up"   },
  { rank: 7,  term: "아디다스",       trend: "up"   },
  { rank: 8,  term: "가디건",         trend: "down" },
  { rank: 9,  term: "무신사 스탠다드", trend: "none" },
  { rank: 10, term: "백팩",           trend: "none" },
];

export const RISING_SEARCHES: RisingSearch[] = [
  { rank: 1,  term: "아디다스 바람막이" },
  { rank: 2,  term: "스탠리"           },
  { rank: 3,  term: "아디다스 도쿄"    },
  { rank: 4,  term: "긴팔"             },
  { rank: 5,  term: "봄옷"             },
  { rank: 6,  term: "허그유어스킨"     },
  { rank: 7,  term: "워커"             },
  { rank: 8,  term: "샌들"             },
  { rank: 9,  term: "노앙"             },
  { rank: 10, term: "슬리브리스"       },
];

// ============================================================
// 리뷰 데이터
// ============================================================

export const REVIEWS: ReviewItem[] = [
  { id: 1, productId: 1,  user: "kim***",  rating: 5, text: "핏이 정말 예쁘고 소재도 좋아요. 재구매 의사 있습니다!", date: "2026-02-28" },
  { id: 2, productId: 1,  user: "park***", rating: 4, text: "배송 빠르고 상품도 사진이랑 똑같아요. 만족합니다.",    date: "2026-02-15" },
  { id: 3, productId: 2,  user: "lee***",  rating: 5, text: "진짜 퀄리티 최고네요. 발볼도 딱 맞아요.",             date: "2026-03-01" },
];

// ============================================================
// 거래 데이터 생성 헬퍼 (SpringProject2 data.js 기반)
// ============================================================

export function getTradesForProduct(product: ProductItem): ProductTrades {
  const base = product.discountRate
    ? Math.round((product.price * (1 - product.discountRate / 100)) / 1000) * 1000
    : Math.round(product.price / 1000) * 1000;

  const pid = product.id;
  const sizes = product.sizes;
  const dates = ["22시간 전","26/03/08","26/03/08","26/03/07","26/03/07","26/03/07","26/03/06","26/03/04","26/03/03","26/03/01"];

  const concluded: TradeEntry[] = Array.from({ length: 10 }, (_, i) => {
    const v = 1 + (((pid * 7 + i * 13) % 11) - 5) / 100;
    return { size: sizes[i % sizes.length], price: Math.round((base * v) / 1000) * 1000, date: dates[i] };
  });

  const sellBids: TradeEntry[] = Array.from({ length: 8 }, (_, i) => ({
    size: sizes[i % sizes.length],
    price: Math.round((base * (1 + (i * 1.5 + 1) / 100)) / 1000) * 1000,
    count: ((pid * 3 + i) % 4) + 1,
  })).sort((a, b) => a.price - b.price);

  const buyBids: TradeEntry[] = Array.from({ length: 8 }, (_, i) => ({
    size: sizes[i % sizes.length],
    price: Math.round((base * (1 - (i * 1.5 + 1) / 100)) / 1000) * 1000,
    count: ((pid * 5 + i) % 4) + 1,
  })).sort((a, b) => b.price - a.price);

  const priceHistory: number[] = Array.from({ length: 28 }, (_, i) => {
    const v = 1 + (((pid * 3 + i * 7) % 21) - 10) / 100;
    return Math.round((base * v) / 1000) * 1000;
  });

  const instantSellPrice = buyBids[0]?.price ?? 0;
  const instantBuyPrice  = sellBids[0]?.price ?? 0;

  return { concluded, sellBids, buyBids, priceHistory, instantSellPrice, instantBuyPrice };
}
