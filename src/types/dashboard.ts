export type RankingRow = {
  rank: number;
  code: string;
  name: string;
  marketCap: number;
  institutionNetBuy: number;
  foreignerNetBuy: number;
  privateEquityNetBuy: number;
  privateEquityWeight: number;
  privateEquityRank: number;
  foreignerRank: number;
  corporationRank: number;
};

export type DisclosureCategory =
  | "5PCT"
  | "EXECUTIVE"
  | "MAJOR_SHAREHOLDER"
  | "CHANGE_IN_HOLDING";

export type DisclosureEvent = {
  id: string;
  code: string;
  companyName: string;
  reportDate: string;
  category: DisclosureCategory;
  reportTitle: string;
  filerName: string;
  shareChangePct: number;
  ownershipAfterPct: number;
  sourceUrl: string;
};

export type SignalGrade = "A" | "B" | "C";

export type SignalScore = {
  code: string;
  companyName: string;
  grade: SignalGrade;
  score: number;
  reasons: string[];
  hasRecentDisclosure: boolean;
};

export type FlowHistoryPoint = {
  date: string;
  privateEquityNetBuy: number;
  institutionNetBuy: number;
  foreignerNetBuy: number;
};

export type DashboardOverview = {
  title: string;
  subtitle: string;
  asOfDate: string;
  marketLabel: string;
  unitLabel: string;
};

export type DashboardSummary = {
  totalTracked: number;
  topPrivateEquityName: string;
  topPrivateEquityNetBuy: number;
  topWeightName: string;
  topWeightPct: number;
  averageWeightPct: number;
  disclosureCount: number;
  signalACount: number;
};

export type CollectorInfo = {
  source: "mock" | "pykrx";
  liveRequested: boolean;
  warnings: string[];
};

export type DashboardPayload = {
  overview: DashboardOverview;
  summary: DashboardSummary;
  rankings: RankingRow[];
  disclosures: DisclosureEvent[];
  signals: SignalScore[];
  generatedAt: string;
  collector: CollectorInfo;
};

export type TickerDetailPayload = {
  code: string;
  companyName: string;
  history: FlowHistoryPoint[];
  disclosures: DisclosureEvent[];
  signal: SignalScore | null;
};

export type FollowRankingRow = {
  rank: number;
  code: string;
  name: string;
  marketCapBilKrw: number;
  privateNetBuyBilKrw: number;
  trustNetBuyBilKrw: number;
  mainNetBuyBilKrw: number;
  institutionNetBuyBilKrw: number;
  foreignerNetBuyBilKrw: number;
  privateRatioPct: number;
  privateRatioWowChangePctp: number;
  trustRatioWowChangePctp: number;
  mainSignalPct: number;
  institutionRatioPct: number;
  foreignerRatioPct: number;
  scorePct: number;
  changeRatePct: number;
  turnoverTodayBilKrw: number;
  private52wRank: number | null;
  main52wRank: number | null;
  naverFinanceUrl: string;
};

export type FollowDashboardOverview = {
  title: string;
  subtitle: string;
  asOfDate: string;
  dateRange: {
    start: string;
    end: string;
  };
  marketLabel: string;
  unitLabel: string;
};

export type FollowDashboardSummary = {
  totalTracked: number;
  topScoreName: string;
  topScorePct: number;
  topMainSignalName: string;
  topMainSignalPct: number;
  topTrustAccelerationName: string;
  topTrustAccelerationPctp: number;
  averageMainSignalPct: number;
  main52wTopCount: number;
};

export type FollowDashboardPayload = {
  overview: FollowDashboardOverview;
  summary: FollowDashboardSummary;
  rankings: FollowRankingRow[];
  generatedAt: string;
};

export type StaticSnapshotIndex = {
  latestDate: string;
  availableDates: Array<{
    date: string;
    path: string;
  }>;
};
