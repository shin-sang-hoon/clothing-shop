import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import styles from "./AdminSidebar.module.css";

interface SidebarLinkItem {
  to: string;
  label: string;
  routeKeys: string[];
}

interface SidebarPanel {
  id: string;
  title: string;
  icon: React.ReactNode;
  links: SidebarLinkItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
}

function getRouteKey(pathname: string): string {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (/^\/admin\/member\/edit\/\d+$/.test(pathname)) return "member/edit";
  return pathname.replace(/^\/admin\//, "");
}

function getPanelIdByRouteKey(routeKey: string): string {
  if (!routeKey || routeKey === "dashboard") return "dashboard";
  if (routeKey.startsWith("member") || routeKey === "members") return "member";
  if (routeKey === "main") return "main";
  if (routeKey === "items/board") return "board";
  if (routeKey.startsWith("rental")) return "rental";
  if (routeKey.startsWith("trade")) return "trade";
  if (routeKey.startsWith("chat")) return "chat";
  if (routeKey.startsWith("review")) return "review";
  if (routeKey.startsWith("log")) return "log";
  if (
    ["products", "categories", "brands", "tags", "filters", "filter-groups"].includes(routeKey) ||
    routeKey.startsWith("products/")
  ) {
    return "product";
  }
  if (
    ["permissions", "roles", "settings/category-mappings", "settings/brand-mappings"].includes(routeKey)
  ) {
    return "settings";
  }
  return "dashboard";
}

export default function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const routeKey = useMemo(() => getRouteKey(location.pathname), [location.pathname]);
  const activePanelId = useMemo(() => getPanelIdByRouteKey(routeKey), [routeKey]);
  const [visiblePanelId, setVisiblePanelId] = useState<string>(activePanelId);

  useEffect(() => {
    setVisiblePanelId(activePanelId);
  }, [activePanelId]);

  const panels: SidebarPanel[] = [
    {
      id: "dashboard",
      title: "대시보드",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ),
      links: [{ to: "/admin", label: "대시보드", routeKeys: ["dashboard"] }],
    },
    {
      id: "member",
      title: "회원 관리",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      links: [
        { to: "/admin/members", label: "회원 조회", routeKeys: ["members"] },
        { to: "/admin/member/register", label: "회원 등록", routeKeys: ["member/register"] },
      ],
    },
    {
      id: "main",
      title: "메인 관리",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      links: [{ to: "/admin/main", label: "메인 배너 관리", routeKeys: ["main"] }],
    },
    {
      id: "product",
      title: "상품 관리",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      links: [
        { to: "/admin/products", label: "상품 조회", routeKeys: ["products"] },
        { to: "/admin/products/register", label: "상품 등록", routeKeys: ["products/register"] },
        { to: "/admin/categories", label: "카테고리 관리", routeKeys: ["categories"] },
        { to: "/admin/brands", label: "브랜드 관리", routeKeys: ["brands"] },
        { to: "/admin/tags", label: "태그 관리", routeKeys: ["tags"] },
        { to: "/admin/filter-groups", label: "필터 그룹 관리", routeKeys: ["filter-groups"] },
        { to: "/admin/filters", label: "필터 관리", routeKeys: ["filters"] },
      ],
    },
    {
      id: "rental",
      title: "렌탈 관리",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      links: [{ to: "/admin/rental", label: "렌탈 조회/관리", routeKeys: ["rental"] }],
    },
    {
      id: "trade",
      title: "거래 관리",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      links: [{ to: "/admin/trade", label: "거래 이력 조회", routeKeys: ["trade"] }],
    },
    {
      id: "chat",
      title: "채팅",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      links: [{ to: "/admin/chat", label: "채팅 관리", routeKeys: ["chat"] }],
    },
    {
      id: "review",
      title: "리뷰",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      links: [{ to: "/admin/review-reports", label: "리뷰 신고 관리", routeKeys: ["review-reports"] }],
    },
    {
      id: "settings",
      title: "설정",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82 2 2 0 1 1-2.83 2.83 1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51 2 2 0 1 1-4 0 1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33 2 2 0 1 1-2.83-2.83 1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1 2 2 0 1 1 0-4 1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82 2 2 0 1 1 2.83-2.83 1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.6a2 2 0 1 1 4 0 1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33 2 2 0 1 1 2.83 2.83 1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1 2 2 0 1 1 0 4 1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      links: [
        { to: "/admin/settings/category-mappings", label: "카테고리 매핑", routeKeys: ["settings/category-mappings"] },
        { to: "/admin/settings/brand-mappings", label: "브랜드 매핑", routeKeys: ["settings/brand-mappings"] },
        // { to: "/admin/permissions", label: "권한 관리", routeKeys: ["permissions"] },
        // { to: "/admin/roles", label: "역할 관리", routeKeys: ["roles"] },
      ],
    },
    {
      id: "log",
      title: "로그",
      icon: (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      links: [
        { to: "/admin/log", label: "시스템 로그", routeKeys: ["log"] },
        { to: "/admin/log/search", label: "검색 로그", routeKeys: ["log/search"] },
      ],
    },
  ];

  function handleIconClick(panel: SidebarPanel) {
    setVisiblePanelId(panel.id);
    if (panel.links.length > 0) {
      navigate(panel.links[0].to);
    }
  }

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.icons}>
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`${styles.iconButton} ${visiblePanelId === panel.id ? styles.iconButtonActive : ""}`}
            onClick={() => handleIconClick(panel)}
            title={panel.title}
            aria-label={panel.title}
          >
            {panel.icon}
          </button>
        ))}
      </div>

      <nav className={styles.nav}>
        {panels.map((panel) => (
          <div
            key={panel.id}
            className={`${styles.panel} ${visiblePanelId === panel.id ? styles.panelVisible : ""}`}
          >
            <div className={styles.panelTitle}>{panel.title}</div>
            <ul className={styles.submenu}>
              {panel.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className={`${styles.link} ${link.routeKeys.includes(routeKey) ? styles.linkActive : ""}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
