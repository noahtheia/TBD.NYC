import { describe, expect, it } from "vitest";
import { parseHappyHourWindows } from "./parse-happy-hour.mjs";

describe("parseHappyHourWindows", () => {
  it("parses day-range + time-range with shared meridiem", () => {
    const w = parseHappyHourWindows("Monday-Friday: 5-8 pm");
    expect(w?.periods).toHaveLength(5);
    expect(w?.periods[0]).toMatchObject({ openDay: 1, openMin: 1020, closeMin: 1200 });
  });

  it("handles noon start (12-5 pm)", () => {
    const w = parseHappyHourWindows("Saturday-Sunday: 12-5 pm");
    const sat = w?.periods.find((p) => p.openDay === 6);
    expect(sat).toMatchObject({ openMin: 720, closeMin: 1020 });
  });

  it("handles everyday", () => {
    const w = parseHappyHourWindows("Everyday 4pm-6pm");
    expect(w?.periods).toHaveLength(7);
  });

  it("splits multiple segments", () => {
    const w = parseHappyHourWindows("Monday-Thursday: 5pm-7pm, Sunday: 3pm-5pm");
    expect(w?.periods).toHaveLength(5);
  });

  it("returns undefined for unparseable text", () => {
    expect(parseHappyHourWindows("ask staff for details")).toBeUndefined();
    expect(parseHappyHourWindows("")).toBeUndefined();
  });
});
