import { describe, expect, it } from "vitest";
import { getBeijingDayPredictionWindow } from "@/lib/beijing-time";

describe("prediction cutoff window", () => {
  it("uses the weekday lottery sales window and cuts prediction generation at 22:00 Beijing time", () => {
    const window = getBeijingDayPredictionWindow(new Date("2026-06-01T04:00:00.000Z"));

    expect(window.cutoffHour).toBe(22);
    expect(window.start.toISOString()).toBe("2026-06-01T03:00:00.000Z");
    expect(window.cutoffAt.toISOString()).toBe("2026-06-01T14:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-06-02T03:00:00.000Z");
  });

  it("uses the weekend lottery sales window and cuts prediction generation at 23:00 Beijing time", () => {
    const saturdayWindow = getBeijingDayPredictionWindow(new Date("2026-06-06T04:00:00.000Z"));
    const sundayWindow = getBeijingDayPredictionWindow(new Date("2026-06-07T04:00:00.000Z"));

    expect(saturdayWindow.cutoffHour).toBe(23);
    expect(saturdayWindow.cutoffAt.toISOString()).toBe("2026-06-06T15:00:00.000Z");
    expect(saturdayWindow.end.toISOString()).toBe("2026-06-07T03:00:00.000Z");
    expect(sundayWindow.cutoffHour).toBe(23);
    expect(sundayWindow.cutoffAt.toISOString()).toBe("2026-06-07T15:00:00.000Z");
    expect(sundayWindow.end.toISOString()).toBe("2026-06-08T03:00:00.000Z");
  });

  it("keeps the previous lottery sales day before 11:00 Beijing time", () => {
    const window = getBeijingDayPredictionWindow(new Date("2026-06-01T18:00:00.000Z"));

    expect(window.start.toISOString()).toBe("2026-06-01T03:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-06-02T03:00:00.000Z");
  });
});
