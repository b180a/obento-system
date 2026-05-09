export const runtime = "edge";

import { NextResponse } from "next/server";
import { getMenuByDate, isDebugMode, getSetting } from "../../../lib/db";
import { canOrderDateForOrderWindow, parseDateInput, setSystemDateOverride } from "../../../lib/date";

function toMenuItems(menu) {
  const toImageSrc = (value) => {
    if (!value) {
      return "";
    }

    if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    return `/api/menu-image?pathname=${encodeURIComponent(value)}`;
  };

  const parseJSON = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  return [
    { name: menu.item_1, image: toImageSrc(menu.item_1_image), sizes: parseJSON(menu.item_1_sizes), options: parseJSON(menu.item_1_options) },
    { name: menu.item_2, image: toImageSrc(menu.item_2_image), sizes: parseJSON(menu.item_2_sizes), options: parseJSON(menu.item_2_options) },
    { name: menu.item_3, image: toImageSrc(menu.item_3_image), sizes: parseJSON(menu.item_3_sizes), options: parseJSON(menu.item_3_options) },
    { name: menu.item_4, image: toImageSrc(menu.item_4_image), sizes: parseJSON(menu.item_4_sizes), options: parseJSON(menu.item_4_options) },
  ];
}

export async function GET(request) {
  const debugMode = await isDebugMode();
  if (debugMode) {
    const override = await getSetting("debug_system_date");
    setSystemDateOverride(override);
  } else {
    setSystemDateOverride(null);
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const date = parseDateInput(dateParam || "");

  if (!date) {
    return NextResponse.json(
      { error: "日付の形式が不正です。" },
      { status: 400 },
    );
  }

  const validation = canOrderDateForOrderWindow(date);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const menu = await getMenuByDate(dateParam);
  if (!menu) {
    return NextResponse.json(
      { error: "指定日のメニューが未設定です。" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    menu: {
      week_start_date: menu.week_start_date,
      items: toMenuItems(menu),
    },
  });
}
