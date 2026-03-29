import { NextResponse } from "next/server";
import { getTickerDetail } from "@/lib/services/dashboard-service";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const payload = await getTickerDetail(code);

  if (!payload) {
    return NextResponse.json({ message: "Ticker not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
