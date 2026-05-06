export const runtime = "edge";

import { NextResponse } from "next/server";
import { isDebugMode } from "../../../lib/db";

export async function GET() {
  const debugMode = await isDebugMode();
  return NextResponse.json({ debugMode });
}
