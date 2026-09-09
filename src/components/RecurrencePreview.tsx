import { CalendarClock } from "lucide-react";
import { getUpcomingOccurrences } from "../utils/recurrenceUtils";

interface RecurrencePreviewProps {
    frequency: string;
    endDate?: string;
    locale: string;
    label: string;
}

// Shared by SubjectSection's create form and RecurringTasksModal's inline
// edit form — a quick "here's what this will actually generate" preview
// while the user is still composing, computed purely client-side (see
// getUpcomingOccurrences) so it updates instantly with every click, no
// network round trip. Renders nothing if there's nothing to preview yet
// (e.g. "Custom" selected but no weekday checked — callers should only
// render this once `frequency` resolves to something valid).
export const RecurrencePreview = ({ frequency, endDate, locale, label }: RecurrencePreviewProps) => {
    const dates = getUpcomingOccurrences(frequency, 4, endDate || null);
    if (dates.length === 0) return null;

    const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

    return (
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2 transition-colors duration-300">
            <CalendarClock size={14} className="shrink-0 mt-0.5" />
            <span><span className="font-semibold text-gray-600 dark:text-gray-300">{label}</span> {dates.map(d => formatter.format(d)).join(" · ")}</span>
        </div>
    );
};
