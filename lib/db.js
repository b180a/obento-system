import {
  formatDateInput,
  getNextSelectableDate,
  getNextWeekStart,
  getSelectableDates,
  getWeekStart,
} from "./date";

// Cloudflare D1 integration
function getDB() {
  if (typeof process !== "undefined" && process.env.DB) {
    return process.env.DB;
  }
  // This might happen during build or local dev without proper binding
  return null;
}

export async function saveUser({ grade, class_name, full_name, email }) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  const result = await db
    .prepare(
      "INSERT INTO users (grade, class_name, full_name, email) VALUES (?, ?, ?, ?) RETURNING id, created_at"
    )
    .bind(grade, class_name, full_name, email)
    .first();

  return {
    id: result.id,
    grade,
    class_name,
    full_name,
    email,
    created_at: result.created_at,
  };
}

export async function getMenuByDate(deliveryDate) {
  const db = getDB();
  if (!db) return null;

  const weekStart = formatDateInput(getWeekStart(new Date(deliveryDate)));
  return await db
    .prepare("SELECT * FROM menus WHERE week_start_date = ?")
    .bind(weekStart)
    .first();
}

export async function getMenuByWeekStart(weekStartDate) {
  const db = getDB();
  if (!db) return null;

  return await db
    .prepare("SELECT * FROM menus WHERE week_start_date = ?")
    .bind(weekStartDate)
    .first();
}

export async function hasMenuForWeek(weekStartDate) {
  const db = getDB();
  if (!db) return false;

  const result = await db
    .prepare("SELECT COUNT(*) as count FROM menus WHERE week_start_date = ?")
    .bind(weekStartDate)
    .first();
  return result.count > 0;
}

export async function listUpcomingMenuWeeks(limit = 8, now = getNextWeekStart()) {
  const db = getDB();
  if (!db) return [];

  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const weeks = [];

  for (let index = 0; index < limit; index += 1) {
    const date = new Date(current);
    date.setDate(current.getDate() + index * 7);
    const week_start_date = formatDateInput(date);
    
    const menu = await db
      .prepare("SELECT * FROM menus WHERE week_start_date = ?")
      .bind(week_start_date)
      .first();

    weeks.push({
      week_start_date,
      menu: menu || null,
    });
  }

  return weeks;
}

export async function upsertMenu({
  week_start_date,
  item_1,
  item_1_image,
  item_1_sizes,
  item_1_options,
  item_2,
  item_2_image,
  item_2_sizes,
  item_2_options,
  item_3,
  item_3_image,
  item_3_sizes,
  item_3_options,
  item_4,
  item_4_image,
  item_4_sizes,
  item_4_options,
}) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  const existing = await getMenuByWeekStart(week_start_date);

  if (existing) {
    await db
      .prepare(
        `UPDATE menus SET 
          item_1 = ?, item_1_image = ?, item_1_sizes = ?, item_1_options = ?,
          item_2 = ?, item_2_image = ?, item_2_sizes = ?, item_2_options = ?,
          item_3 = ?, item_3_image = ?, item_3_sizes = ?, item_3_options = ?,
          item_4 = ?, item_4_image = ?, item_4_sizes = ?, item_4_options = ?
        WHERE week_start_date = ?`
      )
      .bind(
        item_1 ?? "", item_1_image ?? null, item_1_sizes ?? "[]", item_1_options ?? "[]",
        item_2 ?? "", item_2_image ?? null, item_2_sizes ?? "[]", item_2_options ?? "[]",
        item_3 ?? "", item_3_image ?? null, item_3_sizes ?? "[]", item_3_options ?? "[]",
        item_4 ?? "", item_4_image ?? null, item_4_sizes ?? "[]", item_4_options ?? "[]",
        week_start_date
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO menus (
          week_start_date, 
          item_1, item_1_image, item_1_sizes, item_1_options,
          item_2, item_2_image, item_2_sizes, item_2_options,
          item_3, item_3_image, item_3_sizes, item_3_options,
          item_4, item_4_image, item_4_sizes, item_4_options
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        week_start_date,
        item_1 ?? "", item_1_image ?? null, item_1_sizes ?? "[]", item_1_options ?? "[]",
        item_2 ?? "", item_2_image ?? null, item_2_sizes ?? "[]", item_2_options ?? "[]",
        item_3 ?? "", item_3_image ?? null, item_3_sizes ?? "[]", item_3_options ?? "[]",
        item_4 ?? "", item_4_image ?? null, item_4_sizes ?? "[]", item_4_options ?? "[]"
      )
      .run();
  }
  
  return { 
    week_start_date, 
    item_1: item_1 ?? "", item_1_image: item_1_image ?? null, item_1_sizes: item_1_sizes ?? "[]", item_1_options: item_1_options ?? "[]",
    item_2: item_2 ?? "", item_2_image: item_2_image ?? null, item_2_sizes: item_2_sizes ?? "[]", item_2_options: item_2_options ?? "[]",
    item_3: item_3 ?? "", item_3_image: item_3_image ?? null, item_3_sizes: item_3_sizes ?? "[]", item_3_options: item_3_options ?? "[]",
    item_4: item_4 ?? "", item_4_image: item_4_image ?? null, item_4_sizes: item_4_sizes ?? "[]", item_4_options: item_4_options ?? "[]"
  };
}

export async function createOrder({
  user_id,
  delivery_date,
  ticket_number,
  selected_menu_item,
  size,
  options,
  other_option_text,
}) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  const result = await db
    .prepare(
      "INSERT INTO orders (user_id, delivery_date, ticket_number, selected_menu_item, size, options, other_option_text) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at"
    )
    .bind(user_id, delivery_date, ticket_number, selected_menu_item, size, options, other_option_text)
    .first();

  const user = await db
    .prepare("SELECT * FROM users WHERE id = ?")
    .bind(user_id)
    .first();

  return {
    id: result.id,
    user_id,
    delivery_date,
    ticket_number,
    selected_menu_item,
    size,
    options,
    other_option_text,
    status: "pending",
    created_at: result.created_at,
    grade: user?.grade || "",
    class_name: user?.class_name || "",
    full_name: user?.full_name || "",
    email: user?.email || "",
  };
}

export async function getOrdersByDate(date) {
  const db = getDB();
  if (!db) return [];

  const results = await db
    .prepare(
      `SELECT o.*, u.grade, u.class_name, u.full_name, u.email 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.delivery_date = ? 
       ORDER BY o.created_at DESC, o.id DESC`
    )
    .bind(date)
    .all();

  return results.results;
}

export async function getAllOrders() {
  const db = getDB();
  if (!db) return [];

  const results = await db
    .prepare(
      `SELECT o.*, u.grade, u.class_name, u.full_name, u.email 
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC, o.id DESC`
    )
    .all();

  return results.results;
}

export async function getHolidays() {
  const db = getDB();
  if (!db) return [];

  const results = await db
    .prepare("SELECT * FROM holidays ORDER BY date ASC")
    .all();

  return results.results;
}

export async function addHoliday({ date, reason }) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  await db
    .prepare("INSERT OR REPLACE INTO holidays (date, reason) VALUES (?, ?)")
    .bind(date, reason)
    .run();
  
  return { date, reason };
}

export async function deleteHoliday(date) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  await db
    .prepare("DELETE FROM holidays WHERE date = ?")
    .bind(date)
    .run();
  
  return { date };
}

export async function getOrderSummaryByDate(date) {
  const db = getDB();
  if (!db) return [];

  const results = await db
    .prepare(
      `SELECT selected_menu_item, size, COUNT(*) as count 
       FROM orders 
       WHERE delivery_date = ? 
       GROUP BY selected_menu_item, size 
       ORDER BY selected_menu_item ASC, size ASC`
    )
    .bind(date)
    .all();

  return results.results;
}

export async function getDashboardSummary(days = 10) {
  const dates = getSelectableDates(days).map((date) => formatDateInput(date));
  const rows = [];

  for (const date of dates) {
    const menu = await getMenuByDate(date);
    const summary = await getOrderSummaryByDate(date);
    // summary is [{selected_menu_item, size, count}, ...]
    
    const items = menu
      ? [menu.item_1, menu.item_2, menu.item_3, menu.item_4].map((name) => {
          const sizes = summary.filter(s => s.selected_menu_item === name);
          const totalCount = sizes.reduce((acc, s) => acc + s.count, 0);
          return {
            name,
            count: totalCount,
            sizes: sizes.map(s => ({ size: s.size, count: s.count }))
          };
        })
      : [];

    rows.push({
      delivery_date: date,
      week_start_date: formatDateInput(getWeekStart(new Date(date))),
      menu_registered: Boolean(menu),
      items,
    });
  }

  const nextWeekStart = formatDateInput(getNextWeekStart());
  const hasNextWeekMenu = await hasMenuForWeek(nextWeekStart);

  return {
    rows,
    alerts: hasNextWeekMenu
      ? []
      : [
          {
            type: "warning",
            week_start_date: nextWeekStart,
            message: "次週メニューが未登録です。週メニュー登録から設定してください。",
          },
        ],
  };
}

export async function getSetting(key) {
  const db = getDB();
  if (!db) return null;

  try {
    const result = await db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .bind(key)
      .first();
    return result ? result.value : null;
  } catch (e) {
    console.error(`Error fetching setting ${key}:`, e);
    return null;
  }
}

export async function updateSetting(key, value) {
  const db = getDB();
  if (!db) throw new Error("Database not available");

  await db
    .prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
    .bind(key, value)
    .run();
  
  return { key, value };
}

export async function isDebugMode() {
  const value = await getSetting("debug_mode");
  return value === "on";
}
