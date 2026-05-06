"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canOrderDateForOrderWindow,
  formatDateInput,
  formatLongDate,
  getOrderWindowWeekStart,
  getWeekDates,
  isWeekendNow,
  parseDateInput,
} from "../lib/date";

const GRADE_OPTIONS = ["小１", "小２", "小３", "小４", "小５", "小６", "中１", "中２", "中３"];
const CLASS_OPTIONS = ["１組", "２組", "３組", "４組", "５組"];

const initialProfile = {
  grade: "",
  class_name: "",
  full_name: "",
  email: "",
};

function MenuPhoto({ item, active }) {
  if (!item.image) {
    return null;
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-[color:var(--background-strong)]">
      <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
      <div
        className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${
          active ? "from-[rgba(78,26,15,0.64)]" : "from-[rgba(36,21,15,0.44)]"
        } to-transparent`}
      />
    </div>
  );
}

export default function OrderForm() {
  const [profile, setProfile] = useState(initialProfile);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState("");
  const [size, setSize] = useState("M");
  const [options, setOptions] = useState([]);
  const [otherOptionText, setOtherOptionText] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderedDates, setOrderedDates] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const [debugMode, setDebugMode] = useState(false);

  const initialWeekStart = useMemo(() => getOrderWindowWeekStart(), []);
  const [displayedWeekStart, setDisplayedWeekStart] = useState(initialWeekStart);

  const weekendAccess = useMemo(() => isWeekendNow(), []);
  const currentWeekDates = useMemo(() => getWeekDates(displayedWeekStart), [displayedWeekStart]);
  const selectableDates = useMemo(
    () => {
      return currentWeekDates.filter(d => canOrderDateForOrderWindow(d, undefined, holidays, debugMode).valid);
    },
    [currentWeekDates, holidays, debugMode],
  );
  const defaultDate = selectableDates[0] ? formatDateInput(selectableDates[0]) : "";

  const [deliveryDate, setDeliveryDate] = useState(defaultDate);

  useEffect(() => {
    if (selectableDates.length > 0) {
      const currentIsValid = selectableDates.some((d) => formatDateInput(d) === deliveryDate);
      if (!deliveryDate || !currentIsValid) {
        setDeliveryDate(formatDateInput(selectableDates[0]));
      }
    } else {
      setDeliveryDate("");
    }
  }, [selectableDates]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        setDebugMode(data.debugMode);
      } catch {}
    }
    loadSettings();

    async function loadHolidays() {
      try {
        const response = await fetch("/api/holidays");
        const data = await response.json();
        if (response.ok) {
          setHolidays(data.holidays.map((h) => h.date));
        }
      } catch {}
    }
    loadHolidays();

    const stored = window.localStorage.getItem("obento-profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {}
    }

    const ordered = window.localStorage.getItem("obento-ordered-dates");
    if (ordered) {
      try {
        setOrderedDates(JSON.parse(ordered));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!deliveryDate || orderedDates.includes(deliveryDate)) {
      setMenuItems([]);
      setSelectedMenuItem("");
      return;
    }

    async function loadMenu() {
      setLoadingMenu(true);
      setError("");
      setMessage("");

      try {
        const response = await fetch(`/api/menu?date=${deliveryDate}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "メニュー取得に失敗しました。");
        }

        setMenuItems(data.menu.items);
        setSelectedMenuItem((current) =>
          data.menu.items.some((item) => item.name === current)
            ? current
            : data.menu.items[0]?.name || "",
        );
      } catch (fetchError) {
        setMenuItems([]);
        setSelectedMenuItem("");
        setError(fetchError.message);
      } finally {
        setLoadingMenu(false);
      }
    }

    loadMenu();
  }, [deliveryDate, orderedDates]);

  function handleDateChange(nextValue) {
    const parsed = parseDateInput(nextValue);
    if (!parsed) {
      setDeliveryDate(nextValue);
      return;
    }

    const validation = canOrderDateForOrderWindow(parsed, undefined, holidays, debugMode);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setError("");
    setDeliveryDate(nextValue);
  }

  function handlePrevWeek() {
    const next = new Date(displayedWeekStart);
    next.setDate(next.getDate() - 7);
    setDisplayedWeekStart(next);
  }

  function handleNextWeek() {
    const next = new Date(displayedWeekStart);
    next.setDate(next.getDate() + 7);
    setDisplayedWeekStart(next);
  }

  function getNextAvailableDate(nextOrderedDates) {
    const available = selectableDates.find((date) => {
      const value = formatDateInput(date);
      return !nextOrderedDates.includes(value);
    });

    return available ? formatDateInput(available) : "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          delivery_date: deliveryDate,
          ticket_number: ticketNumber,
          selected_menu_item: selectedMenuItem,
          size,
          options,
          other_option_text: otherOptionText,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "注文に失敗しました。");
      }

      window.localStorage.setItem("obento-profile", JSON.stringify(profile));
      const nextOrderedDates = [...new Set([...orderedDates, deliveryDate])];
      window.localStorage.setItem("obento-ordered-dates", JSON.stringify(nextOrderedDates));
      setOrderedDates(nextOrderedDates);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setTicketNumber("");
      setOptions([]);
      setOtherOptionText("");
      setDeliveryDate(getNextAvailableDate(nextOrderedDates));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[0_20px_70px_rgba(84,53,31,0.1)] backdrop-blur">
          <div className="border-b border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(185,76,47,0.98),rgba(233,150,88,0.96))] px-5 py-6 text-white md:px-8">
            <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">
              お弁当予約システム
            </h1>
          </div>

          <form className="space-y-6 px-4 py-5 md:px-8 md:py-7" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-[160px_160px_1fr_1fr]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--text-soft)]">学年</span>
                <select
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  value={profile.grade}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, grade: event.target.value }))
                  }
                  required
                >
                  <option value="">選択してください</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--text-soft)]">組</span>
                <select
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  value={profile.class_name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, class_name: event.target.value }))
                  }
                  required
                >
                  <option value="">選択してください</option>
                  {CLASS_OPTIONS.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--text-soft)]">氏名</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  value={profile.full_name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, full_name: event.target.value }))
                  }
                  placeholder="例: 山田 花子"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[color:var(--text-soft)]">メールアドレス</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="example@mail.com"
                />
              </label>
            </div>

            <div className="rounded-[24px] bg-[color:var(--background)] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text-soft)]">受取日の指定</p>
                  <div className="mt-1 flex items-center gap-4">
                    {debugMode && (
                      <div className="flex items-center gap-2 rounded-xl bg-white p-1 border border-[color:var(--line)]">
                        <button
                          type="button"
                          onClick={handlePrevWeek}
                          className="p-1 hover:bg-[color:var(--background)] rounded-lg transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-xs font-bold px-1 whitespace-nowrap">週切替</span>
                        <button
                          type="button"
                          onClick={handleNextWeek}
                          className="p-1 hover:bg-[color:var(--background)] rounded-lg transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {deliveryDate && debugMode ? (
                  <input
                    type="date"
                    className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)]"
                    value={deliveryDate}
                    onChange={(event) => handleDateChange(event.target.value)}
                    required
                  />
                ) : deliveryDate ? (
                  <div className="rounded-2xl bg-[color:var(--background)] px-4 py-2 border border-[color:var(--line)]">
                    <span className="text-sm font-bold text-[color:var(--text-soft)]">{deliveryDate}</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {currentWeekDates.map((date) => {
                  const value = formatDateInput(date);
                  const active = value === deliveryDate;
                  const ordered = orderedDates.includes(value);
                  const selectable = selectableDates.some(
                    (selectableDate) => formatDateInput(selectableDate) === value,
                  );
                  const isHoliday = holidays.includes(value);

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleDateChange(value)}
                      disabled={!selectable || ordered || isHoliday}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                          : ordered
                            ? "border-[color:var(--line)] bg-[#e7efe9] text-[color:var(--ok)]"
                            : isHoliday
                            ? "border-[color:var(--line)] bg-[#f1f1f1] text-[color:var(--text-soft)] cursor-not-allowed"
                            : selectable
                            ? "border-[color:var(--line)] bg-white text-[color:var(--text)]"
                            : "border-[color:var(--line)] bg-[#f1ebe1] text-[color:var(--text-soft)] opacity-60"
                      }`}
                    >
                      <span className="block text-xs opacity-75">{value}</span>
                      <span className="mt-1 block text-sm font-bold">
                        {ordered ? "注文済" : isHoliday ? "休業日" : formatLongDate(date)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectableDates.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]">
                  {weekendAccess ? "次週の注文受付対象日がありません。" : "今週の注文受付は終了しました。"}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[color:var(--text-soft)]">週替わりメニュー</p>
                  {loadingMenu ? <p className="text-sm text-[color:var(--text-soft)]">読み込み中...</p> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {menuItems.map((item, index) => {
                    const active = item.name === selectedMenuItem;
                    return (
                      <label
                        key={item.name}
                        className={`block cursor-pointer rounded-[24px] border p-3 transition ${
                          active
                            ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                            : "border-[color:var(--line)] bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_menu_item"
                          className="sr-only"
                          checked={active}
                          onChange={() => {
                            setSelectedMenuItem(item.name);
                            // Reset size and options when menu item changes
                            if (item.sizes?.[0]) {
                              setSize(item.sizes[0].label);
                            } else {
                              setSize("M");
                            }
                            setOptions([]);
                            setOtherOptionText("");
                          }}
                        />
                        <MenuPhoto item={item} active={active} />
                        <div className={`${item.image ? "mt-3" : ""} flex items-start gap-3`}>
                          <span className="mt-0.5 h-5 w-5 rounded-full border-2 border-[color:var(--accent)] bg-white">
                            <span
                              className={`m-[3px] block h-2.5 w-2.5 rounded-full ${
                                active ? "bg-[color:var(--accent)]" : "bg-transparent"
                              }`}
                            />
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-soft)]">
                              Menu {index + 1}
                            </span>
                            <span className="mt-1 block text-base font-bold">{item.name}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-[24px] bg-[color:var(--surface-strong)] p-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--text-soft)]">チケット番号</span>
                  <input
                    className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-xl font-black tracking-[0.18em] outline-none transition focus:border-[color:var(--accent)]"
                    placeholder="B01234"
                    value={ticketNumber}
                    onChange={(event) => {
                      const val = event.target.value
                        .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6);
                      setTicketNumber(val);
                    }}
                    required
                  />
                </label>

                {selectedMenuItem && (
                  <>
                    {menuItems.find((m) => m.name === selectedMenuItem)?.sizes?.length > 0 && (
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-[color:var(--text-soft)]">サイズ</span>
                        <div className="flex flex-col gap-2">
                          {menuItems
                            .find((m) => m.name === selectedMenuItem)
                            .sizes.map((s) => (
                              <button
                                key={s.label}
                                type="button"
                                onClick={() => setSize(s.label)}
                                className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-3 transition ${
                                  size === s.label
                                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                                    : "border-[color:var(--line)] bg-white text-[color:var(--text)]"
                                }`}
                              >
                                <span className="text-lg font-bold">{s.label}</span>
                                <span
                                  className={`text-[10px] font-medium leading-tight ${
                                    size === s.label ? "text-white/90" : "text-[color:var(--text-soft)]"
                                  }`}
                                >
                                  {s.desc}
                                </span>
                              </button>
                            ))}
                        </div>
                      </label>
                    )}

                    {menuItems.find((m) => m.name === selectedMenuItem)?.options?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-semibold text-[color:var(--text-soft)]">
                          オプション（複数選択可）
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {menuItems
                            .find((m) => m.name === selectedMenuItem)
                            ?.options?.filter((opt) => opt !== "その他")
                            .map((opt) => {
                              const active = options.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    if (active) {
                                      setOptions(options.filter((o) => o !== opt));
                                    } else {
                                      setOptions([...options, opt]);
                                    }
                                  }}
                                  className={`rounded-xl border py-2 text-sm font-bold transition ${
                                    active
                                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                                      : "border-[color:var(--line)] bg-white text-[color:var(--text-soft)]"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          
                          {/* Always show "Other" at the end exactly once */}
                          <button
                            type="button"
                            onClick={() => {
                              const active = options.includes("その他");
                              if (active) {
                                setOptions(options.filter((o) => o !== "その他"));
                              } else {
                                setOptions([...options, "その他"]);
                              }
                            }}
                            className={`rounded-xl border py-2 text-sm font-bold transition ${
                              options.includes("その他")
                                ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                                : "border-[color:var(--line)] bg-white text-[color:var(--text-soft)]"
                            }`}
                          >
                            その他
                          </button>
                        </div>
                        {options.includes("その他") && (
                          <input
                            className="w-full rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[color:var(--accent)]"
                            placeholder="その他の内容を入力"
                            value={otherOptionText}
                            onChange={(e) => setOtherOptionText(e.target.value)}
                            required
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="rounded-2xl bg-[color:var(--background)] p-4 text-sm leading-6 text-[color:var(--text-soft)]">
                  受取りはチケットと引き換えになります。
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loadingMenu ||
                    !selectedMenuItem ||
                    !deliveryDate ||
                    orderedDates.includes(deliveryDate)
                  }
                  className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-4 text-base font-black text-white transition enabled:hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "送信中..." : "この内容で予約する"}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-2xl bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-2xl bg-[#e8f7ee] px-4 py-3 text-sm font-semibold text-[color:var(--ok)]">
                {message}
              </p>
            ) : null}
          </form>
        </section>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
          showToast ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full bg-[color:var(--text)] px-6 py-4 text-white shadow-2xl">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--ok)] text-white">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="whitespace-nowrap font-bold">
            お弁当を予約しました。ご利用ありがとうございました。
          </p>
        </div>
      </div>
    </main>
  );
}
