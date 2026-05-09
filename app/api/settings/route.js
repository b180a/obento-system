export const runtime = "edge";

import { NextResponse } from "next/server";
import { isDebugMode, getSetting } from "../../../lib/db";

export async function GET() {
  const debugMode = await isDebugMode();
  const debugSystemDate = await getSetting("debug_system_date");
  return NextResponse.json({ debugMode, debugSystemDate });
}
