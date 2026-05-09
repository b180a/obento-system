export const runtime = "edge";

import { NextResponse } from "next/server";
import { getSetting, updateSetting } from "../../../../lib/db";

export async function GET() {
  const debugMode = await getSetting("debug_mode");
  const debugSystemDate = await getSetting("debug_system_date");
  return NextResponse.json({ 
    debug_mode: debugMode,
    debug_system_date: debugSystemDate
  });
}

export async function POST(request) {
  try {
    const { debug_mode, debug_system_date } = await request.json();
    
    if (debug_mode !== undefined) {
      if (debug_mode !== "on" && debug_mode !== "off") {
        return NextResponse.json({ error: "無効な設定値です。" }, { status: 400 });
      }
      await updateSetting("debug_mode", debug_mode);
    }

    if (debug_system_date !== undefined) {
      await updateSetting("debug_system_date", debug_system_date);
    }

    return NextResponse.json({ 
      success: true, 
      debug_mode: debug_mode ?? await getSetting("debug_mode"),
      debug_system_date: debug_system_date ?? await getSetting("debug_system_date")
    });
  } catch (error) {
    return NextResponse.json({ error: "設定の更新に失敗しました。" }, { status: 500 });
  }
}
