const TIMEZONE = "Asia/Bangkok"; // GMT+7

export function getNow() {
  // 常に指定されたタイムゾーン（GMT+7）の現在時刻を返す
  return new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
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
  // D1のCURRENT_TIMESTAMPなどは末尾にZがつかないUTC形式なので、付与してUTCとして解釈させる
  const utcString = dateString.endsWith("Z") ? dateString : `${dateString.replace(" ", "T")}Z`;
  const d = new Date(utcString);
  // 表示も GMT+7 で固定
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
  if (isWeekend(date)) {
    return getNextWeekStart(date);
  }
  return getCurrentWeekStart(date);
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export function getSelectableDates(days = 10, startDate = getNow()) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  let count = 0;
  while (count < days) {
    if (!isWeekend(current)) {
      dates.push(new Date(current));
    }
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

  // 今日以前、および土日は不可
  if (target <= today || isWeekend(target)) {
    return { valid: false, message: "本日以前および土日は選択できません。" };
  }

  // 休業日の判定
  if (holidays.includes(targetDateStr)) {
    return { valid: false, message: "指定日は休業日です。" };
  }

  // 締め切り判定：前日の17時まで
  const isNextDay = targetDateStr === formatDateInput(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  if (isNextDay && now.getHours() >= 17 && !debugMode) {
    return { valid: false, message: "翌日分の注文は前日17:00で締め切りました。" };
  }

  // デバッグモードなら受取可能期間の判定をスキップ
  if (debugMode) {
    return { valid: true };
  }

  // 受取可能期間の判定
  const windowStart = getOrderWindowWeekStart(now);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowStart.getDate() + 4);

  if (target < windowStart || target > windowEnd) {
    return {
      valid: false,
      message: isWeekend(now)
        ? "土日の注文は次週の平日のみ選択できます。"
        : "受取日は当週の平日のみ選択できます。",
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
