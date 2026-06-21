"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { OpeningHours } from "@/types/venue";

/** A group of days sharing one open–close interval. */
export type HoursWindow = { days: number[]; start: string; end: string };

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun (0=Sun..6=Sat)
const DAY_LETTER: Record<number, string> = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };

const minToTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Collapse OpeningHours periods into day-grouped editor rows. */
export function periodsToWindows(oh?: OpeningHours | null): HoursWindow[] {
  if (!oh?.periods?.length) return [];
  const groups: Record<string, HoursWindow> = {};
  for (const p of oh.periods) {
    const key = `${p.openMin}_${p.closeMin}`;
    (groups[key] ||= { days: [], start: minToTime(p.openMin), end: minToTime(p.closeMin) }).days.push(p.openDay);
  }
  return Object.values(groups);
}

/** Expand editor rows back into OpeningHours periods (one per day). */
export function windowsToOpeningHours(windows: HoursWindow[]): OpeningHours | null {
  const periods = [];
  for (const w of windows) {
    if (!w.days.length || !w.start || !w.end) continue;
    const openMin = timeToMin(w.start);
    const closeMin = timeToMin(w.end);
    for (const d of w.days) {
      periods.push({ openDay: d, openMin, closeDay: closeMin <= openMin ? (d + 1) % 7 : d, closeMin });
    }
  }
  return periods.length ? { periods } : null;
}

type Props = {
  /** Initial value (seeds the editor once). */
  initial?: OpeningHours | null;
  /** Called with rebuilt OpeningHours only after the user edits. */
  onChange: (oh: OpeningHours | null) => void;
  addLabel?: string;
  emptyLabel?: string;
  defaultStart?: string;
  defaultEnd?: string;
};

/** Day-of-week + time-range editor. Shared by happy-hour windows and
 *  per-location regular hours. Only emits onChange after a user edit, so an
 *  untouched value (e.g. Google's weekdayText-backed hours) is left intact. */
export default function HoursEditor({
  initial,
  onChange,
  addLabel = "+ Add window",
  emptyLabel = "No windows yet.",
  defaultStart = "17:00",
  defaultEnd = "19:00",
}: Props) {
  const [windows, setWindows] = useState<HoursWindow[]>(() => periodsToWindows(initial));
  const dirty = useRef(false);

  const commit = (next: HoursWindow[]) => {
    dirty.current = true;
    setWindows(next);
    onChange(windowsToOpeningHours(next));
  };

  const addWindow = () =>
    commit([...windows, { days: [1, 2, 3, 4, 5], start: defaultStart, end: defaultEnd }]);
  const removeWindow = (i: number) => commit(windows.filter((_, j) => j !== i));
  const patchWindow = (i: number, patch: Partial<HoursWindow>) =>
    commit(windows.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const toggleDay = (i: number, d: number) =>
    commit(
      windows.map((x, j) =>
        j === i
          ? { ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d] }
          : x
      )
    );

  return (
    <div>
      <div className="space-y-2">
        {windows.map((w, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 p-2">
            <div className="flex gap-1">
              {DAY_ORDER.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(i, d)}
                  className={cn(
                    "h-7 w-7 rounded text-xs font-semibold transition",
                    w.days.includes(d) ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  {DAY_LETTER[d]}
                </button>
              ))}
            </div>
            <input
              type="time"
              value={w.start}
              onChange={(e) => patchWindow(i, { start: e.target.value })}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="time"
              value={w.end}
              onChange={(e) => patchWindow(i, { end: e.target.value })}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeWindow(i)}
              className="ml-auto text-xs font-medium text-zinc-400 hover:text-rose-600"
            >
              Remove
            </button>
          </div>
        ))}
        {windows.length === 0 && <p className="text-sm text-zinc-400">{emptyLabel}</p>}
      </div>
      <button type="button" onClick={addWindow} className="mt-2 text-sm font-medium text-rose-600 hover:underline">
        {addLabel}
      </button>
    </div>
  );
}
