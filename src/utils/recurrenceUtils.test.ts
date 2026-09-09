import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    buildCustomFrequency,
    parseCustomFrequencyDays,
    isCustomFrequency,
    formatCustomFrequencyLabel,
    getUpcomingOccurrences
} from "./recurrenceUtils";

const WEEK_DAYS_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

// Local-date (not UTC) "YYYY-MM-DD" key — toISOString() would shift dates
// across midnight in any timezone ahead of UTC (this suite runs under
// Europe/Madrid, UTC+1 in January), which would silently misdate every
// assertion below by a day.
const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("buildCustomFrequency", () => {
    it("sorts and dedupes the given days into the restricted cron shape", () => {
        expect(buildCustomFrequency([4, 1, 1])).toBe("0 0 0 * * 1,4");
    });
});

describe("parseCustomFrequencyDays", () => {
    it("extracts the days from a custom frequency string", () => {
        expect(parseCustomFrequencyDays("0 0 0 * * 1,4")).toEqual([1, 4]);
    });

    it("returns null for a preset frequency", () => {
        expect(parseCustomFrequencyDays("DAILY")).toBeNull();
    });

    it("returns null for an unrelated string", () => {
        expect(parseCustomFrequencyDays("not a frequency")).toBeNull();
    });
});

describe("isCustomFrequency", () => {
    it("is true for a custom day-of-week string", () => {
        expect(isCustomFrequency("0 0 0 * * 1,4")).toBe(true);
    });

    it("is false for a preset", () => {
        expect(isCustomFrequency("WEEKLY")).toBe(false);
    });
});

describe("formatCustomFrequencyLabel", () => {
    it("formats selected days in Monday-first order regardless of storage order", () => {
        // Stored as "0,1" (Sunday, Monday per Sunday-first cron numbering) —
        // display should still read Monday before Sunday.
        expect(formatCustomFrequencyLabel("0 0 0 * * 0,1", WEEK_DAYS_SHORT)).toBe("Lu, Do");
    });

    it("returns null for a preset frequency", () => {
        expect(formatCustomFrequencyLabel("MONTHLY", WEEK_DAYS_SHORT)).toBeNull();
    });
});

describe("getUpcomingOccurrences", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // 2026-01-01 is a Thursday.
        vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("previews DAILY occurrences one day apart, starting tomorrow", () => {
        const dates = getUpcomingOccurrences("DAILY", 3);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-03", "2026-01-04"]);
    });

    it("previews WEEKLY occurrences, first one still tomorrow", () => {
        const dates = getUpcomingOccurrences("WEEKLY", 2);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-09"]);
    });

    it("previews MONTHLY occurrences", () => {
        const dates = getUpcomingOccurrences("MONTHLY", 2);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-02-02"]);
    });

    it("previews a custom Mon/Thu pattern — first occurrence is still just 'tomorrow', later ones follow the pattern", () => {
        // Tomorrow (2026-01-02) is a Friday, not one of the selected days —
        // matches RecurringTaskSchedulerService's own behavior: the very
        // first-ever occurrence ignores the pattern entirely.
        const dates = getUpcomingOccurrences("0 0 0 * * 1,4", 3);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-05", "2026-01-08"]);
    });

    it("stops early once a projected date would fall after endDate", () => {
        const dates = getUpcomingOccurrences("0 0 0 * * 1,4", 5, "2026-01-06");
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-05"]);
    });
});
