export const runtime = "edge";

import { NextResponse } from "next/server";
import { getDashboardSummary } from "../../../../lib/db";

export async function GET(request) {
  const days = Number(request.nextUrl.searchParams.get("days") || "10");
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 1), 20) : 10;

  return NextResponse.json(await getDashboardSummary(safeDays));
}
