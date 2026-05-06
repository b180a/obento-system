export const runtime = "edge";

import { getOrdersByDate } from "../../../../lib/db";
import { parseDateInput, formatDateTime } from "../../../../lib/date";

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export async function GET(request) {
  const dateParam = request.nextUrl.searchParams.get("date");
  const date = parseDateInput(dateParam || "");

  if (!date) {
    return new Response("日付の形式が不正です。", { status: 400 });
  }

  const orders = await getOrdersByDate(dateParam);
  const header = [
    "created_at",
    "delivery_date",
    "grade",
    "class_name",
    "full_name",
    "email",
    "ticket_number",
    "selected_menu_item",
    "status",
  ];

  const rows = orders.map((order) =>
    [
      formatDateTime(order.created_at),
      order.delivery_date,
      order.grade,
      order.class_name,
      order.full_name,
      order.email,
      order.ticket_number,
      order.selected_menu_item,
      order.status,
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${dateParam}.csv"`,
    },
  });
}
