// Custom recurrence is layered on top of the 4 preset frequency strings the
// backend already understood natively (DAILY/WEEKLY/BIWEEKLY/MONTHLY) rather
// than replacing them — it's stored as a restricted 6-field cron expression
// (`RecurringTaskSchedulerService` only ever ticks once a day at midnight, so
// seconds/minutes/hours are always pinned to "0 0 0"; only the day-of-week
// field varies): "0 0 0 * * <days>", `<days>` a sorted, comma-separated list
// of 0-6 using the same Sunday=0 numbering as JS's `Date#getDay()` (and
// standard cron), e.g. "0 0 0 * * 1,4" for every Monday and Thursday.
const CUSTOM_FREQUENCY_PATTERN = /^0 0 0 \* \* ([0-6](?:,[0-6]){0,6})$/;

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

// Human-readable label for a custom frequency ("Lun, Jue"), or null if it
// isn't one. `mondayFirstLabels` must be 2-letter abbreviations in the same
// Monday-first order as MONDAY_FIRST_CRON_DAYS.
export const formatCustomFrequencyLabel = (frequency: string, mondayFirstLabels: string[]): string | null => {
    const days = parseCustomFrequencyDays(frequency);
    if (!days) return null;
    return MONDAY_FIRST_CRON_DAYS
        .filter(cronDay => days.includes(cronDay))
        .map(cronDay => mondayFirstLabels[MONDAY_FIRST_CRON_DAYS.indexOf(cronDay)])
        .join(", ");
};

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
    const end = endDateStr ? new Date(`${endDateStr}T23:59:59`) : null;

    const occurrences: Date[] = [];
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    current.setDate(current.getDate() + 1);

    for (let i = 0; i < count; i++) {
        if (i > 0) {
            current = customDays ? stepCustomDay(customDays, current) : stepPreset(frequency, current);
        }
        if (end && current > end) break;
        occurrences.push(new Date(current));
    }
    return occurrences;
};
