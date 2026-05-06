export const runtime = "edge";

import { NextResponse } from "next/server";
import { deleteHoliday } from "../../../../../lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "日付を指定してください。" }, { status: 400 });
    }

    await deleteHoliday(date);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
