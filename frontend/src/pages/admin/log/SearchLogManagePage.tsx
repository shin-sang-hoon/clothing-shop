import { useEffect, useState } from "react";
import AdminPagination from "@/components/admin/common/AdminPagination";
import {
  apiGetAdminFilterActionLogs,
  apiGetAdminSearchLogs,
  type AdminFilterActionLogRow,
  type AdminSearchLogRow,
} from "@/shared/api/admin/searchLogApi";
import { formatDateTime } from "@/components/admin/log/logUtils";
import styles from "../admin.module.css";

type SearchLogTab = "keyword" | "filter";

export default function SearchLogManagePage() {
  const [activeTab, setActiveTab] = useState<SearchLogTab>("keyword");
  const [keywordLogs, setKeywordLogs] = useState<AdminSearchLogRow[]>([]);
  const [filterLogs, setFilterLogs] = useState<AdminFilterActionLogRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [keyword, setKeyword] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedMemberEmail, setAppliedMemberEmail] = useState("");
  const [appliedIpAddress, setAppliedIpAddress] = useState("");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [first, setFirst] = useState(true);
  const [last, setLast] = useState(true);

  async function loadLogs(
    tab: SearchLogTab,
    nextPage: number,
    nextSize: number,
    filters: {
      keyword: string;
      memberEmail: string;
      ipAddress: string;
    },
  ): Promise<void> {
    try {
      setIsLoading(true);

      if (tab === "keyword") {
        const response = await apiGetAdminSearchLogs({
          page: nextPage,
          size: nextSize,
          keyword: filters.keyword,
          memberEmail: filters.memberEmail,
          ipAddress: filters.ipAddress,
        });
        setKeywordLogs(response.content);
        setFilterLogs([]);
        setPage(response.page);
        setSize(response.size);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setFirst(response.first);
        setLast(response.last);
        return;
      }

      const response = await apiGetAdminFilterActionLogs({
        page: nextPage,
        size: nextSize,
        filterName: filters.keyword,
        memberEmail: filters.memberEmail,
        ipAddress: filters.ipAddress,
      });
      setFilterLogs(response.content);
      setKeywordLogs([]);
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
    void loadLogs(activeTab, 0, size, {
      keyword: appliedKeyword,
      memberEmail: appliedMemberEmail,
      ipAddress: appliedIpAddress,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleSearch(): void {
    setAppliedKeyword(keyword);
    setAppliedMemberEmail(memberEmail);
    setAppliedIpAddress(ipAddress);
    void loadLogs(activeTab, 0, size, {
      keyword,
      memberEmail,
      ipAddress,
    });
  }

  function handleReset(): void {
    setKeyword("");
    setMemberEmail("");
    setIpAddress("");
    setAppliedKeyword("");
    setAppliedMemberEmail("");
    setAppliedIpAddress("");
    void loadLogs(activeTab, 0, size, {
      keyword: "",
      memberEmail: "",
      ipAddress: "",
    });
  }

  function handleChangePage(nextPage: number): void {
    if (nextPage < 0 || nextPage >= totalPages) {
      return;
    }
    void loadLogs(activeTab, nextPage, size, {
      keyword: appliedKeyword,
      memberEmail: appliedMemberEmail,
      ipAddress: appliedIpAddress,
    });
  }

  function handleChangePageSize(nextSize: number): void {
    setSize(nextSize);
    void loadLogs(activeTab, 0, nextSize, {
      keyword: appliedKeyword,
      memberEmail: appliedMemberEmail,
      ipAddress: appliedIpAddress,
    });
  }

  const isKeywordTab = activeTab === "keyword";
  const filterLabel = isKeywordTab ? "검색어(keyword)" : "필터명(filter)";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>검색 기록</h1>
          <p className={styles.pageDesc}>키워드 검색 / 필터 선택 이력을 조회합니다.</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${isKeywordTab ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("keyword")}
        >
          키워드 검색 기록
        </button>
        <button
          type="button"
          className={`${styles.tab} ${!isKeywordTab ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("filter")}
        >
          필터 선택 기록
        </button>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder={filterLabel}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <input
          className={styles.searchInput}
          placeholder="회원 이메일"
          value={memberEmail}
          onChange={(event) => setMemberEmail(event.target.value)}
        />
        <input
          className={styles.searchInput}
          placeholder="IP 주소"
          value={ipAddress}
          onChange={(event) => setIpAddress(event.target.value)}
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

        {isKeywordTab ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>회원</th>
                <th>검색어</th>
                <th>정규화 검색어</th>
                <th>IP</th>
                <th>User-Agent</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    로그를 불러오는 중입니다.
                  </td>
                </tr>
              ) : keywordLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    조회된 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                keywordLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: "#94a3b8" }}>{log.id}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.memberEmail ?? "-"}</td>
                    <td style={{ fontWeight: 600 }}>{log.keyword}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.normalizedKeyword}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.ipAddress ?? "-"}</td>
                    <td style={{ color: "#6b7280", fontSize: 12, maxWidth: 340 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.userAgent ?? "-"}
                      </div>
                    </td>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>{formatDateTime(log.searchedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>회원</th>
                <th>필터명</th>
                <th>필터ID</th>
                <th>IP</th>
                <th>User-Agent</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    로그를 불러오는 중입니다.
                  </td>
                </tr>
              ) : filterLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    조회된 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                filterLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: "#94a3b8" }}>{log.id}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.memberEmail ?? "-"}</td>
                    <td style={{ fontWeight: 600 }}>{log.filterName ?? "-"}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.filterId ?? "-"}</td>
                    <td style={{ color: "#6b7280", fontSize: 12 }}>{log.ipAddress ?? "-"}</td>
                    <td style={{ color: "#6b7280", fontSize: 12, maxWidth: 340 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.userAgent ?? "-"}
                      </div>
                    </td>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>{formatDateTime(log.occurredAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
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
