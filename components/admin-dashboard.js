"use client";

import { useEffect, useState } from "react";
import {
  formatDateInput,
  formatDateTime,
  formatLongDate,
  getCurrentWeekStart,
  getNow,
  getNextWeekStart,
  getWeekStart,
  parseDateInput,
} from "../lib/date";

const tabs = [
  { key: "dashboard", label: "ダッシュボード" },
  { key: "menus", label: "週メニュー登録・編集" },
  { key: "orders", label: "注文一覧" },
  { key: "holidays", label: "休業日設定" },
  { key: "system", label: "システム管理" },
];

const DEFAULT_SIZES_ARRAY = [
  { label: "S", desc: "ライス150g 牛めしの具65g相当" },
  { label: "M", desc: "ライス200g 牛めしの具200g相当" },
  { label: "L", desc: "ライス300g 牛めしの具105g相当" },
];
const DEFAULT_OPTIONS_ARRAY = ["つゆだく", "ネギ抜き", "つゆ少なめ", "ネギ多め"];

const emptyMenuForm = {
  reference_date: "",
  item_1: "",
  item_1_image: "",
  item_1_size1_label: "",
  item_1_size1_desc: "",
  item_1_size2_label: "",
  item_1_size2_desc: "",
  item_1_size3_label: "",
  item_1_size3_desc: "",
  item_1_opt1: "",
  item_1_opt2: "",
  item_1_opt3: "",
  item_1_opt4: "",
  item_2: "",
  item_2_image: "",
  item_2_size1_label: "",
  item_2_size1_desc: "",
  item_2_size2_label: "",
  item_2_size2_desc: "",
  item_2_size3_label: "",
  item_2_size3_desc: "",
  item_2_opt1: "",
  item_2_opt2: "",
  item_2_opt3: "",
  item_2_opt4: "",
  item_3: "",
  item_3_image: "",
  item_3_size1_label: "",
  item_3_size1_desc: "",
  item_3_size2_label: "",
  item_3_size2_desc: "",
  item_3_size3_label: "",
  item_3_size3_desc: "",
  item_3_opt1: "",
  item_3_opt2: "",
  item_3_opt3: "",
  item_3_opt4: "",
  item_4: "",
  item_4_image: "",
  item_4_size1_label: "",
  item_4_size1_desc: "",
  item_4_size2_label: "",
  item_4_size2_desc: "",
  item_4_size3_label: "",
  item_4_size3_desc: "",
  item_4_opt1: "",
  item_4_opt2: "",
  item_4_opt3: "",
  item_4_opt4: "",
};

const emptyImageDrafts = {
  item_1_image_file: null,
  item_1_image_preview: "",
  item_1_image_remove: false,
  item_2_image_file: null,
  item_2_image_preview: "",
  item_2_image_remove: false,
  item_3_image_file: null,
  item_3_image_preview: "",
  item_3_image_remove: false,
  item_4_image_file: null,
  item_4_image_preview: "",
  item_4_image_remove: false,
};

function getWeekLabel(weekStartText) {
  const parsed = parseDateInput(weekStartText);
  if (!parsed) {
    return weekStartText;
  }

  const weekEnd = new Date(parsed);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${formatLongDate(parsed)} - ${formatLongDate(weekEnd)}`;
}

function getImageSrc(value) {
  if (!value) {
    return "";
  }

  if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `/api/menu-image?pathname=${encodeURIComponent(value)}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({ rows: [], alerts: [] });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [weeks, setWeeks] = useState([]);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [holidayForm, setHolidayForm] = useState({ date: "", reason: "" });
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [imageDrafts, setImageDrafts] = useState(emptyImageDrafts);
  const [menuMessage, setMenuMessage] = useState("");
  const [menuError, setMenuError] = useState("");
  const [menuSaving, setMenuSaving] = useState(false);
  const [debugMode, setDebugMode] = useState("off");
  const [debugSystemDate, setDebugSystemDate] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadOrders();
    loadWeeks();
    loadHolidays();
    loadSettings();
  }, []);

  async function loadDashboard() {
    setDashboardLoading(true);
    try {
      const response = await fetch("/api/admin/dashboard?days=10");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ダッシュボードの取得に失敗しました。");
      }
      setDashboard(data);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const response = await fetch("/api/admin/orders?view=all");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "注文一覧の取得に失敗しました。");
      }
      setOrders(data.orders);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadWeeks() {
    setWeeksLoading(true);
    try {
      const response = await fetch("/api/admin/menu");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "週メニューの取得に失敗しました。");
      }
      setWeeks(data.weeks);
    } finally {
      setWeeksLoading(false);
    }
  }

  async function loadHolidays() {
    setHolidaysLoading(true);
    try {
      const response = await fetch("/api/admin/holidays");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "休業日の取得に失敗しました。");
      }
      setHolidays(data.holidays.map((h) => h.date));
    } finally {
      setHolidaysLoading(false);
    }
  }

  async function loadSettings() {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (response.ok) {
        setDebugMode(data.debug_mode || "off");
        setDebugSystemDate(data.debug_system_date || "");
      }
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleDebugModeToggle() {
    const nextValue = debugMode === "on" ? "off" : "on";
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debug_mode: nextValue }),
      });
      if (response.ok) {
        setDebugMode(nextValue);
      }
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleDebugSystemDateChange(date) {
    setSettingsLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debug_system_date: date }),
      });
      if (response.ok) {
        setDebugSystemDate(date);
      }
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleHolidayToggle(dateStr, currentlyIsHoliday) {
    setHolidaysLoading(true);
    try {
      const endpoint = currentlyIsHoliday ? "/api/admin/holidays/delete" : "/api/admin/holidays";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, reason: "" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました。");
      }

      await loadHolidays();
    } catch (error) {
      alert(error.message);
    } finally {
      setHolidaysLoading(false);
    }
  }

  function handleWeekSelect(referenceDate, currentWeeks = weeks) {
    const parsedDate = parseDateInput(referenceDate);
    const weekStart = parsedDate ? formatDateInput(getWeekStart(parsedDate)) : referenceDate;
    const selected = currentWeeks.find((week) => week.week_start_date === weekStart);

    const getInitialData = (index) => {
      const menu = selected?.menu;
      const sizes = menu ? JSON.parse(menu[`item_${index}_sizes`] || "[]") : [];
      const options = menu ? JSON.parse(menu[`item_${index}_options`] || "[]") : [];

      return {
        [`item_${index}`]: menu?.[`item_${index}`] || "",
        [`item_${index}_image`]: menu?.[`item_${index}_image`] || "",
        [`item_${index}_size1_label`]: sizes[0]?.label || "",
        [`item_${index}_size1_desc`]: sizes[0]?.desc || "",
        [`item_${index}_size2_label`]: sizes[1]?.label || "",
        [`item_${index}_size2_desc`]: sizes[1]?.desc || "",
        [`item_${index}_size3_label`]: sizes[2]?.label || "",
        [`item_${index}_size3_desc`]: sizes[2]?.desc || "",
        [`item_${index}_opt1`]: options[0] || "",
        [`item_${index}_opt2`]: options[1] || "",
        [`item_${index}_opt3`]: options[2] || "",
        [`item_${index}_opt4`]: options[3] || "",
      };
    };

    setMenuMessage("");
    setMenuError("");
    setMenuForm({
      reference_date: weekStart,
      ...getInitialData(1),
      ...getInitialData(2),
      ...getInitialData(3),
      ...getInitialData(4),
    });
    setImageDrafts(emptyImageDrafts);
  }

  async function handleMenuSave(event) {
    event.preventDefault();
    setMenuSaving(true);
    setMenuMessage("");
    setMenuError("");

    try {
      const formData = new FormData();
      formData.set("reference_date", menuForm.reference_date);

      [1, 2, 3, 4].forEach((index) => {
        formData.set(`item_${index}`, menuForm[`item_${index}`]);
        formData.set(`item_${index}_image`, menuForm[`item_${index}_image`]);
        formData.set(`item_${index}_image_remove`, String(imageDrafts[`item_${index}_image_remove`]));

        const sizes = [
          { label: menuForm[`item_${index}_size1_label`], desc: menuForm[`item_${index}_size1_desc`] },
          { label: menuForm[`item_${index}_size2_label`], desc: menuForm[`item_${index}_size2_desc`] },
          { label: menuForm[`item_${index}_size3_label`], desc: menuForm[`item_${index}_size3_desc`] },
        ].filter((s) => s.label.trim());

        const opts = [
          menuForm[`item_${index}_opt1`],
          menuForm[`item_${index}_opt2`],
          menuForm[`item_${index}_opt3`],
          menuForm[`item_${index}_opt4`],
        ]
          .map((o) => o.trim())
          .filter((o) => o && o !== "その他");
        
        // Always add "その他" at the end exactly once
        opts.push("その他");

        formData.set(`item_${index}_sizes`, JSON.stringify(sizes));
        formData.set(`item_${index}_options`, JSON.stringify(opts));
      });

      if (imageDrafts.item_1_image_file) {
        formData.set("item_1_image_file", imageDrafts.item_1_image_file);
      }
      if (imageDrafts.item_2_image_file) {
        formData.set("item_2_image_file", imageDrafts.item_2_image_file);
      }
      if (imageDrafts.item_3_image_file) {
        formData.set("item_3_image_file", imageDrafts.item_3_image_file);
      }
      if (imageDrafts.item_4_image_file) {
        formData.set("item_4_image_file", imageDrafts.item_4_image_file);
      }

      const response = await fetch("/api/admin/menu/update", {
        method: "POST",
        body: formData,
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `サーバーエラー (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || "週メニューの保存に失敗しました。");
      }

      setMenuMessage("週メニューを保存しました。");
      
      // UIをリフレッシュするために最新のデータを再取得
      const [newWeeksData] = await Promise.all([
        (async () => {
          const res = await fetch("/api/admin/menu");
          const d = await res.json();
          setWeeks(d.weeks);
          return d.weeks;
        })(),
        loadDashboard(),
      ]);

      // 保存した週のデータをフォームに再反映（画像パスなどを最新にするため）
      handleWeekSelect(data.menu.week_start_date, newWeeksData);
    } catch (error) {
      setMenuError(error.message);
    } finally {
      setMenuSaving(false);
    }
  }

  function handleImageChange(field, file) {
    const previewField = `${field}_preview`;
    const removeField = `${field}_remove`;
    const fileField = `${field}_file`;

    setImageDrafts((current) => {
      if (current[previewField]) {
        URL.revokeObjectURL(current[previewField]);
      }

      return {
        ...current,
        [fileField]: file || null,
        [previewField]: file ? URL.createObjectURL(file) : "",
        [removeField]: false,
      };
    });
  }

  function handleImageRemove(field) {
    const previewField = `${field}_preview`;
    const removeField = `${field}_remove`;
    const fileField = `${field}_file`;

    setImageDrafts((current) => {
      if (current[previewField]) {
        URL.revokeObjectURL(current[previewField]);
      }

      return {
        ...current,
        [fileField]: null,
        [previewField]: "",
        [removeField]: true,
      };
    });
  }

  const currentWeekStart = formatDateInput(getCurrentWeekStart());
  const nextWeekStart = formatDateInput(getNextWeekStart());

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[0_20px_70px_rgba(84,53,31,0.08)] md:p-7">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">お弁当注文管理</h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 rounded-[24px] bg-[color:var(--background)] p-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[18px] px-4 py-3 text-sm font-bold transition ${
                    activeTab === tab.key
                      ? "bg-[color:var(--accent)] text-white"
                      : "text-[color:var(--text-soft)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeTab === "dashboard" ? (
          <section className="space-y-6">
            {dashboard.alerts.map((alert) => (
              <div
                key={alert.week_start_date}
                className="rounded-[24px] border border-[#f0b497] bg-[#fff2e6] px-5 py-4 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                {alert.message}
                <span className="ml-2 text-xs">
                  対象週: {getWeekLabel(alert.week_start_date)}
                </span>
              </div>
            ))}

            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-soft)]">注文状況</p>
                  <p className="mt-1 text-base text-[color:var(--text-soft)]">
                    日付ごと、メニューごとに当日必要なお弁当数を表示します。
                  </p>
                </div>
                {dashboardLoading ? (
                  <p className="text-sm text-[color:var(--text-soft)]">更新中...</p>
                ) : null}
              </div>

              <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-[color:var(--background)] text-left text-[color:var(--text-soft)]">
                      <tr>
                        <th className="px-4 py-3 font-semibold">日付</th>
                        <th className="px-4 py-3 font-semibold">メニュー1</th>
                        <th className="px-4 py-3 font-semibold">メニュー2</th>
                        <th className="px-4 py-3 font-semibold">メニュー3</th>
                        <th className="px-4 py-3 font-semibold">メニュー4</th>
                        <th className="px-4 py-3 font-semibold">CSV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.rows.map((row) => (
                        <tr key={row.delivery_date} className="border-t border-[color:var(--line)] align-top">
                          <td className="px-4 py-4">
                            <p className="font-bold">
                              {parseDateInput(row.delivery_date)
                                ? formatLongDate(parseDateInput(row.delivery_date))
                                : row.delivery_date}
                            </p>
                            <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                              週開始 {row.week_start_date}
                            </p>
                          </td>
                          {row.menu_registered ? (
                            row.items.map((item) => (
                              <td key={`${row.delivery_date}-${item.name}`} className="px-4 py-4">
                                <p className="min-w-32 text-sm font-semibold">{item.name}</p>
                                <p className="mt-2 text-2xl font-black text-[color:var(--accent)]">
                                  {item.count}
                                </p>
                              </td>
                            ))
                          ) : (
                            <td className="px-4 py-4 text-[color:var(--text-soft)]" colSpan={4}>
                              この週のメニューが未登録です。
                            </td>
                          )}
                          <td className="px-4 py-4">
                            <a
                              className="inline-flex rounded-2xl border border-[color:var(--line)] px-3 py-2 font-bold text-[color:var(--text)]"
                              href={`/api/admin/export?date=${row.delivery_date}`}
                            >
                              出力
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "menus" ? (
          <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-soft)]">登録対象週</p>
                  <p className="mt-1 text-base text-[color:var(--text-soft)]">
                    当週と過去週は編集できません。
                  </p>
                </div>
                {weeksLoading ? <p className="text-sm text-[color:var(--text-soft)]">読込中...</p> : null}
              </div>

              <div className="mt-4 space-y-3">
                {weeks.map((week) => {
                  const selectedReferenceDate = parseDateInput(menuForm.reference_date);
                  const active =
                    week.week_start_date ===
                    (selectedReferenceDate
                      ? formatDateInput(getWeekStart(selectedReferenceDate))
                      : menuForm.reference_date);
                  const isNextWeek = week.week_start_date === nextWeekStart;
                  return (
                    <button
                      key={week.week_start_date}
                      type="button"
                      onClick={() => handleWeekSelect(week.week_start_date)}
                      className={`block w-full rounded-[22px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                          : "border-[color:var(--line)] bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">{getWeekLabel(week.week_start_date)}</p>
                          <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                            週開始 {week.week_start_date}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            week.menu
                              ? "bg-[#e8f7ee] text-[color:var(--ok)]"
                              : "bg-[#fff0ec] text-[color:var(--accent-strong)]"
                          }`}
                        >
                          {week.menu ? "登録済み" : "未登録"}
                        </span>
                      </div>
                      {isNextWeek ? (
                        <p className="mt-3 text-xs font-semibold text-[color:var(--accent-strong)]">
                          次週
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-6"
              onSubmit={handleMenuSave}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-soft)]">週メニュー登録</p>
                  <p className="mt-1 text-base text-[color:var(--text-soft)]">
                    選択した未来週に対して4種類のメニューを保存します。
                  </p>
                </div>
                <div className="rounded-2xl bg-[color:var(--background)] px-4 py-3 text-sm font-semibold text-[color:var(--text)]">
                  編集対象:{" "}
                  {getWeekLabel(
                    parseDateInput(menuForm.reference_date)
                      ? formatDateInput(getWeekStart(parseDateInput(menuForm.reference_date)))
                      : menuForm.reference_date,
                  )}
                </div>
              </div>

              <input type="hidden" name="reference_date" value={menuForm.reference_date} />

              <div className="mt-5 grid gap-4">
                {[1, 2, 3, 4].map((index) => {
                  const nameField = `item_${index}`;
                  const imageField = `item_${index}_image`;
                  const imageFileField = `${imageField}_file`;
                  const imagePreviewField = `${imageField}_preview`;
                  const imageRemoveField = `${imageField}_remove`;
                  const previewSrc = imageDrafts[imagePreviewField] || getImageSrc(menuForm[imageField]);
                  return (
                    <div
                      key={nameField}
                      className="grid gap-4 rounded-[24px] border border-[color:var(--line)] bg-white p-4 md:grid-cols-[1fr_220px]"
                    >
                      <div className="space-y-4">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-[color:var(--text-soft)]">
                            Menu {index}
                          </span>
                          <input
                            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
                            value={menuForm[nameField]}
                            onChange={(event) =>
                              setMenuForm((current) => ({
                                ...current,
                                [nameField]: event.target.value,
                              }))
                            }
                            placeholder="メニュー名"
                            required
                          />
                        </label>

                        <div className="space-y-3 rounded-2xl bg-[color:var(--background)] p-4">
                          <p className="text-xs font-bold text-[color:var(--text-soft)] uppercase tracking-wider">
                            サイズ設定 (最大3つ)
                          </p>
                          {[1, 2, 3].map((num) => (
                            <div key={num} className="grid grid-cols-[80px_1fr] gap-2">
                              <input
                                className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-bold"
                                placeholder={`ラベル${num}`}
                                value={menuForm[`item_${index}_size${num}_label`]}
                                onChange={(e) =>
                                  setMenuForm((c) => ({
                                    ...c,
                                    [`item_${index}_size${num}_label`]: e.target.value,
                                  }))
                                }
                              />
                              <input
                                className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm"
                                placeholder={`説明文${num}`}
                                value={menuForm[`item_${index}_size${num}_desc`]}
                                onChange={(e) =>
                                  setMenuForm((c) => ({
                                    ...c,
                                    [`item_${index}_size${num}_desc`]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3 rounded-2xl bg-[color:var(--background)] p-4">
                          <p className="text-xs font-bold text-[color:var(--text-soft)] uppercase tracking-wider">
                            オプション設定 (最大4つ)
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map((num) => (
                              <input
                                key={num}
                                className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm"
                                placeholder={`オプション${num}`}
                                value={menuForm[`item_${index}_opt${num}`]}
                                onChange={(e) =>
                                  setMenuForm((c) => ({
                                    ...c,
                                    [`item_${index}_opt${num}`]: e.target.value,
                                  }))
                                }
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-[color:var(--text-soft)]">
                            ※「その他」は自動的に追加されます。不要な項目は空欄にしてください。
                          </p>
                        </div>

                        <div className="flex justify-start">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuForm((current) => ({
                                ...current,
                                [`item_${index}_size1_label`]: DEFAULT_SIZES_ARRAY[0].label,
                                [`item_${index}_size1_desc`]: DEFAULT_SIZES_ARRAY[0].desc,
                                [`item_${index}_size2_label`]: DEFAULT_SIZES_ARRAY[1].label,
                                [`item_${index}_size2_desc`]: DEFAULT_SIZES_ARRAY[1].desc,
                                [`item_${index}_size3_label`]: DEFAULT_SIZES_ARRAY[2].label,
                                [`item_${index}_size3_desc`]: DEFAULT_SIZES_ARRAY[2].desc,
                                [`item_${index}_opt1`]: DEFAULT_OPTIONS_ARRAY[0],
                                [`item_${index}_opt2`]: DEFAULT_OPTIONS_ARRAY[1],
                                [`item_${index}_opt3`]: DEFAULT_OPTIONS_ARRAY[2],
                                [`item_${index}_opt4`]: DEFAULT_OPTIONS_ARRAY[3],
                              }));
                            }}
                            className="text-[10px] font-bold text-[color:var(--accent)] underline opacity-80 hover:opacity-100 transition-opacity"
                          >
                            デフォルト（牛めし用）を適用
                          </button>
                        </div>

                        <label className="block space-y-2 pt-2 border-t border-[color:var(--line)]">
                          <span className="text-sm font-semibold text-[color:var(--text-soft)]">写真画像</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 file:mr-3 file:rounded-xl file:border-0 file:bg-[color:var(--accent-soft)] file:px-3 file:py-2 file:font-semibold"
                            onChange={(event) =>
                              handleImageChange(imageField, event.target.files?.[0] || null)
                            }
                          />
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-soft)]">
                            {imageDrafts[imageFileField] ? (
                              <span>{imageDrafts[imageFileField].name}</span>
                            ) : menuForm[imageField] && !imageDrafts[imageRemoveField] ? (
                              <span>登録済み画像を使用中</span>
                            ) : (
                              <span>画像なしでも保存できます</span>
                            )}
                            {(menuForm[imageField] || imageDrafts[imagePreviewField]) &&
                            !imageDrafts[imageRemoveField] ? (
                              <button
                                type="button"
                                onClick={() => handleImageRemove(imageField)}
                                className="rounded-full border border-[color:var(--line)] px-3 py-1 font-semibold text-[color:var(--accent-strong)]"
                              >
                                画像を削除
                              </button>
                            ) : null}
                          </div>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <span className="block text-sm font-semibold text-[color:var(--text-soft)]">
                          プレビュー
                        </span>
                        {previewSrc && !imageDrafts[imageRemoveField] ? (
                          <img
                            alt={menuForm[nameField] || `Menu ${index}`}
                            className="aspect-[4/3] w-full rounded-[20px] object-cover"
                            src={previewSrc}
                          />
                        ) : (
                          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[20px] bg-[color:var(--background)] text-sm font-semibold text-[color:var(--text-soft)]">
                            写真なし
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[24px] bg-[color:var(--background)] p-4 text-sm leading-6 text-[color:var(--text-soft)]">
                現在の週開始日は {currentWeekStart} です。この週以前のメニューは API 側でも保存できません。
              </div>

              <button
                type="submit"
                disabled={menuSaving}
                className="mt-5 w-full rounded-2xl bg-[color:var(--accent)] px-4 py-4 text-base font-black text-white disabled:opacity-50"
              >
                {menuSaving ? "保存中..." : "週メニューを保存"}
              </button>

              {menuError ? (
                <p className="mt-4 rounded-2xl bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]">
                  {menuError}
                </p>
              ) : null}
              {menuMessage ? (
                <p className="mt-4 rounded-2xl bg-[#e8f7ee] px-4 py-3 text-sm font-semibold text-[color:var(--ok)]">
                  {menuMessage}
                </p>
              ) : null}
            </form>
          </section>
        ) : null}

        {activeTab === "orders" ? (
          <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text-soft)]">全注文一覧</p>
                <p className="mt-1 text-base text-[color:var(--text-soft)]">
                  すべての注文を注文時刻の降順で表示します。
                </p>
              </div>
              {ordersLoading ? <p className="text-sm text-[color:var(--text-soft)]">更新中...</p> : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--line)] bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[color:var(--background)] text-left text-[color:var(--text-soft)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">注文時刻</th>
                      <th className="px-4 py-3 font-semibold">受取日</th>
                      <th className="px-4 py-3 font-semibold">学年</th>
                      <th className="px-4 py-3 font-semibold">組</th>
                      <th className="px-4 py-3 font-semibold">氏名</th>
                      <th className="px-4 py-3 font-semibold">メールアドレス</th>
                      <th className="px-4 py-3 font-semibold">券番</th>
                      <th className="px-4 py-3 font-semibold">メニュー</th>
                      <th className="px-4 py-3 font-semibold">サイズ</th>
                      <th className="px-4 py-3 font-semibold">オプション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map((order) => {
                        const options = order.options ? JSON.parse(order.options) : [];
                        return (
                          <tr key={order.id} className="border-t border-[color:var(--line)]">
                            <td className="px-4 py-3 font-semibold">{formatDateTime(order.created_at)}</td>
                            <td className="px-4 py-3">{order.delivery_date}</td>
                            <td className="px-4 py-3">{order.grade}</td>
                            <td className="px-4 py-3">{order.class_name}</td>
                            <td className="px-4 py-3">{order.full_name}</td>
                            <td className="px-4 py-3 text-xs">{order.email}</td>
                            <td className="px-4 py-3 font-bold">{order.ticket_number}</td>
                            <td className="px-4 py-3">{order.selected_menu_item}</td>
                            <td className="px-4 py-3 font-bold">{order.size}</td>
                            <td className="px-4 py-3 text-xs">
                              {options.join(", ")}
                              {order.other_option_text ? ` (${order.other_option_text})` : ""}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-center text-[color:var(--text-soft)]" colSpan={10}>
                          注文はまだありません。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "holidays" ? (
          <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text-soft)]">休業日設定</p>
                <p className="mt-1 text-base text-[color:var(--text-soft)]">
                  カレンダーの日付をクリックして、予約の受付（白）と停止（赤）を切り替えます。
                </p>
              </div>
              {holidaysLoading ? (
                <p className="text-sm text-[color:var(--text-soft)]">更新中...</p>
              ) : null}
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {[0, 1].map((monthOffset) => {
                const now = getNow();
                const calendarMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const monthName = `${year}年 ${month + 1}月`;
                
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                const days = [];
                // Padding for first week
                const padding = firstDay === 0 ? 6 : firstDay - 1; // Start from Monday
                for (let i = 0; i < padding; i++) days.push(null);
                for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

                return (
                  <div key={monthOffset} className="space-y-4">
                    <h3 className="text-center font-bold text-lg">{monthName}</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {["月", "火", "水", "木", "金", "土", "日"].map((d) => (
                        <div key={d} className="py-2 text-center text-xs font-bold text-[color:var(--text-soft)]">
                          {d}
                        </div>
                      ))}
                      {days.map((date, i) => {
                        if (!date) return <div key={`pad-${i}`} />;
                        
                        const dateStr = formatDateInput(date);
                        const isHoliday = holidays.includes(dateStr);
                        
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => {
                              if (isHoliday) {
                                handleHolidayToggle(dateStr, true);
                              } else {
                                // Direct add without form
                                (async () => {
                                  setHolidaySaving(true);
                                  try {
                                    const response = await fetch("/api/admin/holidays", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ date: dateStr, reason: "" }),
                                    });
                                    if (response.ok) await loadHolidays();
                                  } finally {
                                    setHolidaySaving(false);
                                  }
                                })();
                              }
                            }}
                            className={`aspect-square rounded-xl text-sm font-bold transition flex flex-col items-center justify-center ${
                              isHoliday
                                ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-2 border-[color:var(--accent)]"
                                : "bg-white border border-[color:var(--line)] text-[color:var(--text)] hover:border-[color:var(--accent)]"
                            }`}
                          >
                            <span>{date.getDate()}</span>
                            {isHoliday && <span className="text-[8px] mt-0.5">休業</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-[color:var(--text-soft)]">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border border-[color:var(--line)] bg-white" />
                <span>営業日</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-md border-2 border-[color:var(--accent)] bg-[color:var(--accent-soft)]" />
                <span>休業日（予約不可）</span>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "system" ? (
          <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text-soft)]">システム管理</p>
                <p className="mt-1 text-base text-[color:var(--text-soft)]">
                  システムの動作モードや詳細設定を変更します。
                </p>
              </div>
              {settingsLoading ? (
                <p className="text-sm text-[color:var(--text-soft)]">更新中...</p>
              ) : null}
            </div>

            <div className="mt-8 space-y-6">
              <div className="space-y-4 rounded-[24px] border border-[color:var(--line)] bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[color:var(--text)]">デバッグモード</h3>
                    <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                      ONにすると、フロント画面で未来の週も予約可能になり、システム日付を自由に変更できます。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDebugModeToggle}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 outline-none ${
                      debugMode === "on" ? "bg-[color:var(--ok)]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                        debugMode === "on" ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {debugMode === "on" && (
                  <div className="mt-6 border-t border-[color:var(--line)] pt-6 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="font-bold text-[color:var(--text)]">システム日付の上書き</h4>
                        <p className="text-xs text-[color:var(--text-soft)]">
                          「今日」を任意の日付に設定して、週の自動切り替えや締め切りロジックを検証できます。
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
                          value={debugSystemDate}
                          onChange={(e) => handleDebugSystemDateChange(e.target.value)}
                        />
                        {debugSystemDate && (
                          <button
                            type="button"
                            onClick={() => handleDebugSystemDateChange("")}
                            className="text-xs font-bold text-[color:var(--accent)] underline"
                          >
                            解除
                          </button>
                        )}
                      </div>
                    </div>
                    {debugSystemDate && (
                      <div className="rounded-xl bg-[color:var(--background)] px-4 py-3 text-xs font-semibold text-[color:var(--accent-strong)]">
                        現在、システムは <strong>{debugSystemDate}</strong> として動作しています。
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
