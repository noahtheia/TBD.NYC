import type { OpeningHours } from "@/types/venue";

const WEEK = 7 * 1440;
const DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type NowParts = { day: number; minutes: number };

/** Current time in America/New_York as { day (0=Sun..6=Sat), minutes-from-midnight }. */
export function nycNow(date: Date = new Date()): NowParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = DOW[get("weekday")] ?? 0;
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  return { day, minutes: hour * 60 + minute };
}

/** Format minutes-from-midnight as "5 PM" / "12:30 AM". */
export function formatTime(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return mm ? `${hh}:${String(mm).padStart(2, "0")} ${ap}` : `${hh} ${ap}`;
}

/** Absolute week-minute interval for a period, normalized so close > open. */
function periodAbs(p: OpeningHours["periods"][number]): [number, number] {
  const o = p.openDay * 1440 + p.openMin;
  let c = p.closeDay * 1440 + p.closeMin;
  if (c <= o) c += WEEK;
  return [o, c];
}

export function isOpenAt(hours: OpeningHours | undefined, now: NowParts): boolean {
  if (!hours) return false;
  if (hours.open24) return true;
  const nowAbs = now.day * 1440 + now.minutes;
  for (const p of hours.periods) {
    const [o, c] = periodAbs(p);
    if ((nowAbs >= o && nowAbs < c) || (nowAbs + WEEK >= o && nowAbs + WEEK < c)) {
      return true;
    }
  }
  return false;
}

export function isOpenNow(hours: OpeningHours | undefined, date?: Date): boolean {
  return isOpenAt(hours, nycNow(date));
}

/** True when any period closes after midnight (overnight) — i.e. the venue is open late. */
export function isOpenLate(hours: OpeningHours | undefined): boolean {
  if (!hours) return false;
  if (hours.open24) return true;
  return hours.periods.some((p) => p.closeDay !== p.openDay || p.closeMin < p.openMin);
}

export type OpenState = { open: boolean; label: string };

/** Live open/closed status with the next change ("Open · until 2 AM" / "Closed · opens 5 PM"). */
export function openStatus(
  hours: OpeningHours | undefined,
  now: NowParts = nycNow()
): OpenState | null {
  if (!hours) return null;
  if (hours.open24) return { open: true, label: "Open 24 hours" };
  if (!hours.periods.length) return null;

  const nowAbs = now.day * 1440 + now.minutes;
  const intervals: Array<[number, number]> = [];
  for (const p of hours.periods) {
    const [o, c] = periodAbs(p);
    intervals.push([o, c], [o + WEEK, c + WEEK]);
  }
  intervals.sort((a, b) => a[0] - b[0]);

  for (const [o, c] of intervals) {
    if (nowAbs >= o && nowAbs < c) {
      return { open: true, label: `Open · until ${formatTime(c)}` };
    }
  }
  for (const [o] of intervals) {
    if (o > nowAbs) {
      const sameDay = Math.floor(o / 1440) % 7 === now.day;
      const prefix = sameDay ? "" : `${DAY_NAMES[Math.floor(o / 1440) % 7].slice(0, 3)} `;
      return { open: false, label: `Closed · opens ${prefix}${formatTime(o)}` };
    }
  }
  return { open: false, label: "Closed" };
}

export type HappyHourState = { active: boolean; label: string };

/** Happy-hour status from structured windows ("Happy hour now" / "Happy hour at 5 PM"). */
export function happyHourStatus(
  windows: OpeningHours | undefined,
  now: NowParts = nycNow()
): HappyHourState | null {
  if (!windows || !windows.periods.length) return null;
  if (isOpenAt(windows, now)) return { active: true, label: "Happy hour now" };

  const nowAbs = now.day * 1440 + now.minutes;
  const starts: number[] = [];
  for (const p of windows.periods) {
    const o = p.openDay * 1440 + p.openMin;
    starts.push(o, o + WEEK);
  }
  starts.sort((a, b) => a - b);
  for (const o of starts) {
    if (o > nowAbs && o - nowAbs <= 12 * 60) {
      return { active: false, label: `Happy hour at ${formatTime(o % 1440)}` };
    }
  }
  return null;
}

/** Mon–Sun rows for display. Prefers Google's weekdayText; otherwise builds from periods. */
export function formatWeekly(hours: OpeningHours | undefined): string[] {
  if (!hours) return [];
  if (hours.weekdayText?.length) return hours.weekdayText;
  if (hours.open24) return ["Open 24 hours"];
  if (!hours.periods.length) return [];

  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  return order.map((d) => {
    const segs = hours.periods
      .filter((p) => p.openDay === d)
      .sort((a, b) => a.openMin - b.openMin)
      .map((p) => `${formatTime(p.openMin)} – ${formatTime(p.closeMin)}`);
    return `${DAY_NAMES[d]}: ${segs.length ? segs.join(", ") : "Closed"}`;
  });
}
