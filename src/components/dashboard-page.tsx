"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { FollowDashboardPayload, FollowRankingRow, StaticSnapshotIndex } from "@/types/dashboard";
import styles from "./dashboard-page.module.css";

type SortKey =
  | "rank"
  | "mainSignalPct"
  | "scorePct"
  | "mainNetBuyBilKrw"
  | "trustRatioWowChangePctp"
  | "privateRatioWowChangePctp"
  | "changeRatePct"
  | "main52wRank"
  | "compareMainSignalDeltaPctp"
  | "compareScoreDeltaPctp";

type DisplayRow = FollowRankingRow & {
  compareMainSignalDeltaPctp: number | null;
  compareScoreDeltaPctp: number | null;
  compareRankDelta: number | null;
};

function formatAmount(value: number) {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4,
  });
}

function formatPct(value: number) {
  return `${value.toFixed(4)}%`;
}

function formatSignedPct(value: number | null) {
  if (value === null) {
    return "-";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(4)}%p`;
}

function formatRank(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value} / 52`;
}

function formatRankDelta(value: number | null) {
  if (value === null) {
    return "-";
  }
  if (value === 0) {
    return "변화 없음";
  }
  if (value < 0) {
    return `${Math.abs(value)}계단 상승`;
  }
  return `${value}계단 하락`;
}

function getSortValue(row: DisplayRow, sortKey: SortKey) {
  if (sortKey === "main52wRank") {
    return row.main52wRank ?? 999;
  }
  if (sortKey === "compareMainSignalDeltaPctp" || sortKey === "compareScoreDeltaPctp") {
    return row[sortKey] ?? -999;
  }
  return row[sortKey];
}

function sortRows(rows: DisplayRow[], sortKey: SortKey, desc: boolean) {
  const next = [...rows];
  next.sort((a, b) => {
    const gap = getSortValue(a, sortKey) - getSortValue(b, sortKey);
    return desc ? -gap : gap;
  });
  return next;
}

function getDeltaClassName(value: number | null) {
  if (value === null || value === 0) {
    return styles.deltaNeutral;
  }
  return value > 0 ? styles.deltaPositive : styles.deltaNegative;
}

async function fetchSnapshot(path: string) {
  const response = await fetch(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`failed to fetch snapshot: ${path}`);
  }
  return (await response.json()) as FollowDashboardPayload;
}

export function DashboardPage() {
  const [indexData, setIndexData] = useState<StaticSnapshotIndex | null>(null);
  const [data, setData] = useState<FollowDashboardPayload | null>(null);
  const [compareData, setCompareData] = useState<FollowDashboardPayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("scorePct");
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [compareDate, setCompareDate] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let mounted = true;

    async function loadIndex() {
      try {
        const response = await fetch("/data/follow-dashboard/index.json", { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("failed to fetch index");
        }
        const payload = (await response.json()) as StaticSnapshotIndex;
        if (!mounted) {
          return;
        }
        setIndexData(payload);
        setSelectedDate(payload.latestDate);
        setStatus("ready");
      } catch {
        if (!mounted) {
          return;
        }
        setStatus("error");
      }
    }

    void loadIndex();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!indexData || !selectedDate) {
      return;
    }

    const activeIndex = indexData;
    let mounted = true;

    async function loadSnapshots() {
      try {
        setStatus("loading");
        const currentEntry = activeIndex.availableDates.find((item) => item.date === selectedDate);
        const compareEntry = compareDate
          ? activeIndex.availableDates.find((item) => item.date === compareDate)
          : undefined;

        if (!currentEntry) {
          throw new Error("selected date not found");
        }

        const [currentPayload, comparePayload] = await Promise.all([
          fetchSnapshot(currentEntry.path),
          compareEntry ? fetchSnapshot(compareEntry.path) : Promise.resolve(null),
        ]);

        if (!mounted) {
          return;
        }

        setData(currentPayload);
        setCompareData(comparePayload);
        setStatus("ready");
      } catch {
        if (!mounted) {
          return;
        }
        setStatus("error");
      }
    }

    void loadSnapshots();

    return () => {
      mounted = false;
    };
  }, [compareDate, indexData, selectedDate]);

  const dateOptions = indexData?.availableDates ?? [];
  const compareEnabled = Boolean(compareData && compareDate);

  const displayedRows = useMemo(() => {
    if (!data) {
      return [];
    }

    const compareMap = new Map(compareData?.rankings.map((row) => [row.code, row]) ?? []);
    const keyword = deferredSearch.trim().toLowerCase();

    const rows = data.rankings
      .map<DisplayRow>((row) => {
        const compareRow = compareMap.get(row.code);
        return {
          ...row,
          compareMainSignalDeltaPctp: compareRow
            ? Number((row.mainSignalPct - compareRow.mainSignalPct).toFixed(4))
            : null,
          compareScoreDeltaPctp: compareRow
            ? Number((row.scorePct - compareRow.scorePct).toFixed(4))
            : null,
          compareRankDelta: compareRow ? row.rank - compareRow.rank : null,
        };
      })
      .filter((row) => {
        if (!keyword) {
          return true;
        }
        return row.name.toLowerCase().includes(keyword) || row.code.includes(keyword);
      });

    return sortRows(rows, sortKey, sortDesc);
  }, [compareData, data, deferredSearch, sortDesc, sortKey]);

  const topRows = displayedRows.slice(0, 12);

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDesc((prev) => !prev);
      return;
    }

    setSortKey(nextKey);
    setSortDesc(nextKey !== "main52wRank" && nextKey !== "rank");
  };

  const openTicker = (row: FollowRankingRow) => {
    window.open(row.naverFinanceUrl, "_blank", "noopener,noreferrer");
  };

  const moveDate = (current: string, setter: (value: string) => void, direction: -1 | 1) => {
    const dates = dateOptions.map((item) => item.date);
    const currentIndex = dates.indexOf(current);
    if (currentIndex === -1) {
      return;
    }
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= dates.length) {
      return;
    }
    setter(dates[nextIndex]);
  };

  if (status === "loading" && !data) {
    return (
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>PRIVATE EQUITY FLOW MONITOR</p>
          <h1>대시보드를 불러오는 중</h1>
          <p className={styles.subcopy}>배포 시점에 생성된 정적 데이터를 읽고 있습니다.</p>
        </section>
      </main>
    );
  }

  if (status === "error" || !data || !indexData) {
    return (
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>PRIVATE EQUITY FLOW MONITOR</p>
          <h1>데이터를 불러오지 못했습니다</h1>
          <p className={styles.subcopy}>정적 데이터 생성이나 배포 상태를 확인해 주세요.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}>PRIVATE EQUITY FLOW MONITOR</p>
          <h1>{data.overview.title}</h1>
          <p className={styles.subcopy}>
            {data.overview.subtitle} 최근 {dateOptions.length}개 거래일 스냅샷을 미리 생성해 빠르게 보여줍니다.
          </p>
        </div>

        <div className={styles.heroMeta}>
          <span>{data.overview.marketLabel}</span>
          <strong>{data.overview.asOfDate}</strong>
          <small>{data.overview.unitLabel}</small>
          <small>
            조회 구간 {data.overview.dateRange.start} ~ {data.overview.dateRange.end}
          </small>
          <small>생성 시각 {new Date(data.generatedAt).toLocaleString("ko-KR")}</small>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span>표본 종목 수</span>
          <strong>{data.summary.totalTracked}</strong>
          <small>필터 통과 종목 기준</small>
        </article>
        <article className={styles.summaryCard}>
          <span>추종 점수 1위</span>
          <strong>{data.summary.topScoreName}</strong>
          <small>{formatPct(data.summary.topScorePct)}</small>
        </article>
        <article className={styles.summaryCard}>
          <span>메인신호 최고</span>
          <strong>{data.summary.topMainSignalName}</strong>
          <small>{formatPct(data.summary.topMainSignalPct)}</small>
        </article>
        <article className={styles.summaryCard}>
          <span>투신 가속 최고</span>
          <strong>{data.summary.topTrustAccelerationName}</strong>
          <small>{formatPct(data.summary.topTrustAccelerationPctp)}</small>
        </article>
        <article className={styles.summaryCard}>
          <span>52주 메인 1위</span>
          <strong>{data.summary.main52wTopCount}개</strong>
          <small>상위 30 기준</small>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelTitle}>사모·투신 추종 테이블</p>
            <p className={styles.panelDescription}>
              기준일과 비교일을 미리 생성된 스냅샷에서 골라 빠르게 비교할 수 있습니다. 종목을 누르면 네이버증권 종목 페이지를 새 탭으로 엽니다.
            </p>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.quickStats}>
              <span>평균 메인신호 {formatPct(data.summary.averageMainSignalPct)}</span>
              <span>검색 결과 {displayedRows.length}개</span>
              {compareEnabled ? <span>비교일 {compareData?.overview.asOfDate}</span> : null}
            </div>

            <div className={styles.dateBlock}>
              <div className={styles.dateGroup}>
                <label className={styles.dateLabel}>기준일</label>
                <div className={styles.dateControls}>
                  <button type="button" onClick={() => moveDate(selectedDate, setSelectedDate, 1)}>
                    이전
                  </button>
                  <select
                    className={styles.dateInput}
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  >
                    {dateOptions.map((item) => (
                      <option key={item.date} value={item.date}>
                        {item.date}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => moveDate(selectedDate, setSelectedDate, -1)}>
                    최신쪽
                  </button>
                </div>
              </div>

              <div className={styles.dateGroup}>
                <label className={styles.dateLabel}>비교일</label>
                <div className={styles.dateControls}>
                  <button type="button" onClick={() => compareDate && moveDate(compareDate, setCompareDate, 1)}>
                    이전
                  </button>
                  <select
                    className={styles.dateInput}
                    value={compareDate}
                    onChange={(event) => setCompareDate(event.target.value)}
                  >
                    <option value="">비교 안 함</option>
                    {dateOptions
                      .filter((item) => item.date !== selectedDate)
                      .map((item) => (
                        <option key={item.date} value={item.date}>
                          {item.date}
                        </option>
                      ))}
                  </select>
                  <button type="button" onClick={() => compareDate && moveDate(compareDate, setCompareDate, -1)}>
                    최신쪽
                  </button>
                </div>
              </div>
            </div>

            <input
              aria-label="종목 검색"
              className={styles.search}
              placeholder="종목명 또는 종목코드 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {compareEnabled ? (
          <div className={styles.compareInfo}>
            <span>
              기준일 {data.overview.asOfDate} vs 비교일 {compareData?.overview.asOfDate}
            </span>
            <span>비교 메인과 비교 점수는 두 스냅샷 사이 변화폭입니다.</span>
          </div>
        ) : null}

        <div className={styles.sortBar}>
          <button type="button" onClick={() => handleSort("scorePct")}>
            추종점수순
          </button>
          <button type="button" onClick={() => handleSort("mainSignalPct")}>
            메인신호순
          </button>
          <button type="button" onClick={() => handleSort("trustRatioWowChangePctp")}>
            투신 변화순
          </button>
          {compareEnabled ? (
            <button type="button" onClick={() => handleSort("compareMainSignalDeltaPctp")}>
              비교 메인순
            </button>
          ) : null}
          <button type="button" onClick={() => handleSort("main52wRank")}>
            52주 신선도순
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => handleSort("rank")}>
                    순위
                  </button>
                </th>
                <th>종목</th>
                <th>
                  <button type="button" onClick={() => handleSort("mainNetBuyBilKrw")}>
                    메인 순매수
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("mainSignalPct")}>
                    메인신호
                  </button>
                </th>
                {compareEnabled ? (
                  <th>
                    <button type="button" onClick={() => handleSort("compareMainSignalDeltaPctp")}>
                      비교 메인
                    </button>
                  </th>
                ) : null}
                <th>
                  <button type="button" onClick={() => handleSort("privateRatioWowChangePctp")}>
                    사모 변화
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("trustRatioWowChangePctp")}>
                    투신 변화
                  </button>
                </th>
                <th>기관 비중</th>
                <th>외국인 비중</th>
                <th>
                  <button type="button" onClick={() => handleSort("scorePct")}>
                    추종점수
                  </button>
                </th>
                {compareEnabled ? (
                  <th>
                    <button type="button" onClick={() => handleSort("compareScoreDeltaPctp")}>
                      비교 점수
                    </button>
                  </th>
                ) : null}
                <th>
                  <button type="button" onClick={() => handleSort("changeRatePct")}>
                    등락률
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort("main52wRank")}>
                    52주 메인
                  </button>
                </th>
                <th>차트</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((row) => (
                <tr
                  key={row.code}
                  className={styles.clickableRow}
                  onClick={() => openTicker(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openTicker(row);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className={styles.rankCell}>{row.rank}</td>
                  <td>
                    <div className={styles.nameBlock}>
                      <strong>{row.name}</strong>
                      <small>
                        {row.code}
                        {compareEnabled ? ` · ${formatRankDelta(row.compareRankDelta)}` : ""}
                      </small>
                    </div>
                  </td>
                  <td>{formatAmount(row.mainNetBuyBilKrw)}억</td>
                  <td className={styles.signalCell}>{formatPct(row.mainSignalPct)}</td>
                  {compareEnabled ? (
                    <td className={getDeltaClassName(row.compareMainSignalDeltaPctp)}>
                      {formatSignedPct(row.compareMainSignalDeltaPctp)}
                    </td>
                  ) : null}
                  <td>{formatPct(row.privateRatioWowChangePctp)}</td>
                  <td className={styles.trustCell}>{formatPct(row.trustRatioWowChangePctp)}</td>
                  <td>{formatPct(row.institutionRatioPct)}</td>
                  <td>{formatPct(row.foreignerRatioPct)}</td>
                  <td className={styles.scoreCell}>{formatPct(row.scorePct)}</td>
                  {compareEnabled ? (
                    <td className={getDeltaClassName(row.compareScoreDeltaPctp)}>
                      {formatSignedPct(row.compareScoreDeltaPctp)}
                    </td>
                  ) : null}
                  <td className={row.changeRatePct < 0 ? styles.downCell : styles.upCell}>
                    {formatPct(row.changeRatePct)}
                  </td>
                  <td>
                    <span className={styles.rankBadge}>{formatRank(row.main52wRank)}</span>
                  </td>
                  <td>
                    <a
                      className={styles.linkButton}
                      href={row.naverFinanceUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      차트 보기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
