export const runtime = "edge";

import { NextResponse } from "next/server";
import { getAllOrders, getMenuByDate, getOrdersByDate, getOrderSummaryByDate } from "../../../../lib/db";
import { parseDateInput } from "../../../../lib/date";

export async function GET(request) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const view = request.nextUrl.searchParams.get("view");

  if (view === "all") {
    return NextResponse.json({ orders: await getAllOrders() });
  }

  const date = parseDateInput(dateParam || "");

  if (!date) {
    return NextResponse.json(
      { error: "日付の形式が不正です。" },
      { status: 400 },
    );
  }

  const orders = await getOrdersByDate(dateParam);
  const summary = await getOrderSummaryByDate(dateParam);
  const menu = await getMenuByDate(dateParam);

  return NextResponse.json({ orders, summary, menu });
}
