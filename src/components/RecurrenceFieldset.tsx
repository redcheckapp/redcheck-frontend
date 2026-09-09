import { WeekdayPicker } from "./WeekdayPicker";
import { RecurrencePreview } from "./RecurrencePreview";
import { resolveFrequency, isRecurrenceStateValid, type RecurrenceState } from "../utils/recurrenceUtils";

export interface RecurrenceFieldsetLabels {
    lblRecurrence: string;
    optNone: string;
    optDaily: string;
    optWeekly: string;
    optBiweekly: string;
    optMonthly: string;
    optCustom: string;
    lblCustomDays: string;
    weekDaysShort: string[];
    lblMonthDay: string;
    lastDay: string;
    lblRecurrenceTime: string;
    lblEndDate: string;
    lblUpcoming: string;
}

interface RecurrenceFieldsetProps {
    value: RecurrenceState;
    onChange: (next: RecurrenceState) => void;
    labels: RecurrenceFieldsetLabels;
    locale: string;
    // SubjectSection's full-size create form vs. RecurringTasksModal/
    // RoutinesView's compact inline-edit row — same controls, two existing
    // visual densities in this app, both preserved rather than picking one.
    compact?: boolean;
    // An existing routine is always recurring — editing forms (RecurringTasksModal,
    // RoutinesView) hide "Does not repeat" rather than letting it look like a
    // valid choice with no code path that actually does anything with it.
    allowNone?: boolean;
}

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// The recurrence-picking controls (frequency select, weekly/monthly custom
// sub-picker, time/end-date, live upcoming-dates preview) shared by
// SubjectSection's create form, RecurringTasksModal's inline edit form, and
// RoutinesView's inline edit form — the actual complexity of "recurrence"
// lives here once instead of three times, so all three can never drift out
// of sync with each other.
export const RecurrenceFieldset = ({ value, onChange, labels, locale, compact = false, allowNone = true }: RecurrenceFieldsetProps) => {
    const selectClass = compact
        ? "w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 cursor-pointer transition-colors duration-300"
        : "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer";
    const inputClass = compact
        ? "flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300"
        : "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none";
    const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";
    const pillBase = "px-3 py-1.5 text-xs font-bold rounded-lg transition-all";
    const pillActive = "bg-red-600 text-white shadow-sm";
    const pillInactive = "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700";

    const toggleCustomDay = (day: number) => {
        onChange({
            ...value,
            customDays: value.customDays.includes(day) ? value.customDays.filter(d => d !== day) : [...value.customDays, day]
        });
    };

    const resolvedFrequency = resolveFrequency(value.recurrence, value.customMode, value.customDays, value.monthDay);
    const showPreview = value.recurrence !== "NONE" && isRecurrenceStateValid(value);

    return (
        <>
            <div className="flex flex-col">
                {!compact && <label className={labelClass}>{labels.lblRecurrence}</label>}
                <select
                    value={value.recurrence}
                    onChange={e => onChange({ ...value, recurrence: e.target.value })}
                    title={compact ? labels.lblRecurrence : undefined}
                    className={selectClass}
                >
                    {allowNone && <option value="NONE">{labels.optNone}</option>}
                    <option value="DAILY">{labels.optDaily}</option>
                    <option value="WEEKLY">{labels.optWeekly}</option>
                    <option value="BIWEEKLY">{labels.optBiweekly}</option>
                    <option value="MONTHLY">{labels.optMonthly}</option>
                    <option value="CUSTOM">{labels.optCustom}</option>
                </select>
            </div>

            {value.recurrence === "CUSTOM" && (
                <>
                    <div className="flex gap-1.5">
                        <button type="button" onClick={() => onChange({ ...value, customMode: "WEEKLY" })} className={`${pillBase} ${value.customMode === "WEEKLY" ? pillActive : pillInactive}`}>
                            {labels.optWeekly}
                        </button>
                        <button type="button" onClick={() => onChange({ ...value, customMode: "MONTHLY" })} className={`${pillBase} ${value.customMode === "MONTHLY" ? pillActive : pillInactive}`}>
                            {labels.optMonthly}
                        </button>
                    </div>

                    {value.customMode === "WEEKLY" ? (
                        <div className="flex flex-col gap-1.5">
                            {!compact && <label className={labelClass}>{labels.lblCustomDays}</label>}
                            <WeekdayPicker selectedDays={value.customDays} onToggleDay={toggleCustomDay} dayLabels={labels.weekDaysShort} />
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {!compact && <label className={labelClass}>{labels.lblMonthDay}</label>}
                            <select
                                value={String(value.monthDay)}
                                onChange={e => onChange({ ...value, monthDay: e.target.value === "LAST" ? "LAST" : Number(e.target.value) })}
                                title={compact ? labels.lblMonthDay : undefined}
                                className={selectClass}
                            >
                                {MONTH_DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                                <option value="LAST">{labels.lastDay}</option>
                            </select>
                        </div>
                    )}
                </>
            )}

            {value.recurrence !== "NONE" && (
                <>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="flex-1 flex flex-col">
                            {!compact && <label className={labelClass}>{labels.lblRecurrenceTime}</label>}
                            <input
                                type="time"
                                value={value.time}
                                onChange={e => onChange({ ...value, time: e.target.value })}
                                title={compact ? labels.lblRecurrenceTime : undefined}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            {!compact && <label className={labelClass}>{labels.lblEndDate}</label>}
                            <input
                                type="date"
                                value={value.endDate}
                                onChange={e => onChange({ ...value, endDate: e.target.value })}
                                min={new Date().toISOString().slice(0, 10)}
                                title={compact ? labels.lblEndDate : undefined}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {showPreview && (
                        <RecurrencePreview frequency={resolvedFrequency} endDate={value.endDate} locale={locale} label={labels.lblUpcoming} />
                    )}
                </>
            )}
        </>
    );
};
