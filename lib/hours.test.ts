import { describe, expect, it } from "vitest";
import {
  formatTime,
  formatWeekly,
  happyHourStatus,
  isOpenAt,
  isOpenLate,
  openStatus,
} from "@/lib/hours";
import type { OpeningHours } from "@/types/venue";

// Mon 5pm -> Tue 2am (overnight), every night; Fri/Sat to 3am.
const bar: OpeningHours = {
  periods: [
    { openDay: 1, openMin: 1020, closeDay: 2, closeMin: 120 },
    { openDay: 6, openMin: 1200, closeDay: 0, closeMin: 240 }, // Sat 8pm -> Sun 4am
  ],
};
const always: OpeningHours = { periods: [], open24: true };

describe("formatTime", () => {
  it("formats 12h with am/pm", () => {
    expect(formatTime(1020)).toBe("5 PM");
    expect(formatTime(120)).toBe("2 AM");
    expect(formatTime(0)).toBe("12 AM");
    expect(formatTime(750)).toBe("12:30 PM");
  });
});

describe("isOpenAt", () => {
  it("handles overnight intervals", () => {
    expect(isOpenAt(bar, { day: 1, minutes: 1080 })).toBe(true); // Mon 6pm
    expect(isOpenAt(bar, { day: 2, minutes: 60 })).toBe(true); // Tue 1am
    expect(isOpenAt(bar, { day: 2, minutes: 180 })).toBe(false); // Tue 3am
    expect(isOpenAt(bar, { day: 1, minutes: 900 })).toBe(false); // Mon 3pm
  });
  it("handles week-boundary wrap (Sat->Sun)", () => {
    expect(isOpenAt(bar, { day: 0, minutes: 120 })).toBe(true); // Sun 2am
    expect(isOpenAt(bar, { day: 0, minutes: 300 })).toBe(false); // Sun 5am
  });
  it("treats open24 as always open", () => {
    expect(isOpenAt(always, { day: 3, minutes: 200 })).toBe(true);
  });
  it("returns false for missing hours", () => {
    expect(isOpenAt(undefined, { day: 1, minutes: 600 })).toBe(false);
  });
});

describe("isOpenLate", () => {
  it("is true when a period closes after midnight", () => {
    expect(isOpenLate(bar)).toBe(true);
  });
  it("is false for daytime-only hours", () => {
    expect(
      isOpenLate({ periods: [{ openDay: 1, openMin: 540, closeDay: 1, closeMin: 1020 }] })
    ).toBe(false);
  });
});

describe("openStatus", () => {
  it("reports open with closing time", () => {
    const s = openStatus(bar, { day: 1, minutes: 1080 });
    expect(s?.open).toBe(true);
    expect(s?.label).toContain("2 AM");
  });
  it("reports closed with next opening", () => {
    const s = openStatus(bar, { day: 1, minutes: 900 });
    expect(s?.open).toBe(false);
    expect(s?.label).toContain("opens");
  });
});

describe("happyHourStatus", () => {
  const hh: OpeningHours = {
    periods: [1, 2, 3, 4, 5].map((d) => ({
      openDay: d,
      openMin: 1020,
      closeDay: d,
      closeMin: 1140,
    })),
  };
  it("active during the window", () => {
    expect(happyHourStatus(hh, { day: 3, minutes: 1080 })?.active).toBe(true);
  });
  it("shows upcoming start", () => {
    expect(happyHourStatus(hh, { day: 3, minutes: 960 })?.label).toContain("5 PM");
  });
  it("null when not soon", () => {
    expect(happyHourStatus(hh, { day: 3, minutes: 1260 })).toBeNull();
  });
});

describe("formatWeekly", () => {
  it("prefers weekdayText", () => {
    expect(formatWeekly({ periods: [], weekdayText: ["Monday: 5 PM – 2 AM"] })).toEqual([
      "Monday: 5 PM – 2 AM",
    ]);
  });
  it("builds Mon-first rows from periods", () => {
    expect(formatWeekly(bar)[0]).toBe("Monday: 5 PM – 2 AM");
  });
});
