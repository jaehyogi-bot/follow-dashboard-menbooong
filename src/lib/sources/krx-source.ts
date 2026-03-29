import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rankingRows, reportMeta } from "@/data/dashboard-data";
import type { CollectorInfo, DashboardOverview, RankingRow } from "@/types/dashboard";

const execFileAsync = promisify(execFile);

export type FlowSnapshot = {
  overview: DashboardOverview;
  rankings: RankingRow[];
  collector: CollectorInfo;
};

export interface KrxSource {
  getPrivateEquitySnapshot(asOfDate?: string): Promise<FlowSnapshot>;
}

type PythonSnapshot = {
  ok: boolean;
  asOfDate: string;
  rankings: RankingRow[];
  warnings: string[];
};

export class MockKrxSource implements KrxSource {
  constructor(
    private readonly liveRequested = false,
    private readonly warnings: string[] = [],
  ) {}

  async getPrivateEquitySnapshot(asOfDate?: string): Promise<FlowSnapshot> {
    return {
      overview: {
        ...reportMeta,
        asOfDate: asOfDate ?? reportMeta.asOfDate,
      },
      rankings: rankingRows,
      collector: {
        source: "mock",
        liveRequested: this.liveRequested,
        warnings: this.warnings,
      },
    };
  }
}

export class PyKrxSource implements KrxSource {
  async getPrivateEquitySnapshot(asOfDate?: string): Promise<FlowSnapshot> {
    const scriptPath = process.cwd() + "\\scripts\\fetch_krx_snapshot.py";
    const { stdout } = await execFileAsync("python", [scriptPath, asOfDate ?? ""], {
      cwd: process.cwd(),
      timeout: 120000,
    });
    const payload = JSON.parse(stdout) as PythonSnapshot;

    if (!payload.ok || payload.rankings.length === 0) {
      throw new Error(payload.warnings.join(" | ") || "pykrx collector returned no rows");
    }

    return {
      overview: {
        ...reportMeta,
        asOfDate: payload.asOfDate,
      },
      rankings: payload.rankings,
      collector: {
        source: "pykrx",
        liveRequested: true,
        warnings: payload.warnings,
      },
    };
  }
}

export async function createKrxSource(liveRequested = false): Promise<KrxSource> {
  if (!liveRequested) {
    return new MockKrxSource();
  }

  try {
    const source = new PyKrxSource();
    await source.getPrivateEquitySnapshot();
    return source;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "live KRX collector initialization failed";
    return new MockKrxSource(true, [
      "실시간 KRX 수집이 실패해서 목업 데이터로 폴백했습니다.",
      message,
    ]);
  }
}
