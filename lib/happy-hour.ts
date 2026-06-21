import type { OpeningHours, OpeningPeriod } from "@/types/venue";

// Heuristic parser: free-text happy-hour details -> structured windows.
// Days use Google convention (0=Sun..6=Sat). Returns undefined when nothing parses.

const DAY_NUM: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, weds: 3, thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_WORD = "mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";

function expandRange(a: number, b: number): number[] {
  const ia = ORDER.indexOf(a);
  const ib = ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return [];
  return ia <= ib ? ORDER.slice(ia, ib + 1) : [...ORDER.slice(ia), ...ORDER.slice(0, ib + 1)];
}

function parseDays(text: string): number[] {
  const t = text.toLowerCase();
  if (/every\s*day|daily|all week|7\s*days|seven days/.test(t)) return [0, 1, 2, 3, 4, 5, 6];
  const days = new Set<number>();
  if (/weekdays?/.test(t)) [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  if (/weekends?/.test(t)) [6, 0].forEach((d) => days.add(d));

  const rangeRe = new RegExp(`(${DAY_WORD})\\s*(?:-|–|—|to|through|thru)\\s*(${DAY_WORD})`, "gi");
  let m: RegExpExecArray | null;
  let matchedRange = false;
  while ((m = rangeRe.exec(t))) {
    matchedRange = true;
    expandRange(DAY_NUM[m[1]], DAY_NUM[m[2]]).forEach((d) => days.add(d));
  }
  if (!matchedRange) {
    const singleRe = new RegExp(`\\b(${DAY_WORD})\\b`, "gi");
    while ((m = singleRe.exec(t))) {
      const d = DAY_NUM[m[1]];
      if (d !== undefined) days.add(d);
    }
  }
  return [...days];
}

function to24(hour: number, ap?: string): number {
  if (ap === "pm") return hour === 12 ? 12 : hour + 12;
  if (ap === "am") return hour === 12 ? 0 : hour;
  return hour;
}

function parseTimeRange(text: string): { open: number; close: number } | null {
  const m = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|till|til)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
  );
  if (!m) return null;
  const sh = parseInt(m[1], 10);
  const sMin = m[2] ? parseInt(m[2], 10) : 0;
  let sAp = m[3]?.toLowerCase();
  const eh = parseInt(m[4], 10);
  const eMin = m[5] ? parseInt(m[5], 10) : 0;
  let eAp = m[6]?.toLowerCase();
  if (!eAp) eAp = "pm";
  if (!sAp) sAp = sh === 12 ? "pm" : eAp === "pm" ? (sh < eh ? "pm" : "am") : "pm";
  return { open: to24(sh, sAp) * 60 + sMin, close: to24(eh, eAp) * 60 + eMin };
}

export function parseHappyHourWindows(text?: string | null): OpeningHours | undefined {
  if (!text || !text.trim()) return undefined;
  const segments = text.split(/[;,\n]|(?:\s+and\s+)/i).map((s) => s.trim()).filter(Boolean);
  const periods: OpeningPeriod[] = [];
  let carryDays: number[] | null = null;
  for (const seg of segments) {
    let days = parseDays(seg);
    if (!days.length && carryDays) days = carryDays;
    const time = parseTimeRange(seg);
    if (!days.length || !time) continue;
    carryDays = days;
    for (const d of days) {
      const crosses = time.close <= time.open;
      periods.push({
        openDay: d,
        openMin: time.open,
        closeDay: crosses ? (d + 1) % 7 : d,
        closeMin: time.close,
      });
    }
  }
  return periods.length ? { periods } : undefined;
}
