const TIMEZONE = "Asia/Bangkok"; // GMT+7

let dateOverride = null;

export function setSystemDateOverride(date) {
  if (!date) {
    dateOverride = null;
    return;
  }
  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) {
    dateOverride = parsed;
  }
}

export function getNow() {
  if (dateOverride) {
    return new Date(dateOverride);
  }
  // GMT+7 (Asia/Bangkok) の現在時刻を取得
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

export function formatDateInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${month}/${day} (${dayOfWeek})`;
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  const utcString = dateString.endsWith("Z") ? dateString : `${dateString.replace(" ", "T")}Z`;
  const d = new Date(utcString);
  return d.toLocaleString("ja-JP", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getNextWeekStart(date = getNow()) {
  const start = getWeekStart(date);
  start.setDate(start.getDate() + 7);
  return start;
}

export function getCurrentWeekStart(date = getNow()) {
  return getWeekStart(date);
}

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWeekendNow() {
  return isWeekend(getNow());
}

export function getOrderWindowWeekStart(date = getNow()) {
  const day = date.getDay();
  // 金曜日(5)以降（金・土・日）なら翌週の開始日を、それ以外なら今週の開始日を返す
  if (day === 5 || day === 6 || day === 0) {
    return getNextWeekStart(date);
  }
  return getCurrentWeekStart(date);
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export function getSelectableDates(days = 14, startDate = getNow()) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  let count = 0;
  while (count < days) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
}

export function getOrderWindowSelectableDates(date = getNow(), holidays = []) {
  const weekStart = getOrderWindowWeekStart(date);
  const dates = getWeekDates(weekStart);
  return dates.filter((d) => canOrderDateForOrderWindow(d, date, holidays).valid);
}

export function canOrderDateForOrderWindow(targetDate, now = getNow(), holidays = [], debugMode = false) {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const targetDateStr = formatDateInput(target);
  
  if (target <= today) {
    return { valid: false, message: "本日以前の日付は選択できません。" };
  }
  if (holidays.includes(targetDateStr)) {
    return { valid: false, message: "指定日は休業日です。" };
  }
  const isNextDay = targetDateStr === formatDateInput(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  if (isNextDay && now.getHours() >= 17 && !debugMode) {
    return { valid: false, message: "翌日分の注文は前日17:00で締め切りました。" };
  }
  if (debugMode) {
    return { valid: true };
  }
  // 受取可能期間の判定（アクティブな週の7日間のみ許可）
  const windowStart = getOrderWindowWeekStart(now);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowStart.getDate() + 6); // 1週間分

  if (target < windowStart || target > windowEnd) {
    return {
      valid: false,
      message: "受取日は現在表示されている週の日付のみ選択できます。",
    };
  }
  return { valid: true };
}

export function parseDateInput(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function getNextSelectableDate(now = getNow()) {
  const dates = getSelectableDates(14, now);
  return dates.find((d) => canOrderDateForOrderWindow(d, now).valid) || dates[0];
}
