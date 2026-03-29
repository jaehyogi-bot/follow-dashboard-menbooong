import { NextResponse } from "next/server";
import { getFollowDashboardPayload } from "@/lib/services/follow-dashboard-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";
  const date = searchParams.get("date") ?? undefined;
  const normalizedDate = date ? date.replaceAll("-", "") : undefined;
  const payload = await getFollowDashboardPayload(normalizedDate, refresh);
  return NextResponse.json(payload);
}
