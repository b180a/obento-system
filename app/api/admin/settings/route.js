export const runtime = "edge";

import { NextResponse } from "next/server";
import { getSetting, updateSetting } from "../../../../lib/db";

export async function GET() {
  const debugMode = await getSetting("debug_mode");
  return NextResponse.json({ debug_mode: debugMode });
}

export async function POST(request) {
  try {
    const { debug_mode } = await request.json();
    if (debug_mode !== "on" && debug_mode !== "off") {
      return NextResponse.json({ error: "無効な設定値です。" }, { status: 400 });
    }

    await updateSetting("debug_mode", debug_mode);
    return NextResponse.json({ success: true, debug_mode });
  } catch (error) {
    return NextResponse.json({ error: "設定の更新に失敗しました。" }, { status: 500 });
  }
}
