export const runtime = "edge";

import { NextResponse } from "next/server";
import { getHolidays } from "../../../lib/db";

export async function GET() {
  try {
    const holidays = await getHolidays();
    return NextResponse.json({ holidays });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
