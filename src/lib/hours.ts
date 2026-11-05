import type { Resource, WeekHours } from "./types";

export interface OpenStatus {
  state: "open" | "closed" | "unknown";
  label: string;
  closingSoon: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MINUTES_PER_DAY = 1440;
const CLOSING_SOON_MINUTES = 45;

export function formatTime(minutes: number): string {
  const m = minutes % MINUTES_PER_DAY;
  if (m === 0) return "midnight";
  if (m === 720) return "noon";
  const hour24 = Math.floor(m / 60);
  const minute = m % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${suffix}`;
}

function is24Hours(week: WeekHours): boolean {
  return week.every((day) => day.length === 1 && day[0]?.open === 0 && day[0]?.close === MINUTES_PER_DAY);
}

/** Closing time for a range, following it past midnight when the next day opens at 00:00. */
function effectiveClose(week: WeekHours, dayIndex: number, close: number): number {
  if (close < MINUTES_PER_DAY) return close;
  const nextDay = week[(dayIndex + 1) % 7] ?? [];
  const continuation = nextDay[0];
  return continuation && continuation.open === 0 ? MINUTES_PER_DAY + continuation.close : close;
}

export function openStatus(resource: Resource, now: Date): OpenStatus {
  const week = resource.hours;
  if (!week) return { state: "unknown", label: "Hours not listed", closingSoon: false };
  if (is24Hours(week)) return { state: "open", label: "Open 24 hours", closingSoon: false };

  const today = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  for (const range of week[today] ?? []) {
    if (minutesNow >= range.open && minutesNow < range.close) {
      const close = effectiveClose(week, today, range.close);
      const left = close - minutesNow;
      const closingSoon = left <= CLOSING_SOON_MINUTES;
      return {
        state: "open",
        label: closingSoon ? `Closes in ${left} min` : `Open until ${formatTime(close)}`,
        closingSoon,
      };
    }
  }

  const laterToday = (week[today] ?? []).find((range) => range.open > minutesNow);
  if (laterToday) {
    return { state: "closed", label: `Opens today at ${formatTime(laterToday.open)}`, closingSoon: false };
  }

  for (let offset = 1; offset <= 7; offset++) {
    const dayIndex = (today + offset) % 7;
    const first = week[dayIndex]?.[0];
    if (first) {
      const when = offset === 1 ? "tomorrow" : DAY_NAMES[dayIndex];
      return { state: "closed", label: `Opens ${when} at ${formatTime(first.open)}`, closingSoon: false };
    }
  }

  return { state: "closed", label: "Closed. Call for hours", closingSoon: false };
}

/** Compact weekly hours, grouping days that share the same times: "Mon–Fri 9 AM–5 PM, Sat 9 AM–1 PM". */
export function hoursSummary(resource: Resource): string | null {
  const week = resource.hours;
  if (!week) return null;
  if (is24Hours(week)) return "Open 24 hours, every day";

  const describeDay = (day: WeekHours[number]) =>
    day.map((range) => `${formatTime(range.open)}–${formatTime(range.close)}`).join(", ");

  const groups: { start: number; end: number; times: string }[] = [];
  week.forEach((day, index) => {
    if (day.length === 0) return;
    const times = describeDay(day);
    const last = groups[groups.length - 1];
    if (last && last.end === index - 1 && last.times === times) last.end = index;
    else groups.push({ start: index, end: index, times });
  });

  if (groups.length === 0) return "Closed every day";
  return groups
    .map((g) => {
      const days = g.start === g.end ? DAY_NAMES[g.start] : `${DAY_NAMES[g.start]}–${DAY_NAMES[g.end]}`;
      return `${days} ${g.times}`;
    })
    .join(", ");
}
