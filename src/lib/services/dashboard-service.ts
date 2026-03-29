import { flowHistoryByCode, signalScores } from "@/data/dashboard-data";
import { createDartSource } from "@/lib/sources/dart-source";
import { createKrxSource } from "@/lib/sources/krx-source";
import type {
  DashboardPayload,
  DashboardSummary,
  DisclosureEvent,
  RankingRow,
  SignalScore,
  TickerDetailPayload,
} from "@/types/dashboard";

function buildSummary(
  rankings: RankingRow[],
  disclosures: DisclosureEvent[],
  signals: SignalScore[],
): DashboardSummary {
  const topNetBuy = rankings.reduce((best, row) =>
    row.privateEquityNetBuy > best.privateEquityNetBuy ? row : best,
  );
  const topWeight = rankings.reduce((best, row) =>
    row.privateEquityWeight > best.privateEquityWeight ? row : best,
  );
  const averageWeightPct =
    rankings.reduce((sum, row) => sum + row.privateEquityWeight, 0) / rankings.length;

  return {
    totalTracked: rankings.length,
    topPrivateEquityName: topNetBuy.name,
    topPrivateEquityNetBuy: topNetBuy.privateEquityNetBuy,
    topWeightName: topWeight.name,
    topWeightPct: topWeight.privateEquityWeight,
    averageWeightPct,
    disclosureCount: disclosures.length,
    signalACount: signals.filter((signal) => signal.grade === "A").length,
  };
}

export async function getDashboardPayload(
  asOfDate?: string,
  liveRequested = false,
): Promise<DashboardPayload> {
  const krxSource = await createKrxSource(liveRequested);
  const dartSource = createDartSource();

  const snapshot = await krxSource.getPrivateEquitySnapshot(asOfDate);
  const codes = snapshot.rankings.map((row) => row.code);
  const disclosures = await dartSource.getRecentDisclosures(codes);
  const signals = signalScores.filter((signal) => codes.includes(signal.code));

  return {
    overview: snapshot.overview,
    summary: buildSummary(snapshot.rankings, disclosures, signals),
    rankings: snapshot.rankings,
    disclosures,
    signals,
    generatedAt: new Date().toISOString(),
    collector: snapshot.collector,
  };
}

export async function getTickerDetail(code: string): Promise<TickerDetailPayload | null> {
  const dashboard = await getDashboardPayload();
  const ranking = dashboard.rankings.find((item) => item.code === code);

  if (!ranking) {
    return null;
  }

  return {
    code,
    companyName: ranking.name,
    history: flowHistoryByCode[code] ?? [],
    disclosures: dashboard.disclosures.filter((event) => event.code === code),
    signal: dashboard.signals.find((signal) => signal.code === code) ?? null,
  };
}
