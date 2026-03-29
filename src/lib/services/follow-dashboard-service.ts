import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { FollowDashboardPayload } from "@/types/dashboard";

const execFileAsync = promisify(execFile);
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { payload: FollowDashboardPayload; cachedAt: number }>();

async function collectFollowDashboard(date?: string): Promise<FollowDashboardPayload> {
  const scriptPath = path.join(process.cwd(), "scripts", "build_private_equity_ranking.py");
  const args = ["-X", "utf8", scriptPath, "--market", "ALL", "--limit", "60", "--json"];
  if (date) {
    args.push("--date", date);
  }
  const { stdout } = await execFileAsync(
    "python",
    args,
    {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 8,
      env: {
        ...process.env,
        PYTHONUTF8: "1",
        PYTHONIOENCODING: "utf-8",
      },
    },
  );

  return JSON.parse(stdout) as FollowDashboardPayload;
}

export async function getFollowDashboardPayload(date?: string, forceRefresh = false): Promise<FollowDashboardPayload> {
  const now = Date.now();
  const key = date ?? "latest";
  const cached = cache.get(key);
  if (!forceRefresh && cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.payload;
  }

  const payload = await collectFollowDashboard(date);
  cache.set(key, { payload, cachedAt: now });
  return payload;
}
