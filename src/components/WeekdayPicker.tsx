import { MONDAY_FIRST_CRON_DAYS } from "../utils/recurrenceUtils";

interface WeekdayPickerProps {
    selectedDays: number[];
    onToggleDay: (day: number) => void;
    dayLabels: string[]; // Monday-first, 2-letter abbreviations
}

// Reused by SubjectSection's "new task" form and RecurringTasksModal's
// inline edit form — both build/edit the same custom day-of-week frequency
// (see recurrenceUtils.ts), so the chip picker itself lives here once
// instead of twice.
export const WeekdayPicker = ({ selectedDays, onToggleDay, dayLabels }: WeekdayPickerProps) => (
    <div className="flex gap-1.5 flex-wrap">
        {MONDAY_FIRST_CRON_DAYS.map((cronDay, i) => {
            const isSelected = selectedDays.includes(cronDay);
            return (
                <button
                    key={cronDay}
                    type="button"
                    onClick={() => onToggleDay(cronDay)}
                    aria-pressed={isSelected}
                    className={`w-9 h-9 shrink-0 rounded-lg text-xs font-bold transition-all active:scale-90 ${
                        isSelected
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                >
                    {dayLabels[i]}
                </button>
            );
        })}
    </div>
);
