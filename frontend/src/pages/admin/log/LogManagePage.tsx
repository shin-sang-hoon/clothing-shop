import { useEffect, useState } from "react";
import AdminPagination from "@/components/admin/common/AdminPagination";
import {
  apiGetAdminAuditLogs,
  type AdminAuditLogRow,
  type AuditCategory,
  type AuditResult,
} from "@/shared/api/admin/logApi";
import styles from "../admin.module.css";
import {
  CATEGORY_LABELS,
  RESULT_LABELS,
  CATEGORY_TABS,
  EVENT_LABELS,
  formatDateTime,
  getCategoryBadgeClass,
  getResultBadgeClass,
} from "@/components/admin/log/logUtils";

export default function LogManagePage() {
  const [logs, setLogs] = useState<AdminAuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | "">("");
  const [resultFilter, setResultFilter] = useState<AuditResult | "">("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedCategory, setAppliedCategory] = useState<AuditCategory | "">("");
  const [appliedResult, setAppliedResult] = useState<AuditResult | "">("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  async function loadLogs(
    nextPage: number,
    nextSize: number,
    filters: {
      keyword: string;
      category: AuditCategory | "";
      result: AuditResult | "";
    },
  ): Promise<void> {
    try {
      setIsLoading(true);

      const response = await apiGetAdminAuditLogs({
        page: nextPage,
        size: nextSize,
        keyword: filters.keyword,
        category: filters.category,
        result: filters.result,
      });

      setLogs(response.content);
      setPage(response.page);
      setSize(response.size);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
      setFirst(response.first);
      setLast(response.last);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs(0, size, {
      keyword: appliedKeyword,
      category: appliedCategory,
      result: appliedResult,
    });
  }, []);

  function handleSearch(): void {
    setAppliedKeyword(keyword);
    setAppliedCategory(categoryFilter);
    setAppliedResult(resultFilter);
    void loadLogs(0, size, {
      keyword,
      category: categoryFilter,
      result: resultFilter,
    });
  }

  function handleReset(): void {
    setKeyword("");
    setCategoryFilter("");
    setResultFilter("");
    setAppliedKeyword("");
    setAppliedCategory("");
    setAppliedResult("");
    void loadLogs(0, size, {
      keyword: "",
      category: "",
      result: "",
    });
  }

  function handleTabChange(nextCategory: AuditCategory | ""): void {
    setCategoryFilter(nextCategory);
    setAppliedCategory(nextCategory);
    void loadLogs(0, size, {
      keyword: appliedKeyword,
      category: nextCategory,
      result: appliedResult,
    });
  }

  function handleChangePage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }

    void loadLogs(nextPage, size, {
      keyword: appliedKeyword,
      category: appliedCategory,
      result: appliedResult,
    });
  }

  function handleChangePageSize(nextSize: number): void {
    setSize(nextSize);
    void loadLogs(0, nextSize, {
      keyword: appliedKeyword,
      category: appliedCategory,
      result: appliedResult,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>감사 로그</h1>
          <p className={styles.pageDesc}>
            인증, 관리자 작업, 카탈로그 변경 이력을 조회합니다.
          </p>
        </div>
      </div>

      <div className={styles.tabs}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={`${styles.tab} ${
              appliedCategory === tab.value ? styles.tabActive : ""
            }`}
            onClick={() => handleTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.searchBar}>
        <select
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value as AuditCategory | "")
          }
        >
          <option value="">전체 카테고리</option>
          <option value="MEMBER">회원</option>
          <option value="ADMIN">관리자</option>
          <option value="SHOP">카탈로그</option>
          <option value="CHAT">채팅</option>
          <option value="SYSTEM">시스템</option>
        </select>

        <select
          className={styles.filterSelect}
          value={resultFilter}
          onChange={(event) =>
            setResultFilter(event.target.value as AuditResult | "")
          }
        >
          <option value="">전체 결과</option>
          <option value="SUCCESS">성공</option>
          <option value="FAIL">실패</option>
        </select>

        <input
          className={styles.searchInput}
          placeholder="이벤트, 이메일, 메시지, URI 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <button type="button" className={styles.btnPrimary} onClick={handleSearch}>
          검색
        </button>

        <button type="button" className={styles.btnSecondary} onClick={handleReset}>
          초기화
        </button>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableCount}>
            총 <strong>{totalElements}</strong>건
          </span>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>No</th>
              <th>카테고리</th>
              <th>이벤트</th>
              <th>결과</th>
              <th>행위자</th>
              <th>메시지</th>
              <th>요청</th>
              <th>일시</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  로그를 불러오는 중입니다.
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  조회된 로그가 없습니다.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "#94a3b8" }}>{log.id}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${getCategoryBadgeClass(log.category)}`}
                    >
                      {CATEGORY_LABELS[log.category]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {EVENT_LABELS[log.eventType] ?? log.eventType}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${getResultBadgeClass(log.result)}`}
                    >
                      {RESULT_LABELS[log.result]}
                    </span>
                  </td>
                  <td style={{ color: "#6b7280", fontSize: 12 }}>
                    {log.actorEmail ?? "-"}
                  </td>
                  <td style={{ color: "#6b7280", fontSize: 12 }}>
                    {log.message ?? "-"}
                  </td>
                  <td style={{ color: "#6b7280", fontSize: 12 }}>
                    {[log.httpMethod, log.requestUri].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        totalElements={totalElements}
        page={page}
        size={size}
        totalPages={totalPages}
        first={first}
        last={last}
        onChangePage={handleChangePage}
        onChangePageSize={handleChangePageSize}
      />
    </div>
  );
}
