// Custom recurrence is layered on top of the 4 preset frequency strings the
// backend already understood natively (DAILY/WEEKLY/BIWEEKLY/MONTHLY) rather
// than replacing them. Two custom shapes exist, both mirrored exactly on the
// backend (FrequencyUtils) — keep the two in sync if either ever changes:
//
// - Weekly-custom: a restricted 6-field cron expression
//   (`RecurringTaskSchedulerService` only ever ticks once a day at midnight,
//   so seconds/minutes/hours are always pinned to "0 0 0"; only the
//   day-of-week field varies): "0 0 0 * * <days>", `<days>` a sorted,
//   comma-separated list of 0-6 using the same Sunday=0 numbering as JS's
//   `Date#getDay()` (and standard cron), e.g. "0 0 0 * * 1,4" for every
//   Monday and Thursday.
// - Monthly-custom: NOT cron (Spring's CronExpression has no Quartz-style
//   "L"/last-day character, and a plain day-of-month cron field would
//   silently skip short months instead of clamping) — "MONTHLY:<day>",
//   `<day>` 1-31 or the literal "LAST".
const CUSTOM_FREQUENCY_PATTERN = /^0 0 0 \* \* ([0-6](?:,[0-6]){0,6})$/;
const MONTHLY_DAY_PATTERN = /^MONTHLY:(LAST|\d{1,2})$/;

export const PRESET_FREQUENCIES = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

// Monday-first display order (matching AgendaView's own weekDays convention)
// mapped to their Sunday-first cron/JS day index.
export const MONDAY_FIRST_CRON_DAYS = [1, 2, 3, 4, 5, 6, 0];

export const buildCustomFrequency = (days: number[]): string =>
    `0 0 0 * * ${[...new Set(days)].sort((a, b) => a - b).join(",")}`;

// Returns the selected days (Sunday=0 numbering, in whatever order they
// appear in the string — always sorted since buildCustomFrequency sorts
// them) or null if `frequency` isn't a custom day-of-week pattern.
export const parseCustomFrequencyDays = (frequency: string): number[] | null => {
    const match = CUSTOM_FREQUENCY_PATTERN.exec(frequency);
    if (!match) return null;
    return match[1].split(",").map(Number);
};

export const isCustomFrequency = (frequency: string): boolean =>
    parseCustomFrequencyDays(frequency) !== null;

export const buildMonthlyDayFrequency = (day: number | "LAST"): string => `MONTHLY:${day}`;

// Returns the configured day (1-31, or "LAST") or null if `frequency` isn't
// a custom monthly-day pattern.
export const parseMonthlyDayFrequency = (frequency: string): number | "LAST" | null => {
    const match = MONTHLY_DAY_PATTERN.exec(frequency);
    if (!match) return null;
    return match[1] === "LAST" ? "LAST" : Number(match[1]);
};

export const isMonthlyDayFrequency = (frequency: string): boolean =>
    parseMonthlyDayFrequency(frequency) !== null;

// Human-readable label for a custom weekly frequency ("Lun, Jue"), or null
// if it isn't one. `mondayFirstLabels` must be 2-letter abbreviations in the
// same Monday-first order as MONDAY_FIRST_CRON_DAYS.
export const formatCustomFrequencyLabel = (frequency: string, mondayFirstLabels: string[]): string | null => {
    const days = parseCustomFrequencyDays(frequency);
    if (!days) return null;
    return MONDAY_FIRST_CRON_DAYS
        .filter(cronDay => days.includes(cronDay))
        .map(cronDay => mondayFirstLabels[MONDAY_FIRST_CRON_DAYS.indexOf(cronDay)])
        .join(", ");
};

export interface FrequencyLabels {
    freqDaily: string;
    freqWeekly: string;
    freqBiweekly: string;
    freqMonthly: string;
    weekDaysShort: string[]; // Monday-first, 2-letter abbreviations
    monthlyDayPrefix: string; // e.g. "Día" / "Day" — rendered as "<prefix> <day>"
    lastDay: string; // e.g. "Último día" / "Last day"
}

// The single place that turns any stored `frequency` — preset, custom
// weekly, or custom monthly — into its display label. Used by RoutineRow
// (shared between RecurringTasksModal and RoutinesView) so both surfaces
// read a frequency exactly the same way.
export const formatFrequencyLabel = (frequency: string, labels: FrequencyLabels): string => {
    const weeklyCustom = formatCustomFrequencyLabel(frequency, labels.weekDaysShort);
    if (weeklyCustom) return weeklyCustom;

    const monthDay = parseMonthlyDayFrequency(frequency);
    if (monthDay !== null) return monthDay === "LAST" ? labels.lastDay : `${labels.monthlyDayPrefix} ${monthDay}`;

    const presets: Record<string, string> = {
        DAILY: labels.freqDaily, WEEKLY: labels.freqWeekly, BIWEEKLY: labels.freqBiweekly, MONTHLY: labels.freqMonthly
    };
    return presets[frequency] || frequency;
};

export type CustomMode = "WEEKLY" | "MONTHLY";

export interface ParsedFrequency {
    recurrence: string; // "NONE" | one of PRESET_FREQUENCIES | "CUSTOM"
    customMode: CustomMode;
    customDays: number[];
    monthDay: number | "LAST";
}

// Splits a stored `frequency` back into the pieces a recurrence-editing
// form needs (RecurrenceFieldset) — the inverse of resolveFrequency below.
// Defaults (customMode "WEEKLY", monthDay 1) are only ever seen by a form
// the user hasn't touched yet for that sub-mode.
export const parseFrequencyForEditing = (frequency: string): ParsedFrequency => {
    const weekDays = parseCustomFrequencyDays(frequency);
    if (weekDays) {
        return { recurrence: "CUSTOM", customMode: "WEEKLY", customDays: weekDays, monthDay: 1 };
    }

    const monthDay = parseMonthlyDayFrequency(frequency);
    if (monthDay !== null) {
        return { recurrence: "CUSTOM", customMode: "MONTHLY", customDays: [], monthDay };
    }

    return { recurrence: frequency, customMode: "WEEKLY", customDays: [], monthDay: 1 };
};

// The inverse of parseFrequencyForEditing — builds the on-the-wire
// `frequency` string from a recurrence-editing form's current state.
export const resolveFrequency = (recurrence: string, customMode: CustomMode, customDays: number[], monthDay: number | "LAST"): string => {
    if (recurrence !== "CUSTOM") return recurrence;
    return customMode === "MONTHLY" ? buildMonthlyDayFrequency(monthDay) : buildCustomFrequency(customDays);
};

// Full controlled state for RecurrenceFieldset.tsx — ParsedFrequency plus
// the two fields that live outside the frequency string itself (time,
// endDate). Used as create-form state (SubjectSection) and edit-form state
// (RecurringTasksModal, RoutinesView) alike.
export interface RecurrenceState extends ParsedFrequency {
    time: string;
    endDate: string;
}

export const DEFAULT_RECURRENCE_STATE: RecurrenceState = {
    recurrence: "NONE", customMode: "WEEKLY", customDays: [], monthDay: 1, time: "", endDate: ""
};

// Whether `state` currently resolves to a frequency the backend would
// actually accept — the one gap is "Custom + Weekly" with zero days
// checked, which both SubjectSection's create form and RecurringTasksModal/
// RoutinesView's edit forms should block submission on rather than sending
// a request the backend's own validation would reject anyway.
export const isRecurrenceStateValid = (state: RecurrenceState): boolean =>
    !(state.recurrence === "CUSTOM" && state.customMode === "WEEKLY" && state.customDays.length === 0);

const stepPreset = (frequency: string, from: Date): Date => {
    const next = new Date(from);
    switch (frequency) {
        case "DAILY": next.setDate(next.getDate() + 1); break;
        case "WEEKLY": next.setDate(next.getDate() + 7); break;
        case "BIWEEKLY": next.setDate(next.getDate() + 14); break;
        case "MONTHLY": next.setMonth(next.getMonth() + 1); break;
    }
    return next;
};

const stepCustomDay = (days: number[], from: Date): Date => {
    const next = new Date(from);
    do {
        next.setDate(next.getDate() + 1);
    } while (!days.includes(next.getDay()));
    return next;
};

const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();
// `new Date(year, month, day)` normalizes an out-of-range month on its own
// (month 12 rolls into January of year+1), so passing month+1 across a
// December boundary just works without special-casing here.
const clampToMonth = (year: number, month: number, day: number): Date => new Date(year, month, Math.min(day, daysInMonth(year, month)));
const lastDayOfMonth = (year: number, month: number): Date => new Date(year, month + 1, 0);

// Mirrors FrequencyUtils#nextMonthlyDayExecution on the backend.
const stepMonthlyDay = (dayToken: number | "LAST", from: Date): Date => {
    if (dayToken === "LAST") {
        const endOfFromMonth = lastDayOfMonth(from.getFullYear(), from.getMonth());
        return endOfFromMonth.getTime() > from.getTime() ? endOfFromMonth : lastDayOfMonth(from.getFullYear(), from.getMonth() + 1);
    }
    const candidate = clampToMonth(from.getFullYear(), from.getMonth(), dayToken);
    return candidate.getTime() > from.getTime() ? candidate : clampToMonth(from.getFullYear(), from.getMonth() + 1, dayToken);
};

// Client-side, not-yet-saved preview of the next `count` occurrence dates
// for a frequency the user is currently composing in the create/edit form —
// mirrors RecurringTaskService#computeNextOccurrence on the backend (the
// authoritative source once a routine actually exists) closely enough to
// use for a live "next dates" preview: the first occurrence always lands on
// the scheduler's very next tick (tomorrow) regardless of frequency, since
// that's how RecurringTaskSchedulerService#shouldGenerate treats a routine
// that's never generated before; every occurrence after that steps forward
// from the previous one via the frequency pattern. Stops early once a date
// would fall after `endDateStr`, if given.
export const getUpcomingOccurrences = (frequency: string, count: number, endDateStr?: string | null): Date[] => {
    const customDays = parseCustomFrequencyDays(frequency);
    const monthDay = parseMonthlyDayFrequency(frequency);
    const end = endDateStr ? new Date(`${endDateStr}T23:59:59`) : null;

    const occurrences: Date[] = [];
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() + 1);

    for (let i = 0; i < count; i++) {
        if (i > 0) {
            current = customDays ? stepCustomDay(customDays, current)
                : monthDay !== null ? stepMonthlyDay(monthDay, current)
                : stepPreset(frequency, current);
        }
        if (end && current > end) break;
        occurrences.push(new Date(current));
    }
    return occurrences;
};
