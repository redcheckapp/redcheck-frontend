import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    buildCustomFrequency,
    parseCustomFrequencyDays,
    isCustomFrequency,
    formatCustomFrequencyLabel,
    buildMonthlyDayFrequency,
    parseMonthlyDayFrequency,
    isMonthlyDayFrequency,
    formatFrequencyLabel,
    parseFrequencyForEditing,
    resolveFrequency,
    isRecurrenceStateValid,
    DEFAULT_RECURRENCE_STATE,
    getUpcomingOccurrences,
    type FrequencyLabels
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

describe("buildMonthlyDayFrequency / parseMonthlyDayFrequency / isMonthlyDayFrequency", () => {
    it("round-trips a specific day", () => {
        expect(buildMonthlyDayFrequency(15)).toBe("MONTHLY:15");
        expect(parseMonthlyDayFrequency("MONTHLY:15")).toBe(15);
    });

    it("round-trips LAST", () => {
        expect(buildMonthlyDayFrequency("LAST")).toBe("MONTHLY:LAST");
        expect(parseMonthlyDayFrequency("MONTHLY:LAST")).toBe("LAST");
    });

    it("returns null for unrelated strings", () => {
        expect(parseMonthlyDayFrequency("DAILY")).toBeNull();
        expect(parseMonthlyDayFrequency("0 0 0 * * 1,4")).toBeNull();
    });

    it("isMonthlyDayFrequency mirrors parseMonthlyDayFrequency", () => {
        expect(isMonthlyDayFrequency("MONTHLY:1")).toBe(true);
        expect(isMonthlyDayFrequency("MONTHLY")).toBe(false);
    });
});

describe("formatFrequencyLabel", () => {
    const labels: FrequencyLabels = {
        freqDaily: "Diaria", freqWeekly: "Semanal", freqBiweekly: "Quincenal", freqMonthly: "Mensual",
        weekDaysShort: WEEK_DAYS_SHORT,
        monthlyDayPrefix: "Día",
        lastDay: "Último día"
    };

    it("formats a preset", () => {
        expect(formatFrequencyLabel("WEEKLY", labels)).toBe("Semanal");
    });

    it("formats a custom weekly pattern", () => {
        expect(formatFrequencyLabel("0 0 0 * * 1,4", labels)).toBe("Lu, Ju");
    });

    it("formats a custom monthly day", () => {
        expect(formatFrequencyLabel("MONTHLY:15", labels)).toBe("Día 15");
    });

    it("formats the last-day-of-month sentinel", () => {
        expect(formatFrequencyLabel("MONTHLY:LAST", labels)).toBe("Último día");
    });
});

describe("parseFrequencyForEditing / resolveFrequency round-trip", () => {
    it("round-trips a preset", () => {
        const parsed = parseFrequencyForEditing("WEEKLY");
        expect(parsed.recurrence).toBe("WEEKLY");
        expect(resolveFrequency(parsed.recurrence, parsed.customMode, parsed.customDays, parsed.monthDay)).toBe("WEEKLY");
    });

    it("round-trips a custom weekly pattern", () => {
        const parsed = parseFrequencyForEditing("0 0 0 * * 1,4");
        expect(parsed).toEqual({ recurrence: "CUSTOM", customMode: "WEEKLY", customDays: [1, 4], monthDay: 1 });
        expect(resolveFrequency(parsed.recurrence, parsed.customMode, parsed.customDays, parsed.monthDay)).toBe("0 0 0 * * 1,4");
    });

    it("round-trips a custom monthly day", () => {
        const parsed = parseFrequencyForEditing("MONTHLY:15");
        expect(parsed).toEqual({ recurrence: "CUSTOM", customMode: "MONTHLY", customDays: [], monthDay: 15 });
        expect(resolveFrequency(parsed.recurrence, parsed.customMode, parsed.customDays, parsed.monthDay)).toBe("MONTHLY:15");
    });

    it("round-trips the last-day-of-month sentinel", () => {
        const parsed = parseFrequencyForEditing("MONTHLY:LAST");
        expect(parsed.monthDay).toBe("LAST");
        expect(resolveFrequency(parsed.recurrence, parsed.customMode, parsed.customDays, parsed.monthDay)).toBe("MONTHLY:LAST");
    });
});

describe("isRecurrenceStateValid", () => {
    it("is invalid for Custom + Weekly with no days selected", () => {
        expect(isRecurrenceStateValid({ ...DEFAULT_RECURRENCE_STATE, recurrence: "CUSTOM", customMode: "WEEKLY", customDays: [] })).toBe(false);
    });

    it("is valid for Custom + Weekly once a day is selected", () => {
        expect(isRecurrenceStateValid({ ...DEFAULT_RECURRENCE_STATE, recurrence: "CUSTOM", customMode: "WEEKLY", customDays: [1] })).toBe(true);
    });

    it("is always valid for Custom + Monthly (a day is always implicitly selected)", () => {
        expect(isRecurrenceStateValid({ ...DEFAULT_RECURRENCE_STATE, recurrence: "CUSTOM", customMode: "MONTHLY", customDays: [] })).toBe(true);
    });

    it("is valid for every preset and NONE", () => {
        expect(isRecurrenceStateValid({ ...DEFAULT_RECURRENCE_STATE, recurrence: "NONE" })).toBe(true);
        expect(isRecurrenceStateValid({ ...DEFAULT_RECURRENCE_STATE, recurrence: "DAILY" })).toBe(true);
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

    it("previews a monthly-day-15 pattern", () => {
        const dates = getUpcomingOccurrences("MONTHLY:15", 3);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-15", "2026-02-15"]);
    });

    it("previews a monthly-day-31 pattern, clamping to February's real last day", () => {
        const dates = getUpcomingOccurrences("MONTHLY:31", 3);
        // 2026 is not a leap year — February has 28 days.
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-31", "2026-02-28"]);
    });

    it("previews a monthly-LAST pattern", () => {
        const dates = getUpcomingOccurrences("MONTHLY:LAST", 3);
        expect(dates.map(toDateKey)).toEqual(["2026-01-02", "2026-01-31", "2026-02-28"]);
    });
});
