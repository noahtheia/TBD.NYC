// Heuristic parser: free-text happy-hour details -> structured windows
// (OpeningHours shape; days use Google convention 0=Sun..6=Sat). Returns
// undefined when nothing parses, so the UI can fall back to the raw text.

const DAY_NUM = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, weds: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
const DAY_WORD = "mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";

function expandRange(a, b) {
  const ia = ORDER.indexOf(a);
  const ib = ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return [];
  if (ia <= ib) return ORDER.slice(ia, ib + 1);
  return [...ORDER.slice(ia), ...ORDER.slice(0, ib + 1)];
}

function parseDays(text) {
  const t = text.toLowerCase();
  if (/every\s*day|daily|all week|7\s*days|seven days/.test(t)) return [0, 1, 2, 3, 4, 5, 6];
  const days = new Set();
  if (/weekdays?/.test(t)) [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  if (/weekends?/.test(t)) [6, 0].forEach((d) => days.add(d));

  const rangeRe = new RegExp(`(${DAY_WORD})\\s*(?:-|–|—|to|through|thru)\\s*(${DAY_WORD})`, "gi");
  let m;
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

function to24(hour, ap) {
  if (ap === "pm") return hour === 12 ? 12 : hour + 12;
  if (ap === "am") return hour === 12 ? 0 : hour;
  return hour;
}

function parseTimeRange(text) {
  const re =
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until|till|til)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const m = text.match(re);
  if (!m) return null;
  const sh = parseInt(m[1], 10);
  const sMin = m[2] ? parseInt(m[2], 10) : 0;
  let sAp = m[3]?.toLowerCase();
  const eh = parseInt(m[4], 10);
  const eMin = m[5] ? parseInt(m[5], 10) : 0;
  let eAp = m[6]?.toLowerCase();

  if (!eAp) eAp = "pm"; // happy hour defaults to afternoon/evening
  if (!sAp) {
    if (sh === 12) sAp = "pm";
    else if (eAp === "pm") sAp = sh < eh ? "pm" : "am";
    else sAp = "pm";
  }
  const open = to24(sh, sAp) * 60 + sMin;
  const close = to24(eh, eAp) * 60 + eMin;
  if (Number.isNaN(open) || Number.isNaN(close)) return null;
  return { open, close };
}

export function parseHappyHourWindows(text) {
  if (!text || !text.trim()) return undefined;
  const segments = text.split(/[;,\n]|(?:\s+and\s+)/i).map((s) => s.trim()).filter(Boolean);

  const periods = [];
  let carryDays = null; // allow "Mon-Fri: 5-7, Sat: 12-5" where a seg has only a time
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
  if (!periods.length) return undefined;
  return { periods };
}
