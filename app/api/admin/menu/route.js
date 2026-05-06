export const runtime = "edge";

import { NextResponse } from "next/server";
import { getMenuByWeekStart, listUpcomingMenuWeeks } from "../../../../lib/db";
import { formatDateInput, getWeekStart, parseDateInput } from "../../../../lib/date";

export async function GET(request) {
  const referenceDate = request.nextUrl.searchParams.get("reference_date");

  if (!referenceDate) {
    return NextResponse.json({ weeks: await listUpcomingMenuWeeks() });
  }

  const parsed = parseDateInput(referenceDate);
  if (!parsed) {
    return NextResponse.json(
      { error: "日付の形式が不正です。" },
      { status: 400 },
    );
  }

  const weekStart = formatDateInput(getWeekStart(parsed));
  return NextResponse.json({
    week_start_date: weekStart,
    menu: await getMenuByWeekStart(weekStart),
  });
}
