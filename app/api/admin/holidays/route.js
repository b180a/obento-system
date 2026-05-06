export const runtime = "edge";

import { NextResponse } from "next/server";
import { addHoliday, getHolidays } from "../../../../lib/db";

export async function GET() {
  try {
    const holidays = await getHolidays();
    return NextResponse.json({ holidays });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json({ error: "日付を指定してください。" }, { status: 400 });
    }

    await addHoliday({ date, reason });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
