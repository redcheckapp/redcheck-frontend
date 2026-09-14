import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef, memo, lazy, Suspense, type TouchEvent, type KeyboardEvent, type DragEvent, type MouseEvent, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Plus, Check, ListTodo, CalendarRange } from "lucide-react";
import { getProgressHeatmap } from "../api/progressRecordApi";
import { getTasksForDateRange } from "../api/taskApi";
import { getCalendarEventsForDateRange, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../api/calendarEventApi";
import { createRecurringCalendarEvent } from "../api/recurringCalendarEventApi";
import { getEventCategories } from "../api/eventCategoryApi";
import type { ProgressRecord, SubjectWithTasks, TaskPriority, TaskRequest, TaskResponse, CalendarEventResponse, CalendarEventRequest, RecurringCalendarEventRequest, EventCategoryResponse } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { getSubjectColor } from "../utils/subjectColors";
import { getPriorityColor } from "../utils/priorityColors";
import { triggerHapticFeedback } from "../utils/feedback";
import { DEFAULT_EVENT_COLOR } from "../utils/eventCategoryColors";
import { DayOffIllustration } from "./illustrations/DayOffIllustration";

// Only needed once the user opens the create/edit task modal from the
// calendar — split out of the main AgendaView chunk, same pattern as the
// dashboard's own on-demand modals (SettingsModal, TrashView, etc.).
const CalendarTaskModal = lazy(() => import("./CalendarTaskModal").then(m => ({ default: m.CalendarTaskModal })));
const CalendarEventModal = lazy(() => import("./CalendarEventModal").then(m => ({ default: m.CalendarEventModal })));

type ViewMode = "day" | "week" | "month";

interface AgendaViewProps {
    subjects?: SubjectWithTasks[];
    onCreateTask: (subjectId: number, data: TaskRequest) => Promise<void>;
    onUpdateTask: (subjectId: number, taskId: number, data: TaskRequest) => Promise<void>;
    onDeleteTask: (subjectId: number, taskId: number) => Promise<void>;
    onToggleTask: (subjectId: number, taskId: number) => Promise<void>;
    // Settings-modal opt-out (defaults true) — hides task chips/cards from
    // every view (Day/Week/Month) without touching navigation, creating
    // tasks, or the separate heatmap-coloring toggle. See
    // getMergedTasksForDate, the single choke point this gates.
    showTasks?: boolean;
    // Whether Month/Week day cells get colored by completion ratio (see
    // getSquareColor below) — defaults true. Lifted to DashboardPage/
    // SettingsModal (2026-09-10, was local state here) to sit next to the
    // other calendar-display toggles in Settings rather than a separate
    // icon button in the calendar's own header, for consistency with how
    // every other app-wide preference is now surfaced in one place.
    heatmapEnabled?: boolean;
}

// Either creating a new task on a clicked date, or editing/rescheduling one
// clicked in Day/Week/Month — a single modal (CalendarTaskModal) handles
// both, keyed off which variant this is.
type TaskModalState =
    | { mode: "create"; date: Date; defaultSubjectId: number | null }
    | { mode: "edit"; task: TaskResponse };

// Same shape, for the separate calendar-events domain (CalendarEventModal).
// Events are never tied to a subject, so there's no defaultSubjectId here.
// `endDate` is only ever set by Day view's drag-to-create (see
// handleTimelineMouseDown) — every other entry point (the "+" chooser)
// only knows a single clicked date/hour.
type EventModalState =
    | { mode: "create"; date: Date; endDate?: Date }
    | { mode: "edit"; event: CalendarEventResponse };

// --- Translation dictionary for AgendaView ---
const translations = {
    es: {
        btnToday: "Hoy",
        btnDay: "Día",
        btnWeek: "Semana",
        btnMonth: "Mes",
        lblViewTasks: "Ver tareas",
        lblAllDay: "Todo el día",
        moreTasks: "más",
        moreEvents: "más",
        noCategory: "Sin categoría",
        chooserTask: "Tarea",
        chooserEvent: "Evento",
        jumpToDate: "Ir a una fecha",
        prevPeriod: "Periodo anterior",
        nextPeriod: "Periodo siguiente",
        prevMonth: "Mes anterior",
        nextMonth: "Mes siguiente",
        addTaskTitle: "Añadir",
        btnAddTask: "Añadir tarea",
        btnAddEvent: "Añadir evento",
        dayOffTitle: "¡Día libre!",
        dayOffDesc: "No hay tareas programadas para este día.",
        ttToggleComplete: "Marcar como completada",
        taskRescheduled: "Tarea reprogramada",
        errReschedule: "No se pudo reprogramar la tarea.",
        priorityLow: "Baja",
        priorityMedium: "Media",
        priorityHigh: "Alta",
        weekDays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    },
    en: {
        btnToday: "Today",
        btnDay: "Day",
        btnWeek: "Week",
        btnMonth: "Month",
        lblViewTasks: "View tasks",
        lblAllDay: "All day",
        moreTasks: "more",
        moreEvents: "more",
        noCategory: "No category",
        chooserTask: "Task",
        chooserEvent: "Event",
        jumpToDate: "Jump to a date",
        prevPeriod: "Previous period",
        nextPeriod: "Next period",
        prevMonth: "Previous month",
        nextMonth: "Next month",
        addTaskTitle: "Add",
        btnAddTask: "Add task",
        btnAddEvent: "Add event",
        dayOffTitle: "Day off!",
        dayOffDesc: "No tasks scheduled for this day.",
        ttToggleComplete: "Mark as complete",
        taskRescheduled: "Task rescheduled",
        errReschedule: "Couldn't reschedule the task.",
        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    }
};

type CalendarTask = TaskResponse & { subjectName: string };

const priorityLabel = (priority: TaskPriority, t: typeof translations["es"]) =>
    priority === "HIGH" ? t.priorityHigh : priority === "LOW" ? t.priorityLow : t.priorityMedium;

// Day cells and task chips across Month/Week/Day are plain onClick divs
// (not <button>s, since they sit inside CSS grids/flex rows with very
// specific sizing that a <button>'s default styling would fight) — this
// is the keyboard-equivalent half of making them operable: paired with
// `role="button" tabIndex={0}` on the element itself, Enter/Space now
// triggers the same action a click would. Every cell/chip becomes its own
// Tab stop rather than a roving-tabindex grid (the ARIA-grid pattern a
// calendar like this would ideally use) — a real UX tradeoff (Month view
// alone can be 35-42 stops), but the correct minimum bar (WCAG 2.1.1,
// nothing keyboard-unreachable) without the much larger scope of building
// full arrow-key-driven intra-grid roving focus.
const handleActivateKeyDown = (e: KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
    }
};

// Tasks due on a given calendar day, across all subjects — pulled out to
// module scope (rather than a closure inside the component) so it can be
// called once per day-of-the-week in Week view without fighting
// useMemo's exhaustive-deps over a recreated-every-render closure.
const getTasksForDate = (subjects: SubjectWithTasks[], date: Date) => {
    return subjects
        .flatMap(subject =>
            subject.tasks
                .filter(task => {
                    if (!task.deadline) return false;
                    const taskDate = new Date(task.deadline);
                    return taskDate.getFullYear() === date.getFullYear() &&
                           taskDate.getMonth() === date.getMonth() &&
                           taskDate.getDate() === date.getDate();
                })
                .map(task => ({ ...task, subjectName: subject.name }))
        )
        .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
};

// True if `date` is strictly before `today`'s calendar day (same comparison
// the Month/Week cell rendering already does inline for `isPast`) — used to
// decide, per day, whether to trust `subjects` (live, but only ever has
// pending/completed-today tasks) or the fetched calendar-history data.
const isDateInPast = (date: Date, today: Date) => date < today && date.toDateString() !== today.toDateString();

const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Historical counterpart to getTasksForDate above: same per-day filter and
// sort, but over a flat TaskResponse[] (fetched via getTasksForDateRange,
// which — unlike `subjects` — includes completed tasks) instead of
// subjects-with-nested-tasks, so subjectName has to be resolved through a
// separate id->name map rather than read off the grouping.
const getHistoricalTasksForDate = (
    tasks: TaskResponse[],
    subjectNameById: Map<number, string>,
    date: Date
): CalendarTask[] => {
    return tasks
        .filter(task => {
            if (!task.deadline) return false;
            const taskDate = new Date(task.deadline);
            return taskDate.getFullYear() === date.getFullYear() &&
                   taskDate.getMonth() === date.getMonth() &&
                   taskDate.getDate() === date.getDate();
        })
        .map(task => ({ ...task, subjectName: subjectNameById.get(task.subjectId) ?? "" }))
        .sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
};

// A pure whole-calendar-day index for `date` — its Y/M/D read via the
// LOCAL getters (so it's still "the day this Date reads as" in whatever
// timezone the browser is in), then re-anchored through Date.UTC purely so
// dividing by a day's millisecond count is safe arithmetic with no
// timezone/DST component left in it at all. Every event-vs-day comparison
// in this file goes through this (see getEventDaySpan/getEventsForDate
// below) specifically so there is no hour/millisecond boundary left
// anywhere for an off-by-one to hide in — two instants on the same
// calendar day always produce the exact same integer, full stop.
const dayIndex = (date: Date): number =>
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

interface EventDaySpan {
    event: CalendarEventResponse;
    startDayIdx: number;
    endDayIdx: number; // inclusive
}

// Reduces an event's real start/end instants to the whole calendar days
// they fall on — e.g. an all-day event stored as
// "2026-09-18T00:00:00" .. "2026-09-18T23:59:59" collapses to a single
// startDayIdx === endDayIdx, and can never bleed into the 19th no matter
// what time-of-day component either end happens to carry.
const getEventDaySpan = (event: CalendarEventResponse): EventDaySpan => ({
    event,
    startDayIdx: dayIndex(new Date(event.startDateTime)),
    endDayIdx: dayIndex(new Date(event.endDateTime)),
});

// Calendar events for a given day: unlike tasks (a single point in time),
// an event is an interval — it "occurs" on day D whenever D falls within
// [startDay, endDay] (inclusive), covering punctual, all-day and multi-day
// events alike with one comparison, entirely in whole-day units (see
// dayIndex above) rather than comparing raw timestamps. Independent of
// `showTasks`/getMergedTasksForDate — hiding tasks shouldn't hide events,
// they're a separate content type on the same calendar.
const getEventsForDate = (events: CalendarEventResponse[], date: Date): CalendarEventResponse[] => {
    const d = dayIndex(date);
    return events
        .filter(ev => { const span = getEventDaySpan(ev); return span.startDayIdx <= d && span.endDayIdx >= d; })
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
};

const DAY_VIEW_HOUR_START = 0;
const DAY_VIEW_HOUR_END = 23;

// Matches the hourly grid's own h-20 row height (80px = 5rem at the default
// 16px root) — every Day-view vertical-position formula in this file (the
// "now" line, and the event-block layout below) is pinned to this constant.
const DAY_VIEW_ROW_HEIGHT_REM = 5;
// A block shorter than this (e.g. a 5-minute event) still gets this much
// height so its title stays legible/clickable — same reasoning Google
// Calendar and similar apps use for a minimum event-block size.
const MIN_EVENT_BLOCK_HEIGHT_REM = 1.5;

// Renders "minutes since midnight" as a localized "HH:MM" — used only for
// the drag-to-create ghost preview's live time label; the actual Date
// objects handed to the modal are built straight from the drag's
// start/end minutes (see handleTimelineMouseDown), this is purely display.
const formatMinutesOfDay = (minutes: number) =>
    new Date(2000, 0, 1, 0, minutes).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// A continuous Month-view banner segment for one row of the grid — see the
// monthEventSegments useMemo further down for how these get built.
interface MonthEventSegment {
    event: CalendarEventResponse;
    row: number; // 0-indexed grid row
    colStart: number; // 0-6 (Monday=0)
    colEnd: number; // 0-6, inclusive
    lane: number; // 0-based vertical stacking slot within this row
    isStart: boolean; // true on the segment containing the event's real first day
    isEnd: boolean; // true on the segment containing the event's real last day
}

interface DayEventBlock {
    event: CalendarEventResponse;
    start: Date; // clipped to this day's [00:00, 24:00) window
    end: Date;
    startMinutes: number; // minutes since this day's midnight
    endMinutes: number;
    col: number; // 0-based column within its overlap cluster
    totalCols: number; // column count of that cluster, for width division
}

// Lays out this day's *timed* (non-allDay) events as Google-Calendar-style
// blocks spanning their real duration: each gets a `top`/`height` (via
// startMinutes/endMinutes, see renderDayEventBlock) and, when two or more
// overlap in time, a `col`/`totalCols` pair so they sit side by side instead
// of on top of each other. All-day events never reach this function — they
// stay in the separate all-day strip.
//
// Two passes: (1) clip every event's interval to this day's window and sort
// by start; (2) sweep through in order, grouping consecutive events into
// "clusters" (a run where each event starts before the running max end of
// the cluster so far — the standard interval-overlap grouping), then within
// each cluster greedily assign the lowest free column (freed once that
// column's current occupant has ended). A cluster's own column count is
// used as `totalCols` for every event in it, so unrelated overlaps
// elsewhere in the day don't needlessly narrow these blocks.
const layoutTimedEventsForDay = (events: CalendarEventResponse[], date: Date): DayEventBlock[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const clipped = events
        .filter(ev => !ev.allDay)
        .map(ev => {
            const rawStart = new Date(ev.startDateTime);
            const rawEnd = new Date(ev.endDateTime);
            const start = rawStart < dayStart ? dayStart : rawStart;
            const end = rawEnd > dayEnd ? dayEnd : rawEnd;
            const startMinutes = (start.getTime() - dayStart.getTime()) / 60000;
            // A punctual event (start === end) still gets a sliver of
            // height via this floor, same spirit as MIN_EVENT_BLOCK_HEIGHT_REM.
            const endMinutes = Math.max(startMinutes + 15, (end.getTime() - dayStart.getTime()) / 60000);
            return { event: ev, start, end, startMinutes, endMinutes };
        })
        .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

    const results: DayEventBlock[] = [];
    let clusterStart = 0;
    while (clusterStart < clipped.length) {
        let clusterEnd = clipped[clusterStart].endMinutes;
        let i = clusterStart + 1;
        while (i < clipped.length && clipped[i].startMinutes < clusterEnd) {
            clusterEnd = Math.max(clusterEnd, clipped[i].endMinutes);
            i++;
        }

        const openCols: (number | null)[] = [];
        for (let j = clusterStart; j < i; j++) {
            const item = clipped[j];
            for (let c = 0; c < openCols.length; c++) {
                if (openCols[c] !== null && (openCols[c] as number) <= item.startMinutes) openCols[c] = null;
            }
            let col = openCols.findIndex(c => c === null);
            if (col === -1) {
                col = openCols.length;
                openCols.push(null);
            }
            openCols[col] = item.endMinutes;
            results.push({ ...item, col, totalCols: 0 }); // totalCols backfilled below
        }

        const totalCols = openCols.length;
        for (let k = results.length - (i - clusterStart); k < results.length; k++) {
            results[k].totalCols = totalCols;
        }

        clusterStart = i;
    }

    return results;
};

// Week cells are one tall row (vs. Month's up to six short ones), so they
// can comfortably fit more real task cards before falling back to "+N more".
const WEEK_CELL_TASK_LIMIT = 6;

const VIEW_ORDER: ViewMode[] = ["day", "week", "month"];

// Same long-press tuning TaskItem.tsx/SubjectSection.tsx already use for
// their own long-press-to-select gesture — kept identical here so a
// press-and-hold feels the same everywhere in the app, not just tasks.
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

// Which direction the grid content should slide in from. Set directly in
// event handlers (prev/next vs. everything else), not derived during
// render — plain setState in a click handler, so this doesn't need the
// render-phase-update pattern used elsewhere in this file for props-driven
// state (e.g. Confetti's lastTrigger comparison).
type TransitionVariant = "next" | "prev" | "fade";

interface DatePickerPopoverProps {
    selectedDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
    weekDays: string[];
    months: string[];
    prevMonthLabel: string;
    nextMonthLabel: string;
}

// A small in-house month picker for the header's "jump to date" button —
// replaces a hidden native <input type="date">, which opened the browser's
// own OS-styled calendar popup and broke the app's visual language. Not a
// modal (no backdrop/focus-trap via ModalOverlay): it's a lightweight,
// click-outside-to-dismiss popover, the same tier of UI as a native
// <select> dropdown, not a dialog.
const DatePickerPopover = ({ selectedDate, onSelect, onClose, weekDays, months, prevMonthLabel, nextMonthLabel }: DatePickerPopoverProps) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
        };
        const handleEscKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscKeyDown);
        };
    }, [onClose]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const today = new Date();

    return (
        <div
            ref={containerRef}
            className="absolute top-full right-0 mt-2 z-50 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-3 animate-soft-fade"
        >
            <div className="flex items-center justify-between mb-2 px-1">
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    aria-label={prevMonthLabel}
                    title={prevMonthLabel}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md text-gray-500 dark:text-gray-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 capitalize">
                    {months[month]} {year}
                </span>
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    aria-label={nextMonthLabel}
                    title={nextMonthLabel}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md text-gray-500 dark:text-gray-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase">
                        {d.substring(0, 2)}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: totalCells }, (_, i) => {
                    const dayNum = i - firstDay + 1;
                    if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />;
                    const cellDate = new Date(year, month, dayNum);
                    const isToday = cellDate.toDateString() === today.toDateString();
                    const isSelected = cellDate.toDateString() === selectedDate.toDateString();
                    return (
                        <button
                            type="button"
                            key={i}
                            onClick={() => onSelect(cellDate)}
                            className={`aspect-square rounded-lg text-xs font-semibold transition-all active:scale-90 ${
                                isSelected
                                    ? "bg-red-600 text-white hover:bg-red-600"
                                    : isToday
                                        ? "text-red-600 dark:text-red-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                        >
                            {dayNum}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const AgendaView = memo(({ subjects = [], onCreateTask, onUpdateTask, onDeleteTask, onToggleTask, showTasks = true, heatmapEnabled = true }: AgendaViewProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [view, setView] = useState<ViewMode>("month");

    // The Day/Week/Month sliding pill (below) is measured directly off the
    // real button DOM nodes rather than assumed to be an even 1/3 split —
    // a `calc()`-based guess drifted out of sync with flexbox's own
    // fractional-pixel rounding (see the JSX comment at the pill itself).
    const viewSelectorRef = useRef<HTMLDivElement>(null);
    const viewButtonRefs = useRef<Partial<Record<ViewMode, HTMLButtonElement | null>>>({});
    const [pillRect, setPillRect] = useState<{ left: number; width: number } | null>(null);

    const measurePill = useCallback(() => {
        const button = viewButtonRefs.current[view];
        if (!button) return;
        setPillRect({ left: button.offsetLeft, width: button.offsetWidth });
    }, [view]);

    // Runs before paint (not useEffect) so switching views never flashes the
    // pill at its previous size/position for a frame.
    useLayoutEffect(() => {
        measurePill();
    }, [measurePill]);

    // Button widths depend on layout (breakpoint, font-size accessibility
    // setting, window resize) that can change without `view` changing, so a
    // ResizeObserver on the row keeps the pill accurate even then.
    useEffect(() => {
        const el = viewSelectorRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => measurePill());
        observer.observe(el);
        return () => observer.disconnect();
    }, [measurePill]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<Record<string, ProgressRecord>>({});
    const [loadingRecords, setLoadingRecords] = useState(true);
    // Calendar history: raw tasks (pending + completed) fetched for the
    // visible range, used only for past days — see getMergedTasksForDate
    // below. `historyRefreshTick` is bumped after a create/update/delete/
    // toggle reaches the calendar so a past-day edit is reflected without
    // waiting for the next navigation.
    const [historicalTasks, setHistoricalTasks] = useState<TaskResponse[]>([]);
    const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
    const refreshHistory = () => setHistoryRefreshTick(tick => tick + 1);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [taskModalState, setTaskModalState] = useState<TaskModalState | null>(null);
    const [eventModalState, setEventModalState] = useState<EventModalState | null>(null);
    // Add-chooser popover (Tarea/Evento), opened from every "+" affordance
    // instead of jumping straight into CalendarTaskModal like before — see
    // openAddChooser below.
    const [addChooser, setAddChooser] = useState<{ date: Date; rect: DOMRect } | null>(null);
    // Calendar events (separate domain from tasks — see CalendarEvent vs
    // Task in redcheck-backend): fetched for the same visible range as
    // historicalTasks, but unconditionally (there's no "live" subjects-like
    // source for events the way today/future tasks have `subjects`).
    const [events, setEvents] = useState<CalendarEventResponse[]>([]);
    const [eventsRefreshTick, setEventsRefreshTick] = useState(0);
    const refreshEvents = () => setEventsRefreshTick(tick => tick + 1);
    const [categories, setCategories] = useState<EventCategoryResponse[]>([]);
    const [transitionVariant, setTransitionVariant] = useState<TransitionVariant>("fade");
    // Month view's "+N more" hover preview (see the popover render near the
    // bottom of this component). Cleared on every navigation below, not
    // just on mouseleave — the grid content it's anchored to remounts on
    // nav (keyed wrapper), and a keyboard-triggered nav in particular can
    // fire while the mouse hasn't moved off the trigger at all.
    const [morePopover, setMorePopover] = useState<{ tasks: CalendarTask[]; rect: DOMRect } | null>(null);

    // --- Drag-and-drop rescheduling (desktop/mouse only) --------------
    // Native HTML5 drag-and-drop, not a pointer-tracking library — this
    // repo has none, and native DnD is a proven, zero-dependency fit for
    // "pick a chip up, drop it on a cell/hour row." It's mouse-only by
    // platform design (mobile browsers don't initiate it from touch), so
    // on touch the `draggable` attribute is simply inert and normal taps
    // (open the edit modal) keep working exactly as before — mobile users
    // still reschedule via the modal's own deadline field.
    const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);

    const handleChipDragStart = (e: DragEvent<HTMLDivElement>, task: CalendarTask) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(task.id));
        setDraggedTask(task);
    };
    const handleChipDragEnd = () => {
        setDraggedTask(null);
        setDragOverKey(null);
    };
    const handleDropZoneDragOver = (e: DragEvent<HTMLDivElement>, key: string) => {
        if (!draggedTask) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverKey !== key) setDragOverKey(key);
    };
    const handleDropZoneDragLeave = (key: string) => {
        setDragOverKey(prev => (prev === key ? null : prev));
    };

    // Same "YYYY-MM-DDTHH:mm" conversion CalendarTaskModal.tsx uses for its
    // datetime-local field, duplicated rather than imported — that file's
    // own copy is deliberately kept local so it doesn't depend on
    // AgendaView, and the same reasoning applies here in reverse.
    const toDatetimeLocalValue = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const rescheduleTask = async (task: CalendarTask, mutate: (d: Date) => void) => {
        if (!task.deadline) return;
        const newDeadline = new Date(task.deadline);
        mutate(newDeadline);
        try {
            await onUpdateTask(task.subjectId, task.id, {
                title: task.title,
                description: task.description ?? null,
                deadline: toDatetimeLocalValue(newDeadline),
            });
            refreshHistory();
            toast.success(t.taskRescheduled);
        } catch (error) {
            console.error("Error rescheduling task:", error);
            toast.error(t.errReschedule);
        }
    };

    // Dropped on a day cell (Month/Week): keep whatever time-of-day the
    // task already had, just move it to the new date.
    const handleDayCellDrop = (e: DragEvent<HTMLDivElement>, targetDate: Date) => {
        e.preventDefault();
        setDragOverKey(null);
        const task = draggedTask;
        setDraggedTask(null);
        if (!task) return;
        rescheduleTask(task, (d) => d.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
    };
    // Dropped on a Day view hour row: move to that hour on the currently
    // viewed day (there's only one day on screen in Day view, so unlike
    // Month/Week this changes the time, not the date).
    const handleHourRowDrop = (e: DragEvent<HTMLDivElement>, hour: number) => {
        e.preventDefault();
        setDragOverKey(null);
        const task = draggedTask;
        setDraggedTask(null);
        if (!task) return;
        rescheduleTask(task, (d) => {
            d.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            d.setHours(hour, 0, 0, 0);
        });
    };
    // Dropped on the "all day" strip: same day, but strips the time
    // component entirely — the natural way to turn a timed task into an
    // all-day one from the calendar itself.
    const handleAllDayDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverKey(null);
        const task = draggedTask;
        setDraggedTask(null);
        if (!task) return;
        rescheduleTask(task, (d) => {
            d.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            d.setHours(0, 0, 0, 0);
        });
    };

    const changeView = (nextView: ViewMode) => {
        setTransitionVariant("fade");
        setMorePopover(null);
        setView(nextView);
    };

    const jumpToDay = (date: Date) => {
        setTransitionVariant("fade");
        setMorePopover(null);
        setCurrentDate(date);
        setView("day");
    };

    const openCreateModal = (date: Date) => {
        setTaskModalState({ mode: "create", date, defaultSubjectId: subjects[0]?.id ?? null });
    };
    const openEditModal = (task: TaskResponse) => {
        setTaskModalState({ mode: "edit", task });
    };

    const openCreateEventModal = (date: Date, endDate?: Date) => {
        setEventModalState({ mode: "create", date, endDate });
    };
    const openEditEventModal = (event: CalendarEventResponse) => {
        setEventModalState({ mode: "edit", event });
    };

    // Every "+" affordance (Month/Week cell, Day hour row) opens this small
    // chooser instead of jumping straight into task creation — mirrors
    // Google Calendar's own "Task or Event?" prompt. Anchored off the
    // clicked button's own rect, same positioning approach as morePopover.
    const openAddChooser = (e: MouseEvent<HTMLButtonElement>, date: Date) => {
        e.stopPropagation();
        setAddChooser({ date, rect: e.currentTarget.getBoundingClientRect() });
    };

    // --- Month view (mobile): long-press a day cell to add ------------
    // The "+" button is desktop-only (can-hover:) — on touch, a plain tap
    // has to keep meaning "open this day" (jumpToDay, unchanged), so the
    // chooser can only be reached via a deliberate press-and-hold, same
    // gesture/timing TaskItem.tsx's long-press-to-select already uses. One
    // shared ref (not per-cell) is enough since only one finger can be
    // pressing a cell at a time.
    const monthLongPressRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; startX: number; startY: number } | null>(null);

    const handleMonthCellTouchStart = (e: TouchEvent<HTMLDivElement>, cellDateObj: Date) => {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const state = { startX: touch.clientX, startY: touch.clientY, timer: null as ReturnType<typeof setTimeout> | null };
        state.timer = setTimeout(() => {
            state.timer = null;
            if (localStorage.getItem("taskFeedbackEnabled") !== "false") triggerHapticFeedback();
            setAddChooser({ date: cellDateObj, rect });
        }, LONG_PRESS_MS);
        monthLongPressRef.current = state;
    };
    // A scroll/swipe starts with the same touchstart as a long-press —
    // cancel the timer once the finger has clearly moved, same threshold-
    // based disambiguation as TaskItem.tsx and the swipe-nav handling below.
    const handleMonthCellTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        const state = monthLongPressRef.current;
        if (!state?.timer) return;
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - state.startX) > LONG_PRESS_MOVE_THRESHOLD_PX || Math.abs(touch.clientY - state.startY) > LONG_PRESS_MOVE_THRESHOLD_PX) {
            clearTimeout(state.timer);
            monthLongPressRef.current = null;
        }
    };
    const clearMonthLongPress = () => {
        if (monthLongPressRef.current?.timer) clearTimeout(monthLongPressRef.current.timer);
        monthLongPressRef.current = null;
    };

    const handleCreateEvent = async (data: CalendarEventRequest) => {
        await createCalendarEvent(data);
        refreshEvents();
    };
    // A recurring event's first occurrence is generated by the backend
    // scheduler on its next daily tick (mirrors RecurringTask), never
    // synchronously here — nothing to refetch immediately, unlike a
    // one-off event.
    const handleCreateRecurringEvent = async (data: RecurringCalendarEventRequest) => {
        await createRecurringCalendarEvent(data);
    };
    const handleUpdateEvent = async (eventId: number, data: CalendarEventRequest) => {
        await updateCalendarEvent(eventId, data);
        refreshEvents();
    };
    const handleDeleteEvent = async (eventId: number) => {
        await deleteCalendarEvent(eventId);
        refreshEvents();
    };

    // CalendarTaskModal's onCreate/onUpdate/onDelete straight through would
    // skip refreshHistory() — needed so a past-day task created/edited/
    // deleted from the calendar shows up immediately instead of only after
    // the next navigation re-triggers the history fetch.
    const handleCreateTaskFromCalendar = async (subjectId: number, data: TaskRequest) => {
        await onCreateTask(subjectId, data);
        refreshHistory();
    };
    const handleUpdateTaskFromCalendar = async (subjectId: number, taskId: number, data: TaskRequest) => {
        await onUpdateTask(subjectId, taskId, data);
        refreshHistory();
    };
    const handleDeleteTaskFromCalendar = async (subjectId: number, taskId: number) => {
        await onDeleteTask(subjectId, taskId);
        refreshHistory();
    };

    const todayObj = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Monday of today's week, for Month view's "current week" row tint —
    // same Monday-start math as currentWeekDays below, just anchored on
    // today instead of currentDate so it doesn't shift as the user navigates.
    const todayWeekStart = (() => {
        const d = new Date(todayObj);
        const day = d.getDay();
        d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
        d.setHours(0, 0, 0, 0);
        return d;
    })();
    const todayWeekEnd = new Date(todayWeekStart);
    todayWeekEnd.setDate(todayWeekEnd.getDate() + 6);
    todayWeekEnd.setHours(23, 59, 59, 999);

    useEffect(() => {
        const fetchHeatmap = async () => {
            setLoadingRecords(true);
            try {
                const data = await getProgressHeatmap();
                const recordMap: Record<string, ProgressRecord> = {};
                data.forEach(item => {
                    const dateKey = item.date.split("T")[0]; 
                    recordMap[dateKey] = item;
                });
                setRecords(recordMap);
            } catch (error) {
                console.error("Error loading the heatmap:", error);
            } finally {
                setLoadingRecords(false);
            }
        };
        fetchHeatmap();
    }, []);

    // Event categories: fetched once (like the heatmap above) and refetched
    // on demand after a create/delete inside CalendarEventModal — passed
    // down as `onCategoriesChanged` so the modal doesn't need its own
    // separate category state.
    const fetchCategories = useCallback(async () => {
        try {
            const data = await getEventCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error loading event categories:", error);
        }
    }, []);
    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const handlePrev = () => {
        setTransitionVariant("prev");
        setMorePopover(null);
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 1));
    };

    const handleNext = () => {
        setTransitionVariant("next");
        setMorePopover(null);
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 1));
    };

    const handleToday = () => {
        setTransitionVariant("fade");
        setMorePopover(null);
        setCurrentDate(new Date());
    };

    // Picking a date from the header's jump-to-date popover opens that day's
    // Day view directly — same behavior as clicking a day cell in Month/Week
    // view (see jumpToDay above), rather than just moving the current
    // Month/Week view to a different date.
    const handleJumpToDate = (date: Date) => {
        setDatePickerOpen(false);
        jumpToDay(date);
    };

    // --- Mobile swipe to navigate prev/next --------------------------
    // A flick left/right over the calendar surface steps to the next/prev
    // day/week/month, same as native calendar apps. Unlike Sidebar.tsx's
    // drawer swipe (which drags the panel live under the finger), this
    // only measures start->end on touchend — the directional slide-in
    // animation from handlePrev/handleNext already provides the visual
    // feedback, so there's no need to track every touchmove or transform
    // anything by hand. No preventDefault anywhere, so vertical scrolling
    // (e.g. Day view's hour grid) is never interfered with.
    const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
    const SWIPE_THRESHOLD_PX = 60;

    const handleGridTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleGridTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        const start = swipeStartRef.current;
        swipeStartRef.current = null;
        if (!start) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        // Require a clearly horizontal, deliberate gesture so a vertical
        // scroll or a plain tap never gets mistaken for a swipe.
        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
        if (deltaX < 0) handleNext();
        else handlePrev();
    };

    // --- Desktop keyboard navigation ----------------------------------
    // Scoped to the calendar surface itself (onKeyDown on the GRID AREA
    // container, which only fires while focus is inside it) rather than a
    // global window listener — the calendar stays mounted-but-hidden both
    // on mobile (Tasks tab active) and on desktop (Focus Mode), so a global
    // listener would keep firing even while invisible and could steal keys
    // from the search bar or task modal elsewhere on the page. This way, no
    // extra "is the calendar visible" bookkeeping is needed at all.
    const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                handlePrev();
                break;
            case "ArrowRight":
                e.preventDefault();
                handleNext();
                break;
            case "t":
            case "T":
                e.preventDefault();
                handleToday();
                break;
            case "d":
            case "D":
                e.preventDefault();
                changeView("day");
                break;
            case "w":
            case "W":
                e.preventDefault();
                changeView("week");
                break;
            case "m":
            case "M":
                e.preventDefault();
                changeView("month");
                break;
        }
    };

    const currentWeekDays = useMemo(() => {
        const date = new Date(currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(date);
        monday.setDate(diff);
        
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const subjectNameById = useMemo(() => {
        const map = new Map<number, string>();
        subjects.forEach(subject => map.set(subject.id, subject.name));
        return map;
    }, [subjects]);

    // The date span currently visible, used to fetch calendar-history data
    // for it (see the effect below). Month view only ever renders the
    // current month's own days (adjacent-month cells are blank, see
    // calendarCells below), so the range never needs to spill into
    // neighboring months.
    const historicalRange = useMemo(() => {
        if (view === "day") return { from: currentDate, to: currentDate };
        if (view === "week") return { from: currentWeekDays[0], to: currentWeekDays[6] };
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        return { from: new Date(currentYear, currentMonth, 1), to: new Date(currentYear, currentMonth, lastDayOfMonth) };
    }, [view, currentDate, currentWeekDays, currentYear, currentMonth]);

    // Fetches calendar history (pending + completed tasks, unlike `subjects`)
    // only when the visible range actually contains a past day — browsing
    // entirely future dates never needs it. `historyRefreshTick` forces a
    // refetch after a past-day task is created/updated/deleted/toggled from
    // the calendar itself, so the change shows up without a re-navigation.
    useEffect(() => {
        let cancelled = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!isDateInPast(historicalRange.from, today)) {
            setHistoricalTasks([]);
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await getTasksForDateRange(formatDateKey(historicalRange.from), formatDateKey(historicalRange.to));
                if (!cancelled) setHistoricalTasks(data);
            } catch (error) {
                console.error("Error loading calendar history:", error);
                if (!cancelled) setHistoricalTasks([]);
            }
        };
        fetchHistory();

        return () => { cancelled = true; };
    }, [historicalRange, historyRefreshTick]);

    // Calendar events for the visible range — unlike the task-history fetch
    // above, this always runs (past, present or future range alike), since
    // events have no separate "live" source the way today/future tasks have
    // `subjects`. `eventsRefreshTick` forces a refetch after a create/
    // update/delete reaches the calendar, same reasoning as
    // `historyRefreshTick`.
    useEffect(() => {
        let cancelled = false;
        const fetchEvents = async () => {
            try {
                const data = await getCalendarEventsForDateRange(formatDateKey(historicalRange.from), formatDateKey(historicalRange.to));
                if (!cancelled) setEvents(data);
            } catch (error) {
                console.error("Error loading calendar events:", error);
                if (!cancelled) setEvents([]);
            }
        };
        fetchEvents();
        return () => { cancelled = true; };
    }, [historicalRange, eventsRefreshTick]);

    // Per-day task lookup used everywhere below: `subjects` (live-synced,
    // but pending/completed-today only) for today/future, the fetched
    // calendar-history data for past days. `showTasks` is checked first,
    // ahead of the past/future branch — a single choke point (same shape
    // as `getSquareColor`'s `heatmapEnabled` check) that Day/Week/Month all
    // read through, so disabling it hides task content everywhere at once
    // without touching calendar navigation or the (separate) heatmap toggle.
    const getMergedTasksForDate = useCallback(
        (date: Date): CalendarTask[] => {
            if (!showTasks) return [];
            return isDateInPast(date, new Date())
                ? getHistoricalTasksForDate(historicalTasks, subjectNameById, date)
                : getTasksForDate(subjects, date);
        },
        [subjects, historicalTasks, subjectNameById, showTasks]
    );

    const tasksForCurrentDay = useMemo(
        () => getMergedTasksForDate(currentDate),
        [getMergedTasksForDate, currentDate]
    );

    const categoryById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

    const eventsForCurrentDay = useMemo(() => getEventsForDate(events, currentDate), [events, currentDate]);

    // Day view now spans the full 24h, so an empty midnight can't be the
    // first thing shown on open — scroll the shared hour container to the
    // current hour (today) or the old 8am default (any other day) whenever
    // Day view becomes active or the visible date changes. An empty day
    // scrolls to the very top instead, so its "day off" placeholder (pinned
    // near the top of the ruled-line column, see below) is actually visible
    // without the user having to scroll up first.
    const dayScrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (view !== "day" || !dayScrollRef.current) return;
        if (tasksForCurrentDay.length === 0 && eventsForCurrentDay.length === 0) {
            dayScrollRef.current.scrollTop = 0;
            return;
        }
        const isToday = currentDate.toDateString() === todayObj.toDateString();
        const targetHour = isToday ? todayObj.getHours() : 8;
        dayScrollRef.current.scrollTop = Math.max(0, (targetHour - 1) * 80);
        // todayObj is a fresh `new Date()` every render, not a stable value to
        // depend on — this should only re-run when the visible view/date (or
        // whether *this* day has any tasks/events) changes, not on every
        // unrelated re-render, which would fight the user's own manual
        // scrolling.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, currentDate, tasksForCurrentDay.length === 0, eventsForCurrentDay.length === 0]);

    // --- Day view: press-and-drag to create a timed event ------------
    // Google-Calendar-style click-and-drag on empty timeline space: press
    // down, drag, and the dragged span becomes the new event's start/end.
    // A plain click (no real drag) intentionally does nothing here, same
    // as today — only the hover "+" chooser creates from a single click.
    // Mouse-only by design, same as the chip drag-and-drop above: mobile
    // has no equivalent gesture here, and dragging out a precise time
    // range on a touchscreen with no live preview would be a poor
    // experience anyway.
    const dayTimelineRef = useRef<HTMLDivElement>(null);
    const [dayDragCreate, setDayDragCreate] = useState<{ startMinutes: number; currentMinutes: number } | null>(null);

    // Minutes since this day's midnight for a given viewport Y coordinate,
    // snapped to 15-minute increments (matching Google Calendar's own
    // default drag-snap granularity) and clamped to the visible 0-24h
    // range. Deliberately does NOT assume "80px === 1 hour" the way the
    // CSS-only positioning elsewhere in this file can (the "now" line,
    // renderDayEventBlock size themselves in `rem`, so they automatically
    // stay in sync with whatever the live root font-size is) — this runs
    // in JS against raw pixel mouse coordinates, and index.css's rule #3
    // shrinks the root font-size to 80% on desktop (a deliberate compact-
    // scale), so a real hour row renders at 64px there, not 80px. Dividing
    // the timeline's own measured height by its total minute span gets
    // the actual live px-per-minute regardless of that scale (or any
    // future change to DAY_VIEW_ROW_HEIGHT_REM), instead of baking in a
    // pixel constant that only happens to hold at the browser default
    // 16px root font-size (i.e. on mobile, where rule #3 doesn't apply).
    const minutesFromClientY = useCallback((clientY: number) => {
        const el = dayTimelineRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const totalMinutes = (DAY_VIEW_HOUR_END - DAY_VIEW_HOUR_START + 1) * 60;
        const pxPerMinute = rect.height / totalMinutes;
        const offsetY = clientY - rect.top;
        const rawMinutes = pxPerMinute > 0 ? offsetY / pxPerMinute : 0;
        const snapped = Math.round(rawMinutes / 15) * 15;
        return Math.min(Math.max(snapped, 0), totalMinutes);
    }, []);

    const handleTimelineMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        // Only a plain left-click drag; and never when it starts on a task
        // chip, an event block, or the "+" button — those need their own
        // click/native-drag behavior untouched (see each one's
        // data-drag-ignore attribute).
        if (e.button !== 0 || (e.target as HTMLElement).closest("[data-drag-ignore]")) return;

        const startMinutes = minutesFromClientY(e.clientY);
        setDayDragCreate({ startMinutes, currentMinutes: startMinutes });

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            setDayDragCreate(prev => prev && { ...prev, currentMinutes: minutesFromClientY(moveEvent.clientY) });
        };
        const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            setDayDragCreate(null);
            finalizeTimelineDrag(startMinutes, minutesFromClientY(upEvent.clientY));
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    // Shared by the mouse-drag path above and the touch path below: turns a
    // dragged [startMinutes, endMinutes] span into a create-event call.
    // Shorter than one snap step means this was a click/tap, not a real
    // drag — left a no-op rather than creating a zero-length event nobody
    // asked for.
    const finalizeTimelineDrag = (startMinutes: number, endMinutes: number) => {
        const lo = Math.min(startMinutes, endMinutes);
        const hi = Math.max(startMinutes, endMinutes);
        if (hi - lo < 15) return;
        const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        openCreateEventModal(new Date(dayStart.getTime() + lo * 60000), new Date(dayStart.getTime() + hi * 60000));
    };

    // --- Day view (mobile): tap to add, press-and-drag to create -----
    // Mirrors Month view's long-press disambiguation (a real scroll starts
    // the same touchstart as a deliberate hold, so a timer + move-threshold
    // tells them apart), but with a twist specific to this timeline: once
    // armed, the gesture *becomes* the mouse-drag path above (a live ghost
    // preview the user actively drags to size), rather than firing a single
    // action on its own. Lifting **before** arming, without ever moving
    // past the threshold, means a deliberate quick tap — that's what opens
    // the Task/Event chooser here (there is no per-hour "+" button on
    // touch, see its own comment above).
    const dayTouchCreateRef = useRef<{ startX: number; startY: number; startMinutes: number; timer: ReturnType<typeof setTimeout> | null; dragging: boolean } | null>(null);

    const handleTimelineTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("[data-drag-ignore]")) return;
        const touch = e.touches[0];
        const state = {
            startX: touch.clientX, startY: touch.clientY,
            startMinutes: minutesFromClientY(touch.clientY),
            dragging: false, timer: null as ReturnType<typeof setTimeout> | null,
        };
        state.timer = setTimeout(() => {
            state.timer = null;
            state.dragging = true;
            if (localStorage.getItem("taskFeedbackEnabled") !== "false") triggerHapticFeedback();
            setDayDragCreate({ startMinutes: state.startMinutes, currentMinutes: state.startMinutes });
        }, LONG_PRESS_MS);
        dayTouchCreateRef.current = state;
    };

    // A plain React onTouchMove prop is attached passively (React's own
    // default since v17, for scroll-performance reasons) — calling
    // preventDefault from inside one is a silent no-op, which would leave
    // the page scrolling underneath an already-armed drag-create gesture.
    // Attached manually as a real, non-passive listener below instead (see
    // the effect right after this), which is the only way to actually
    // suppress the native scroll once armed.
    const handleTimelineTouchMove = useCallback((e: globalThis.TouchEvent) => {
        const state = dayTouchCreateRef.current;
        if (!state) return;
        const touch = e.touches[0];
        if (!state.dragging) {
            // Not armed yet — real scrolling cancels the hold-timer and
            // lets the page scroll normally instead of hijacking it.
            if (Math.abs(touch.clientX - state.startX) > LONG_PRESS_MOVE_THRESHOLD_PX || Math.abs(touch.clientY - state.startY) > LONG_PRESS_MOVE_THRESHOLD_PX) {
                if (state.timer) clearTimeout(state.timer);
                dayTouchCreateRef.current = null;
            }
            return;
        }
        // Armed: this is now a drag-create gesture, taking over from the
        // page's own scroll for the remainder of this touch.
        e.preventDefault();
        setDayDragCreate(prev => prev && { ...prev, currentMinutes: minutesFromClientY(touch.clientY) });
    }, [minutesFromClientY]);

    // Day view's timeline column only exists in the DOM while `view ===
    // "day"` — re-attach whenever it (re)mounts. Not `{ passive: true }`
    // (the default for a plain addEventListener call too): this listener's
    // whole purpose is calling preventDefault once armed.
    useEffect(() => {
        const el = dayTimelineRef.current;
        if (!el) return;
        el.addEventListener("touchmove", handleTimelineTouchMove, { passive: false });
        return () => el.removeEventListener("touchmove", handleTimelineTouchMove);
    }, [view, handleTimelineTouchMove]);

    const handleTimelineTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        const state = dayTouchCreateRef.current;
        dayTouchCreateRef.current = null;
        if (!state) return;
        if (state.timer) clearTimeout(state.timer);

        if (!state.dragging) {
            const touch = e.changedTouches[0];
            const tapDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            tapDate.setMinutes(state.startMinutes);
            setAddChooser({ date: tapDate, rect: new DOMRect(touch.clientX, touch.clientY, 0, 0) });
            return;
        }

        setDayDragCreate(null);
        finalizeTimelineDrag(state.startMinutes, minutesFromClientY(e.changedTouches[0].clientY));
    };

    const handleTimelineTouchCancel = () => {
        const state = dayTouchCreateRef.current;
        dayTouchCreateRef.current = null;
        if (state?.timer) clearTimeout(state.timer);
        setDayDragCreate(null);
    };

    // One list per day of the visible week, for the Week view's per-day
    // task chips — same underlying filter as Day view, just run 7 times.
    const tasksByWeekDay = useMemo(
        () => currentWeekDays.map(date => getMergedTasksForDate(date)),
        [getMergedTasksForDate, currentWeekDays]
    );
    const eventsByWeekDay = useMemo(
        () => currentWeekDays.map(date => getEventsForDate(events, date)),
        [events, currentWeekDays]
    );

    // Buckets currentDate's tasks so Day view can actually place them on
    // the hourly grid instead of floating an unrelated list over it: tasks
    // with no time (deadline at midnight) go in an "all day" strip above
    // the grid, and timed tasks go in their hour's row — the grid now
    // covers the full 0-23 range, so every timed task lands in its own
    // real hour row.
    const { allDayTasks, timedTasksByHour } = useMemo(() => {
        const allDay: typeof tasksForCurrentDay = [];
        const byHour: Record<number, typeof tasksForCurrentDay> = {};
        for (const task of tasksForCurrentDay) {
            const d = new Date(task.deadline!);
            const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
            if (!hasTime) {
                allDay.push(task);
                continue;
            }
            (byHour[d.getHours()] ??= []).push(task);
        }
        return { allDayTasks: allDay, timedTasksByHour: byHour };
    }, [tasksForCurrentDay]);

    // allDay events go to the strip regardless of their stored time-of-day
    // (see CalendarEvent#allDay); everything else is a *timed* event, laid
    // out as a real duration-spanning block (layoutTimedEventsForDay) in
    // its own column next to the hourly grid — see renderDayEventBlock.
    const allDayEvents = useMemo(
        () => eventsForCurrentDay.filter(ev => ev.allDay),
        [eventsForCurrentDay]
    );
    const timedEventBlocks = useMemo(
        () => layoutTimedEventsForDay(eventsForCurrentDay, currentDate),
        [eventsForCurrentDay, currentDate]
    );

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

    const totalCellsNeeded = firstDayOfMonth + daysInMonth;
    const rowsNeeded = Math.ceil(totalCellsNeeded / 7);
    const totalCells = rowsNeeded * 7;

    const calendarCells = Array.from({ length: totalCells }, (_, i) => {
        const dayNumber = i - firstDayOfMonth + 1;
        return (dayNumber > 0 && dayNumber <= daysInMonth) ? dayNumber : null;
    });

    // Multi-day (and single-day all-day) events render as a continuous bar
    // spanning the grid columns they actually cover — like Google Calendar
    // — rather than a separate chip repeated in every day cell it touches.
    // Computed once per month render (not per cell): each event's
    // whole-day span (getEventDaySpan) is clipped to the visible month and
    // split into one segment per grid *row* it crosses (a banner wrapping
    // from one week to the next can't be one continuous DOM box across a
    // row break), then segments are greedily assigned a vertical "lane"
    // within their row so overlapping events stack instead of colliding —
    // same interval-graph approach as Day view's layoutTimedEventsForDay,
    // just column-based here instead of minute-based.
    const { monthEventSegments, monthRowLaneCounts } = useMemo(() => {
        const monthStartIdx = dayIndex(new Date(currentYear, currentMonth, 1));
        const monthEndIdx = dayIndex(new Date(currentYear, currentMonth, daysInMonth));

        type RawSegment = { event: CalendarEventResponse; row: number; colStart: number; colEnd: number; isStart: boolean; isEnd: boolean; spanStartIdx: number };
        const raw: RawSegment[] = [];

        for (const ev of events) {
            if (!ev.allDay) continue;
            const span = getEventDaySpan(ev);
            const clippedStart = Math.max(span.startDayIdx, monthStartIdx);
            const clippedEnd = Math.min(span.endDayIdx, monthEndIdx);
            if (clippedStart > clippedEnd) continue; // entirely outside the visible month

            let cursor = clippedStart;
            while (cursor <= clippedEnd) {
                const dayNum = cursor - monthStartIdx + 1; // 1-based day-of-month
                const cellIndex = firstDayOfMonth + (dayNum - 1);
                const row = Math.floor(cellIndex / 7);
                const colStart = cellIndex % 7;
                const roomInRow = 6 - colStart;
                const roomInSpan = clippedEnd - cursor;
                const extra = Math.min(roomInRow, roomInSpan);
                raw.push({
                    event: ev, row, colStart, colEnd: colStart + extra,
                    isStart: cursor === span.startDayIdx,
                    isEnd: cursor + extra === span.endDayIdx,
                    spanStartIdx: span.startDayIdx,
                });
                cursor += extra + 1;
            }
        }

        // Earlier-starting (and, as a tiebreak, longer) events claim lower
        // lanes first — processing order only affects lane *packing*
        // efficiency, never correctness: a lane is only reused once its
        // previous occupant's column range has fully ended.
        raw.sort((a, b) => a.spanStartIdx - b.spanStartIdx || (b.colEnd - b.colStart) - (a.colEnd - a.colStart));

        const rowLaneEnds: number[][] = [];
        const segments: MonthEventSegment[] = [];
        for (const seg of raw) {
            const lanes = (rowLaneEnds[seg.row] ??= []);
            let lane = lanes.findIndex(end => end < seg.colStart);
            if (lane === -1) lane = lanes.length;
            lanes[lane] = seg.colEnd;
            segments.push({ ...seg, lane });
        }

        return { monthEventSegments: segments, monthRowLaneCounts: rowLaneEnds.map(lanes => lanes.length) };
    }, [events, currentYear, currentMonth, firstDayOfMonth, daysInMonth]);

    // Day view's full title ("9 September 2026") is the one that overflows
    // its row on narrow screens and wraps to two lines — Month/Week's titles
    // already fit, so `headerTitleShort` only actually differs for Day
    // (abbreviated month), and just mirrors `headerTitle` otherwise.
    let headerTitle = "";
    let headerTitleShort = "";
    if (view === "month") {
        headerTitle = `${t.months[currentMonth]} ${currentYear}`;
        headerTitleShort = headerTitle;
    } else if (view === "week") {
        const first = currentWeekDays[0];
        const last = currentWeekDays[6];
        if (first.getMonth() === last.getMonth()) {
            headerTitle = `${first.getDate()} - ${last.getDate()} ${t.months[first.getMonth()]} ${first.getFullYear()}`;
        } else {
            headerTitle = `${first.getDate()} ${t.months[first.getMonth()].substring(0,3)} - ${last.getDate()} ${t.months[last.getMonth()].substring(0,3)} ${last.getFullYear()}`;
        }
        headerTitleShort = headerTitle;
    } else {
        headerTitle = `${currentDate.getDate()} ${t.months[currentDate.getMonth()]} ${currentYear}`;
        headerTitleShort = `${currentDate.getDate()} ${t.months[currentDate.getMonth()].substring(0,3)} ${currentYear}`;
    }

    const getSquareColor = (dateString: string) => {
        // Single choke point for the heatmap toggle: every call site (Month
        // and Week views) goes through this, so disabling it here is enough
        // — the "today"/"this week" tint overrides downstream still apply
        // on top of the neutral background this returns, since those read
        // as navigational cues rather than the completion-ratio heatmap
        // itself.
        if (!heatmapEnabled) return "bg-white dark:bg-gray-900";
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "bg-white dark:bg-gray-900"; 
        const ratio = record.completionRate;
        if (ratio === 0) return "bg-red-50 dark:bg-red-950/30";            
        if (ratio < 0.5) return "bg-[#eaf6ed] dark:bg-green-900/20";         
        if (ratio < 0.8) return "bg-[#4ade80] dark:bg-green-600";         
        return "bg-[#16a34a] dark:bg-green-500";                          
    };

    const hours = Array.from({ length: DAY_VIEW_HOUR_END - DAY_VIEW_HOUR_START + 1 }, (_, i) => i + DAY_VIEW_HOUR_START);

    // Shared between the "all day" strip and the hourly grid — one card
    // style, just placed in different containers.
    // Day view has the room for a real complete-toggle affordance, unlike
    // Month/Week's much smaller chips — scoped to Day view only for that
    // reason, matching TaskItem's own checkbox (red fill + white check)
    // rather than the calendar's own subject-color language, since it's
    // literally the same action just reached from a different screen.
    const renderCompleteToggle = (task: CalendarTask, size: "sm" | "xs") => {
        const dims = size === "sm" ? "w-4 h-4" : "w-3.5 h-3.5";
        const subjectColor = getSubjectColor(task.subjectId);
        return (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleTask(task.subjectId, task.id).then(refreshHistory); }}
                title={t.ttToggleComplete}
                aria-label={t.ttToggleComplete}
                className={`${dims} rounded-full border-2 shrink-0 flex items-center justify-center transition-all hover:scale-125 active:scale-90 ${
                    task.completed ? "bg-red-500 border-red-500" : `border-transparent ${subjectColor.dot} hover:brightness-90`
                }`}
            >
                {task.completed && <Check size={size === "sm" ? 10 : 8} className="text-white" strokeWidth={3} />}
            </button>
        );
    };

    const renderDayTaskCard = (task: CalendarTask, taskIdx = 0) => {
        const tDate = new Date(task.deadline!);
        const hasTime = tDate.getHours() !== 0 || tDate.getMinutes() !== 0;
        const timeString = hasTime
            ? tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : t.lblAllDay;
        const subjectColor = getSubjectColor(task.subjectId);

        return (
            <div
                key={task.id}
                draggable
                onDragStart={(e) => handleChipDragStart(e, task)}
                onDragEnd={handleChipDragEnd}
                title={task.title}
                onClick={() => openEditModal(task)}
                role="button"
                tabIndex={0}
                aria-label={`${task.subjectName} — ${task.title}`}
                onKeyDown={(e) => handleActivateKeyDown(e, () => openEditModal(task))}
                style={{ animationDelay: `${taskIdx * 40}ms` }}
                className={`animate-chip-in bg-white dark:bg-gray-800 border p-2 sm:p-3 rounded-xl shadow-sm flex items-start gap-2 sm:gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${
                    draggedTask?.id === task.id ? "opacity-30" : ""
                } ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800' : subjectColor.border}`}
            >
                <div className="mt-1">{renderCompleteToggle(task, "sm")}</div>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="flex items-center gap-1 min-w-0 text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider truncate transition-colors duration-300">
                            {/* Priority dot — separate color dimension from
                                this card's subject-colored border, see
                                priorityColors.ts. MEDIUM (the default) shows
                                nothing, same "opt-in, not on every task" rule
                                as TaskItem.tsx's badge. */}
                            {task.priority !== "MEDIUM" && (
                                <span title={priorityLabel(task.priority, t)} className={`shrink-0 w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority).dot}`} />
                            )}
                            <span className="truncate">{task.subjectName}</span>
                        </span>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0 transition-colors duration-300">
                            <Clock size={11} />
                            {timeString}
                        </div>
                    </div>
                    <h4 className={`text-sm font-bold truncate transition-colors duration-300 ${task.completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {task.title}
                    </h4>
                </div>
            </div>
        );
    };

    // A genuinely single-line variant for the hourly grid specifically —
    // each hour row is a fixed 80px (matching the ruled-line background
    // and the "now" indicator's math), and the full renderDayTaskCard
    // above doesn't fit two of itself in that space even with an overflow
    // fallback. This one comfortably fits 2-3 per row instead.
    const renderCompactHourTask = (task: CalendarTask, taskIdx = 0) => {
        const timeString = new Date(task.deadline!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const subjectColor = getSubjectColor(task.subjectId);
        return (
            <div
                key={task.id}
                data-drag-ignore
                draggable
                onDragStart={(e) => handleChipDragStart(e, task)}
                onDragEnd={handleChipDragEnd}
                title={`${task.subjectName} — ${task.title}`}
                onClick={() => openEditModal(task)}
                role="button"
                tabIndex={0}
                aria-label={`${task.subjectName} — ${task.title}`}
                onKeyDown={(e) => handleActivateKeyDown(e, () => openEditModal(task))}
                style={{ animationDelay: `${taskIdx * 40}ms` }}
                className={`animate-chip-in flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shrink-0 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm hover:-translate-y-px active:translate-y-0 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${
                    draggedTask?.id === task.id ? "opacity-30" : ""
                } ${
                    task.completed
                        ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-500 line-through'
                        : `${subjectColor.bg} ${subjectColor.border} text-gray-700 dark:text-gray-200`
                }`}
            >
                {renderCompleteToggle(task, "xs")}
                {task.priority !== "MEDIUM" && (
                    <span title={priorityLabel(task.priority, t)} className={`shrink-0 w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority).dot}`} />
                )}
                <span className="shrink-0 font-semibold text-gray-500 dark:text-gray-500">{timeString}</span>
                <span className="truncate font-medium">{task.title}</span>
            </div>
        );
    };

    // --- Calendar event renderers -------------------------------------
    // Deliberately *not* the same "tint bg + tint text" treatment
    // subjectColor gives tasks (which gets away with it because it only
    // ever draws from 8 hand-picked, contrast-checked shades) — a
    // category's color is arbitrary user-picked hex with no guaranteed
    // light/dark-mode-safe text variant, and text set in a raw, fully-
    // saturated hue reads as loud/unrefined next to this app's otherwise
    // muted, restrained palette. So every event surface below keeps text
    // neutral (the same gray scale task cards use) and spends the
    // category color only on accents: a left border, a small dot, and a
    // very soft tinted background (`${color}0d`/`${color}14`, ~5-8% alpha
    // — noticeably quieter than a task chip's own ~15% tint, since an
    // event's color-coding is a secondary cue here, not its primary
    // identity the way a subject's color is for a task).
    const renderMonthEventChip = (event: CalendarEventResponse, evIdx = 0) => {
        const color = (event.categoryId && categoryById.get(event.categoryId)?.color) || DEFAULT_EVENT_COLOR;
        return (
            <div
                key={`ev-${event.id}`}
                title={event.title}
                onClick={(e) => { e.stopPropagation(); openEditEventModal(event); }}
                role="button"
                tabIndex={0}
                aria-label={event.title}
                onKeyDown={(e) => { e.stopPropagation(); handleActivateKeyDown(e, () => openEditEventModal(event)); }}
                style={{ animationDelay: `${evIdx * 40}ms`, backgroundColor: `${color}0d`, borderColor: color }}
                className="animate-chip-in text-[8px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded truncate text-gray-600 dark:text-gray-300 transition-all hover:brightness-95 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 border-l-2"
            >
                {event.title}
            </div>
        );
    };

    // Continuous Month-view banner for an all-day (or multi-day) event —
    // an explicit CSS Grid placement (gridColumn/gridRow) rather than a
    // per-cell chip, so a multi-day span reads as one unbroken bar across
    // the columns it covers. Rendered as an *additional* child of the same
    // `grid-cols-7` container the day cells themselves live in (CSS Grid
    // happily lets multiple items share/overlap grid areas), positioned
    // via `self-start` + a fixed `marginTop` that clears the day-number
    // badge, stacked per `lane` when more than one event shares a row —
    // the day cells reserve matching empty space for this via their own
    // lane-count spacer (see monthRowLaneCounts).
    const renderMonthEventBanner = (seg: MonthEventSegment) => {
        const { event, row, colStart, colEnd, lane, isStart, isEnd } = seg;
        const color = (event.categoryId && categoryById.get(event.categoryId)?.color) || DEFAULT_EVENT_COLOR;
        return (
            <div
                key={`banner-${event.id}-${row}`}
                title={event.title}
                onClick={(e) => { e.stopPropagation(); openEditEventModal(event); }}
                role="button"
                tabIndex={0}
                aria-label={event.title}
                onKeyDown={(e) => { e.stopPropagation(); handleActivateKeyDown(e, () => openEditEventModal(event)); }}
                style={{
                    gridColumn: `${colStart + 1} / ${colEnd + 2}`,
                    gridRow: `${row + 1} / ${row + 2}`,
                    marginTop: `calc(1.9rem + ${lane} * 1.15rem)`,
                    backgroundColor: `${color}14`,
                    borderColor: color,
                }}
                className={`self-start z-10 mx-0.5 h-4 sm:h-[1.1rem] flex items-center px-1 text-[8px] sm:text-[9px] font-medium text-gray-600 dark:text-gray-300 truncate border-l-2 cursor-pointer transition-all hover:brightness-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${isStart ? "rounded-l" : ""} ${isEnd ? "rounded-r" : ""}`}
            >
                {isStart && <span className="truncate">{event.title}</span>}
            </div>
        );
    };

    const renderWeekEventCard = (event: CalendarEventResponse, evIdx = 0) => {
        const color = (event.categoryId && categoryById.get(event.categoryId)?.color) || DEFAULT_EVENT_COLOR;
        const timeString = event.allDay ? t.lblAllDay : new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
            <div
                key={`ev-${event.id}`}
                title={event.title}
                onClick={(e) => { e.stopPropagation(); openEditEventModal(event); }}
                role="button"
                tabIndex={0}
                aria-label={event.title}
                onKeyDown={(e) => { e.stopPropagation(); handleActivateKeyDown(e, () => openEditEventModal(event)); }}
                style={{ animationDelay: `${evIdx * 40}ms`, backgroundColor: `${color}0d`, borderColor: color }}
                className="animate-chip-in flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border-l-2 text-[9px] sm:text-[10px] font-medium text-gray-600 dark:text-gray-300 shrink-0 shadow-sm transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500"
            >
                <span className="shrink-0 opacity-60 tabular-nums">{timeString}</span>
                <span className="truncate">{event.title}</span>
            </div>
        );
    };

    const renderDayEventCard = (event: CalendarEventResponse, evIdx = 0) => {
        const category = event.categoryId ? categoryById.get(event.categoryId) : undefined;
        const color = category?.color ?? DEFAULT_EVENT_COLOR;
        const timeString = event.allDay
            ? t.lblAllDay
            : `${new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${new Date(event.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return (
            <div
                key={`ev-${event.id}`}
                title={event.title}
                onClick={() => openEditEventModal(event)}
                role="button"
                tabIndex={0}
                aria-label={event.title}
                onKeyDown={(e) => handleActivateKeyDown(e, () => openEditEventModal(event))}
                style={{ animationDelay: `${evIdx * 40}ms`, borderColor: color }}
                className="animate-chip-in bg-white dark:bg-gray-800 border p-2 sm:p-3 rounded-xl shadow-sm flex items-start gap-2 sm:gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500"
            >
                <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="truncate text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                            {category?.name ?? t.noCategory}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                            <Clock size={11} />
                            {timeString}
                        </div>
                    </div>
                    <h4 className="text-sm font-bold truncate text-gray-800 dark:text-gray-200">{event.title}</h4>
                </div>
            </div>
        );
    };

    // Google-Calendar-style spanning block for a timed event: absolutely
    // positioned by real start/duration (layoutTimedEventsForDay already
    // did the minute-math and overlap/column assignment) directly inside
    // the SAME column the hour rows/task chips live in — not a separate
    // lane — so it visually occupies its actual time slot on the shared
    // timeline. That parent column (`relative z-20`, spanning the full
    // width of the day's own ruled-line column — see the JSX just above)
    // has no padding of its own, so unlike the "now"
    // line elsewhere in this file, `top` needs no padding-box offset added
    // back in — plain rem values line up with the hour rows directly.
    //
    // No explicit z-index here on purpose: every hour row below is given
    // `relative` (z-index:auto), and — per CSS stacking rules — among
    // sibling positioned elements with equal/auto z-index, the one later in
    // DOM order paints on top. These blocks are rendered *before* the hour
    // rows in the JSX, so every row (and the task chip/"+"-button inside
    // it) naturally paints above an event block behind it; a row's own
    // background is transparent everywhere except where a chip/button
    // actually sits, so the event's color still shows through the rest of
    // that hour. This is the deliberate "task overlaps the event" layering
    // the user asked for, mirroring Google Calendar's own Day view.
    const renderDayEventBlock = (block: DayEventBlock) => {
        const { event, start, end, startMinutes, endMinutes, col, totalCols } = block;
        const category = event.categoryId ? categoryById.get(event.categoryId) : undefined;
        const color = category?.color ?? DEFAULT_EVENT_COLOR;
        const topRem = (startMinutes / 60) * DAY_VIEW_ROW_HEIGHT_REM;
        const heightRem = Math.max(MIN_EVENT_BLOCK_HEIGHT_REM, ((endMinutes - startMinutes) / 60) * DAY_VIEW_ROW_HEIGHT_REM);
        const timeString = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        // A small px gutter between side-by-side columns (when events
        // overlap each other) — subtracted from width/added to left so
        // blocks never visually touch. Irrelevant (totalCols === 1) for the
        // common case of a lone event, which then spans the full column.
        const gapPx = 3;

        return (
            <div
                key={`ev-block-${event.id}`}
                data-drag-ignore
                title={`${event.title} (${timeString})`}
                onClick={() => openEditEventModal(event)}
                role="button"
                tabIndex={0}
                aria-label={`${event.title} — ${timeString}`}
                onKeyDown={(e) => handleActivateKeyDown(e, () => openEditEventModal(event))}
                style={{
                    top: `${topRem}rem`,
                    height: `${heightRem}rem`,
                    left: `calc(${(col / totalCols) * 100}% + ${col === 0 ? 0 : gapPx}px)`,
                    width: `calc(${100 / totalCols}% - ${gapPx}px)`,
                    backgroundColor: `${color}14`,
                    borderColor: color,
                }}
                className="animate-chip-in absolute rounded-lg border-l-4 px-1.5 py-1 shadow-sm overflow-hidden cursor-pointer text-gray-800 dark:text-gray-100 transition-all hover:shadow-md hover:brightness-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500"
            >
                <div className="text-[10px] sm:text-xs font-semibold truncate leading-tight">{event.title}</div>
                {heightRem > 2 && (
                    <div className="text-[9px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">{timeString}</div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 p-3 sm:p-8 overflow-hidden">

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-y-2 mb-4 sm:mb-8 shrink-0">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight capitalize whitespace-nowrap sm:min-w-[280px] transition-colors duration-300">
                        <span className="sm:hidden">{headerTitleShort}</span>
                        <span className="hidden sm:inline">{headerTitle}</span>
                    </h1>

                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <button onClick={handlePrev} aria-label={t.prevPeriod} title={t.prevPeriod} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md text-gray-500 dark:text-gray-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={handleToday} className="px-2 sm:px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-md transition-all">
                            {t.btnToday}
                        </button>
                        <button onClick={handleNext} aria-label={t.nextPeriod} title={t.nextPeriod} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md text-gray-500 dark:text-gray-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500">
                            <ChevronRight size={20} />
                        </button>
                        <div className="relative w-px self-stretch bg-gray-100 dark:bg-gray-800 mx-0.5" />
                        <div className="relative">
                            <button
                                onClick={() => setDatePickerOpen(o => !o)}
                                title={t.jumpToDate}
                                aria-label={t.jumpToDate}
                                className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md transition-all ${datePickerOpen ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                            >
                                <CalendarDays size={18} />
                            </button>
                            {datePickerOpen && (
                                <DatePickerPopover
                                    selectedDate={currentDate}
                                    onSelect={handleJumpToDate}
                                    onClose={() => setDatePickerOpen(false)}
                                    weekDays={t.weekDays}
                                    months={t.months}
                                    prevMonthLabel={t.prevMonth}
                                    nextMonthLabel={t.nextMonth}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sliding pill: one animated background layer that glides between
                    the three buttons instead of each button getting its own
                    background flipped on/off — reads as a single continuous
                    selection rather than a state swap. Its `left`/`width` are
                    measured off the real button DOM node (`measurePill`
                    above), never assumed from a `calc()`-based "each button is
                    exactly 1/3" guess — that approach (tried first,
                    2026-09-10) still drifted a pixel or two out of sync with
                    flexbox's own fractional-width rounding, which reads as
                    the pill's edges landing asymmetrically around the label
                    even with all three buttons genuinely equal-width. Kept
                    the buttons `flex-1` regardless (equal width still looks
                    cleaner and keeps the three measured widths close), but
                    the pill no longer trusts that assumption for its own
                    geometry. `opacity-0` until the first real measurement
                    lands (`pillRect` starts `null`) avoids a flash at (0,0)
                    on mount. */}
                <div ref={viewSelectorRef} className="relative flex w-full sm:w-auto bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div
                        aria-hidden="true"
                        className={`absolute top-1 bottom-1 rounded-lg bg-red-50 dark:bg-red-900/30 shadow-sm transition-all duration-300 ease-out ${pillRect ? "opacity-100" : "opacity-0"}`}
                        style={{
                            left: pillRect?.left ?? 0,
                            width: pillRect?.width ?? 0,
                        }}
                    />
                    {VIEW_ORDER.map((v) => (
                        <button
                            key={v}
                            ref={(el) => { viewButtonRefs.current[v] = el; }}
                            onClick={() => changeView(v)}
                            className={`relative z-10 flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${view === v ? "text-red-700 dark:text-red-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                        >
                            {v === "day" ? t.btnDay : v === "week" ? t.btnWeek : t.btnMonth}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- GRID AREA --- */}
            <div
                tabIndex={0}
                onTouchStart={handleGridTouchStart}
                onTouchEnd={handleGridTouchEnd}
                onTouchCancel={() => { swipeStartRef.current = null; }}
                onKeyDown={handleGridKeyDown}
                className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col relative transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 dark:focus-visible:ring-red-500/50"
            >

                {/* Remounted (via `key`) on every view switch, prev/next, jump,
                    or drill-down click — the CSS keyframe on the matching
                    animate-* class auto-plays on mount, same trick as
                    animate-soft-fade elsewhere, no isVisible toggle needed. */}
                <div
                    key={`${view}-${currentDate.getTime()}`}
                    className={`flex-1 flex flex-col overflow-hidden ${
                        transitionVariant === "next" ? "animate-slide-in-right" : transitionVariant === "prev" ? "animate-slide-in-left" : "animate-soft-fade"
                    }`}
                >

                {/* --- VIEW: MONTH --- */}
                {view === "month" && (
                    <>
                        {/* gap-1.5 + px-1.5 mirror the body grid below (gap-1.5 p-1.5) so
                            both grids compute identical column widths — see the same note
                            on Week view's header for why this matters. */}
                        <div className="grid grid-cols-7 gap-1.5 px-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {t.weekDays.map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">{day.substring(0,3)}</div>
                            ))}
                        </div>
                        {/* A soft gutter + rounded tiles instead of hairline grid rules —
                            the gap background is just the page's own resting tone showing
                            through, not a drawn border, so cells read as separated cards
                            rather than a ruled spreadsheet grid. */}
                        <div className="flex-1 grid grid-cols-7 bg-gray-100/60 dark:bg-gray-950/40 gap-1.5 p-1.5 transition-colors duration-300" style={{ gridTemplateRows: `repeat(${rowsNeeded}, minmax(0, 1fr))` }}>
                            {calendarCells.map((dayNum, i) => {
                                // Every cell gets an explicit grid position, not just the
                                // event banners (see monthEventSegments/renderMonthEventBanner):
                                // CSS Grid's auto-placement algorithm places explicitly-positioned
                                // items first and then has auto-placed items *skip* any cell an
                                // explicit item already occupies — since the banners share this
                                // same grid-cols-7 container and use explicit gridColumn/gridRow,
                                // leaving day cells on auto-placement caused them to visibly shift
                                // out of their real weekday column whenever a banner sat on that
                                // day (discovered from a report of events appearing 1-2 days off).
                                const cellGridStyle = { gridColumn: (i % 7) + 1, gridRow: Math.floor(i / 7) + 1 };
                                if (!dayNum) return <div key={i} style={cellGridStyle} className="bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3 transition-colors duration-300" />;

                                const cellDateObj = new Date(currentYear, currentMonth, dayNum);
                                const isToday = cellDateObj.toDateString() === todayObj.toDateString();
                                const isPast = cellDateObj < todayObj && !isToday;
                                
                                const cellDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                
                                // While the heatmap is still loading, past/today cells (the
                                // only ones that depend on it) get a pulsing skeleton tile
                                // instead of silently rendering as "no data" — a skeleton
                                // shaped like the real content, per this app's own loading-
                                // state convention (DashboardSkeleton.tsx), rather than a
                                // blur+spinner overlay on top of an otherwise-ready grid.
                                let bgColorClass: string;
                                if ((isPast || isToday) && loadingRecords) {
                                    bgColorClass = "bg-gray-100 dark:bg-gray-800/60 animate-pulse";
                                } else {
                                    bgColorClass = isPast || isToday ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                    if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                        bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                    }
                                    // A faint "this week" tint for cells that would otherwise
                                    // render as the plain blank/no-data background — only
                                    // overrides that default, never a heatmap-driven color, so
                                    // it groups the current week visually without competing
                                    // with the completion-rate colors.
                                    if (bgColorClass === "bg-white dark:bg-gray-900" && cellDateObj >= todayWeekStart && cellDateObj <= todayWeekEnd) {
                                        bgColorClass = "bg-gray-50/70 dark:bg-gray-800/40";
                                    }
                                }

                                // getMergedTasksForDate covers both today/future (from
                                // `subjects`, live-synced) and past days (from the fetched
                                // calendar-history data, which — unlike `subjects` — includes
                                // completed tasks).
                                const dayTasks = getMergedTasksForDate(cellDateObj);
                                // All-day events render as continuous banners (see
                                // monthEventSegments/renderMonthEventBanner) instead of a
                                // per-cell chip — only non-all-day events still use the
                                // plain chip list below.
                                const dayEvents = getEventsForDate(events, cellDateObj).filter(ev => !ev.allDay);
                                const monthRow = Math.floor(i / 7);
                                const monthRowLanes = monthRowLaneCounts[monthRow] ?? 0;

                                const monthCellKey = `month-${cellDateString}`;
                                return (
                                    <div
                                        key={i}
                                        style={cellGridStyle}
                                        onClick={() => jumpToDay(cellDateObj)}
                                        onDragOver={(e) => handleDropZoneDragOver(e, monthCellKey)}
                                        onDragLeave={() => handleDropZoneDragLeave(monthCellKey)}
                                        onDrop={(e) => handleDayCellDrop(e, cellDateObj)}
                                        onTouchStart={(e) => handleMonthCellTouchStart(e, cellDateObj)}
                                        onTouchMove={handleMonthCellTouchMove}
                                        onTouchEnd={clearMonthLongPress}
                                        onTouchCancel={clearMonthLongPress}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={cellDateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                                        onKeyDown={(e) => handleActivateKeyDown(e, () => jumpToDay(cellDateObj))}
                                        className={`${bgColorClass} rounded-lg p-1 sm:p-2 flex flex-col transition-all hover:brightness-95 dark:hover:brightness-110 hover:shadow-md hover:z-20 cursor-pointer relative group outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 no-hover:select-none no-hover:[-webkit-touch-callout:none] ${isToday ? "z-10" : ""} ${
                                            dragOverKey === monthCellKey ? "z-20 ring-2 ring-inset ring-red-400 dark:ring-red-500" : ""
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm" : bgColorClass.includes("bg-[#4ade80]") || bgColorClass.includes("bg-[#16a34a]") ? "text-white drop-shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                                                {dayNum}
                                            </span>
                                            {/* Desktop only — on touch, a plain tap opens the day
                                                (jumpToDay), so the "+" chooser is only reachable via
                                                the long-press handlers on the cell itself. */}
                                            <button
                                                onClick={(e) => openAddChooser(e, cellDateObj)}
                                                title={t.addTaskTitle}
                                                aria-label={t.addTaskTitle}
                                                className="hidden can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:block focus:opacity-100 focus:block p-0.5 sm:p-1 rounded-md bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:scale-110 active:scale-90 shadow-sm transition-all"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        {/* Reserves the exact vertical space renderMonthEventBanner's
                                            lanes occupy in this row (a fixed-height spacer, not the
                                            banners themselves — those are separate grid-overlay
                                            elements, see monthEventSegments) so today's own tasks/
                                            event chips never render underneath a banner. */}
                                        {monthRowLanes > 0 && <div style={{ height: `${monthRowLanes * 1.15}rem` }} className="shrink-0" />}
                                        {dayTasks.length > 0 ? (
                                            <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 overflow-y-auto no-scrollbar">
                                                {dayTasks.slice(0, 2).map((task, taskIdx) => {
                                                    const subjectColor = getSubjectColor(task.subjectId);
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable
                                                            onDragStart={(e) => handleChipDragStart(e, task)}
                                                            onDragEnd={handleChipDragEnd}
                                                            title={`${task.subjectName} — ${task.title} (${priorityLabel(task.priority, t)})`}
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`${task.subjectName} — ${task.title}`}
                                                            onKeyDown={(e) => { e.stopPropagation(); handleActivateKeyDown(e, () => openEditModal(task)); }}
                                                            style={{ animationDelay: `${taskIdx * 40}ms` }}
                                                            // Priority reads here as a left border accent (border-l-2)
                                                            // rather than a separate dot element — these chips are too
                                                            // small (text-[8px]) to spare the width for one.
                                                            className={`animate-chip-in text-[8px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing transition-all hover:brightness-95 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 border-l-2 ${
                                                                draggedTask?.id === task.id ? "opacity-30" : ""
                                                            } ${
                                                                task.completed
                                                                    ? "bg-white/60 dark:bg-gray-900/60 text-gray-500 dark:text-gray-500 line-through border-transparent"
                                                                    : `${subjectColor.bg} ${subjectColor.text} ${task.priority === "MEDIUM" ? "border-transparent" : getPriorityColor(task.priority).border}`
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > 2 && (
                                                    <span
                                                        onMouseEnter={(e) => { e.stopPropagation(); setMorePopover({ tasks: dayTasks, rect: e.currentTarget.getBoundingClientRect() }); }}
                                                        onMouseLeave={() => setMorePopover(null)}
                                                        className="hidden sm:inline text-[9px] text-gray-500 dark:text-gray-500 font-bold px-1 hover:text-gray-600 dark:hover:text-gray-300 cursor-default"
                                                    >
                                                        +{dayTasks.length - 2} {t.moreTasks}
                                                    </span>
                                                )}
                                            </div>
                                        ) : null}
                                        {dayEvents.length > 0 && (
                                            <div className="flex flex-col gap-0.5 sm:gap-1 mt-0.5">
                                                {dayEvents.slice(0, 2).map((ev, evIdx) => renderMonthEventChip(ev, evIdx))}
                                                {dayEvents.length > 2 && (
                                                    <span className="hidden sm:inline text-[9px] text-gray-500 dark:text-gray-500 font-bold px-1">
                                                        +{dayEvents.length - 2} {t.moreEvents}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {/* Continuous all-day/multi-day banners — additional children
                                of this same grid-cols-7 container, placed via explicit
                                gridColumn/gridRow so a span reads as one unbroken bar
                                across the day cells above/below it (CSS Grid allows
                                multiple items to share a grid area; see
                                renderMonthEventBanner for the stacking/z-index reasoning). */}
                            {monthEventSegments.map(seg => renderMonthEventBanner(seg))}
                        </div>
                    </>
                )}

                {/* --- VIEW: WEEK --- */}
                {view === "week" && (
                    <div className="flex-1 flex flex-col">
                        {/* gap-1.5 + px-1.5 here deliberately mirror the body grid below
                            (same gap-1.5 p-1.5) so both grids compute identical column
                            widths — without this, the header's 7 columns (full width,
                            no gap) and the body's 7 columns (narrowed by the gap+padding)
                            drift out of alignment further at each column to the right. */}
                        <div className="grid grid-cols-7 gap-1.5 px-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                return (
                                    <div key={i} className={`py-2 sm:py-4 flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${isToday ? "bg-red-50/50 dark:bg-red-900/20" : ""}`}>
                                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isToday ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-500"}`}>
                                            {t.weekDays[i].substring(0,3)}
                                        </span>
                                        <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-base sm:text-xl font-black transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm mt-0.5" : "text-gray-800 dark:text-gray-200"}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex-1 grid grid-cols-7 bg-gray-100/60 dark:bg-gray-950/40 gap-1.5 p-1.5 transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                const cellDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                
                                let bgColorClass: string;
                                if ((date < todayObj || isToday) && loadingRecords) {
                                    bgColorClass = "bg-gray-100 dark:bg-gray-800/60 animate-pulse";
                                } else {
                                    bgColorClass = (date < todayObj || isToday) ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                    if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                        bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                    }
                                }
                                
                                const dayTasks = tasksByWeekDay[i];
                                const dayEvents = eventsByWeekDay[i];
                                const weekCellKey = `week-${cellDateString}`;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => jumpToDay(date)}
                                        onDragOver={(e) => handleDropZoneDragOver(e, weekCellKey)}
                                        onDragLeave={() => handleDropZoneDragLeave(weekCellKey)}
                                        onDrop={(e) => handleDayCellDrop(e, date)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                                        onKeyDown={(e) => handleActivateKeyDown(e, () => jumpToDay(date))}
                                        className={`${bgColorClass} rounded-xl p-1.5 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 overflow-y-auto no-scrollbar cursor-pointer transition-all hover:brightness-95 dark:hover:brightness-110 hover:shadow-md hover:z-20 outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 relative group ${
                                            dragOverKey === weekCellKey ? "z-20 ring-2 ring-inset ring-red-400 dark:ring-red-500" : ""
                                        }`}
                                    >
                                        <button
                                            onClick={(e) => openAddChooser(e, date)}
                                            title={t.addTaskTitle}
                                            aria-label={t.addTaskTitle}
                                            className="absolute top-1 right-1 can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100 no-hover:opacity-100 p-0.5 sm:p-1 rounded-md bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:scale-110 active:scale-90 shadow-sm transition-all z-10"
                                        >
                                            <Plus size={12} />
                                        </button>
                                        {dayTasks.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <span className="hidden sm:inline text-[10px] text-gray-300 dark:text-gray-600 font-medium">{t.dayOffTitle}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Week's cells are far taller than Month's (one row instead of
                                                    up to six), so each task gets a real card instead of Month's
                                                    plain truncated-text chip: the same soft subject-tinted
                                                    bg/text identity as before, plus a priority-colored left
                                                    border *and* a matching dot (redundant on purpose — a quick
                                                    color glance and an explicit marker), plus the time. */}
                                                {dayTasks.slice(0, WEEK_CELL_TASK_LIMIT).map((task, taskIdx) => {
                                                    const subjectColor = getSubjectColor(task.subjectId);
                                                    const tDate = new Date(task.deadline!);
                                                    const hasTime = tDate.getHours() !== 0 || tDate.getMinutes() !== 0;
                                                    const timeString = hasTime ? tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable
                                                            onDragStart={(e) => handleChipDragStart(e, task)}
                                                            onDragEnd={handleChipDragEnd}
                                                            title={`${task.subjectName} — ${task.title} (${priorityLabel(task.priority, t)})`}
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`${task.subjectName} — ${task.title}`}
                                                            onKeyDown={(e) => { e.stopPropagation(); handleActivateKeyDown(e, () => openEditModal(task)); }}
                                                            style={{ animationDelay: `${taskIdx * 40}ms` }}
                                                            className={`animate-chip-in flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border-l-2 text-[9px] sm:text-[10px] font-semibold shrink-0 cursor-grab active:cursor-grabbing shadow-sm transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${
                                                                draggedTask?.id === task.id ? "opacity-30" : ""
                                                            } ${
                                                                task.completed
                                                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 line-through border-transparent shadow-none"
                                                                    : `${subjectColor.bg} ${subjectColor.text} ${task.priority === "MEDIUM" ? "border-transparent" : getPriorityColor(task.priority).border}`
                                                            }`}
                                                        >
                                                            {task.priority !== "MEDIUM" && !task.completed && (
                                                                <span title={priorityLabel(task.priority, t)} className={`shrink-0 w-1.5 h-1.5 rounded-full ${getPriorityColor(task.priority).dot}`} />
                                                            )}
                                                            {timeString && (
                                                                <span className="shrink-0 opacity-70 tabular-nums">{timeString}</span>
                                                            )}
                                                            <span className="truncate">{task.title}</span>
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > WEEK_CELL_TASK_LIMIT && (
                                                    <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 font-bold px-1">
                                                        +{dayTasks.length - WEEK_CELL_TASK_LIMIT} {t.moreTasks}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {dayEvents.length > 0 && (
                                            <>
                                                {dayEvents.slice(0, WEEK_CELL_TASK_LIMIT).map((ev, evIdx) => renderWeekEventCard(ev, evIdx))}
                                                {dayEvents.length > WEEK_CELL_TASK_LIMIT && (
                                                    <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 font-bold px-1">
                                                        +{dayEvents.length - WEEK_CELL_TASK_LIMIT} {t.moreEvents}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- VIEW: DAY --- */}
                {view === "day" && (
                    <div className="flex-1 flex flex-col overflow-hidden">

                        {/* All-day tasks (no specific time) sit above the hourly
                            grid, calendar-convention style, instead of being
                            squeezed into a midnight row. */}
                        {(allDayTasks.length > 0 || allDayEvents.length > 0) && (
                            <div
                                onDragOver={(e) => handleDropZoneDragOver(e, "allday")}
                                onDragLeave={() => handleDropZoneDragLeave("allday")}
                                onDrop={handleAllDayDrop}
                                className={`shrink-0 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-2 sm:p-3 flex flex-col gap-1.5 transition-colors duration-300 ${
                                    dragOverKey === "allday" ? "ring-2 ring-inset ring-red-400 dark:ring-red-500" : ""
                                }`}
                            >
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-1">{t.lblAllDay}</span>
                                {allDayTasks.map((task, taskIdx) => renderDayTaskCard(task, taskIdx))}
                                {allDayEvents.map((ev, evIdx) => renderDayEventCard(ev, evIdx))}
                            </div>
                        )}

                        {/* Both columns below share this ONE scroll container rather
                            than each scrolling independently — two separate
                            overflow-y-auto elements that are supposed to stay
                            row-aligned can drift out of sync (they did, visibly,
                            once tasks were actually placed per-hour-row). */}
                        <div ref={dayScrollRef} className="flex-1 flex overflow-y-auto">
                            {/* self-start on both columns below: without it, flexbox's default
                                align-items:stretch caps each column's own box at the scroll
                                container's *visible* height (the only definite height available
                                here), not its full 24-row content height — the row divs still
                                render past that point (block children overflow a visible-overflow
                                box just fine), but the column's own background paints only up to
                                that capped box, so the grey label backdrop and the ruled-line
                                gradient both stop partway down while the hour numbers keep
                                appearing past them. self-start sizes each column to its natural
                                content height instead, so the backgrounds cover every row. */}
                            <div className="w-12 sm:w-20 self-start border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 pt-3 sm:pt-6 pb-3 sm:pb-6 flex flex-col shrink-0 transition-colors duration-300">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 shrink-0 flex justify-end pr-1.5 sm:pr-4 text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-500 relative transition-colors duration-300">
                                        <span className="-mt-2">{hour.toString().padStart(2, '0')}:00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Notebook-style ruled lines, adapted to #1f2937 (gray-800) in dark mode.
                                bg-origin-content anchors the tiled pattern to the content box (i.e.
                                right after the p-3/sm:p-6 padding) instead of the default padding-box
                                origin (the box's outer edge) — otherwise the ruled lines start above
                                where the hour rows actually begin and drift out of sync with them. */}
                            <div className="flex-1 self-start relative bg-[linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] dark:bg-[linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:100%_5rem] bg-origin-content p-3 sm:p-6 transition-colors duration-300">

                                {currentDate.toDateString() === todayObj.toDateString() && (
                                    <div
                                        // z-40, above the z-20 tasks/events column right below —
                                        // the current-time line is a navigational cue that should
                                        // always read as on top of everything else in Day view,
                                        // including a timed event's own colored block spanning
                                        // across it.
                                        className="absolute left-0 right-0 top-[calc(0.75rem+var(--now-offset))] sm:top-[calc(1.5rem+var(--now-offset))] border-t-2 border-red-500 z-40 pointer-events-none"
                                        style={{ "--now-offset": `${((todayObj.getHours() - DAY_VIEW_HOUR_START) * 5) + (todayObj.getMinutes() / 12)}rem` } as CSSProperties}
                                    >
                                        {/* Centered exactly ON the line's own (0,0) corner via
                                            translate, not `flex items-center` — centering within
                                            a flex container only lines the dot up with the border
                                            line when the container's own box height happens to
                                            equal the dot's height; here it didn't, so the dot sat
                                            visibly below the line instead of on it (fixed
                                            2026-09-09). translate(-50%,-50%) centers on the exact
                                            point regardless of any box-height coincidence. */}
                                        <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3">
                                            <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
                                            <div className="absolute inset-0 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 transition-colors duration-300" />
                                        </div>
                                    </div>
                                )}

                                {/* Always render the full 24-row grid — including on an empty
                                    day — rather than swapping it out for a small placeholder
                                    box. Swapping it out used to make this column's own natural
                                    content height collapse to just that placeholder's height on
                                    empty days (self-start sizes each column to its *own*
                                    content, see the note above), so only days with at least one
                                    task got a full-height ruled-line/grey-column background —
                                    empty days, cut short, alternated with task-filled ones as
                                    the user paged through the week (fixed 2026-09-09). Keeping
                                    the grid also means an empty day still gets working
                                    hour-row drop zones and "+" buttons instead of only the one
                                    generic "add task" affordance the placeholder had. */}
                                <div
                                    ref={dayTimelineRef}
                                    onMouseDown={handleTimelineMouseDown}
                                    onTouchStart={handleTimelineTouchStart}
                                    onTouchEnd={handleTimelineTouchEnd}
                                    onTouchCancel={handleTimelineTouchCancel}
                                    className="relative z-20 cursor-crosshair no-hover:select-none no-hover:[-webkit-touch-callout:none]"
                                >
                                    {/* Timed-event blocks share this exact column with the hour
                                        rows below (not a separate lane) — rendered first in DOM,
                                        each hour row after it. Neither has an explicit z-index, so
                                        painting falls back to DOM order among positioned siblings:
                                        every hour row below is `relative` (see its className), so
                                        it — and whatever task chip/button it contains — paints
                                        *after*, i.e. on top of, any event block behind it. A row's
                                        own background is transparent except where a task chip or
                                        the "+" button actually sits, so the event's color still
                                        shows through everywhere else in that hour — exactly the
                                        "task overlaps the event" layering Google Calendar itself
                                        uses. */}
                                    {timedEventBlocks.map(block => renderDayEventBlock(block))}
                                    {hours.map(hour => {
                                        const hourDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, 0);
                                        const hourKey = `hour-${hour}`;
                                        return (
                                            <div
                                                key={hour}
                                                onDragOver={(e) => handleDropZoneDragOver(e, hourKey)}
                                                onDragLeave={() => handleDropZoneDragLeave(hourKey)}
                                                onDrop={(e) => handleHourRowDrop(e, hour)}
                                                className={`relative h-20 shrink-0 flex items-center gap-1 overflow-y-auto no-scrollbar py-0.5 group rounded-lg transition-all ${
                                                    dragOverKey === hourKey ? "ring-2 ring-inset ring-red-400 dark:ring-red-500 bg-red-50/40 dark:bg-red-900/10" : ""
                                                }`}
                                            >
                                                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                                                    {(timedTasksByHour[hour] ?? []).map((task, taskIdx) => renderCompactHourTask(task, taskIdx))}
                                                </div>
                                                {/* Desktop only — on touch, this hour's slot is
                                                    reached via a tap (opens the chooser) or a
                                                    press-and-drag (creates the event directly), both
                                                    handled by the timeline's own touch handlers, not
                                                    a per-row button. */}
                                                <button
                                                    data-drag-ignore
                                                    onClick={(e) => openAddChooser(e, hourDate)}
                                                    title={t.addTaskTitle}
                                                    aria-label={t.addTaskTitle}
                                                    className="hidden can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:block focus:opacity-100 focus:block p-1 rounded-md text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 active:scale-90 shrink-0 transition-all"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {dayDragCreate && (() => {
                                        const lo = Math.min(dayDragCreate.startMinutes, dayDragCreate.currentMinutes);
                                        const hi = Math.max(dayDragCreate.startMinutes, dayDragCreate.currentMinutes);
                                        return (
                                            <div
                                                className="absolute inset-x-0 z-30 rounded-lg border-2 border-dashed border-red-400 dark:border-red-500 bg-red-50/70 dark:bg-red-900/25 pointer-events-none flex items-start justify-center overflow-hidden"
                                                style={{ top: `${(lo / 60) * DAY_VIEW_ROW_HEIGHT_REM}rem`, height: `${Math.max(0.25, ((hi - lo) / 60) * DAY_VIEW_ROW_HEIGHT_REM)}rem` }}
                                            >
                                                <span className="mt-1 text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400 bg-white/95 dark:bg-gray-900/95 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                                                    {formatMinutesOfDay(lo)} – {formatMinutesOfDay(hi)}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Empty-day message: absolutely positioned (like the "now"
                                    line above, in this same `relative` column) instead of
                                    sticky. `position: sticky` was tried first, but a sticky
                                    element only overrides its position once its own natural
                                    in-flow position would scroll past the threshold — and
                                    this element's natural position, placed after the 24-row
                                    grid in the DOM, is at the very *bottom* of the column, so
                                    it just sat there unstuck instead of pinning to the top
                                    (fixed 2026-09-09). `absolute` takes it out of flow
                                    entirely, so — unlike the sticky attempt — it can't affect
                                    the column's own content height/ruled-lines either. The
                                    scroll-to-hour effect above scrolls an empty day to the
                                    very top so this is actually visible without the user
                                    having to scroll up first. */}
                                {tasksForCurrentDay.length === 0 && eventsForCurrentDay.length === 0 && (
                                    // left-1/2 -translate-x-1/2 centers this reliably regardless
                                    // of width — inset-x-0 (left-0 right-0) plus a capped
                                    // max-width doesn't auto-center an absolutely positioned box
                                    // (the browser resolves width to fill the gap first, then
                                    // just clips it down to max-width from the left edge), which
                                    // is why this used to hug the left instead (fixed 2026-09-09).
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 z-30 mt-10 p-6 w-full sm:max-w-xl border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm transition-colors duration-300">
                                        <DayOffIllustration className="w-20 h-20 mb-2" />
                                        <h3 className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">{t.dayOffTitle}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 transition-colors duration-300">{t.dayOffDesc}</p>
                                        <div className="flex items-center gap-2">
                                            {subjects.length > 0 && (
                                                <button
                                                    onClick={() => openCreateModal(currentDate)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <ListTodo size={14} /> {t.btnAddTask}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openCreateEventModal(currentDate)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-lg transition-all"
                                            >
                                                <CalendarRange size={14} /> {t.btnAddEvent}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Month view's "+N more" hover preview — non-interactive (a
                plain preview, not a menu), positioned via a portal so it
                escapes the GRID AREA's overflow-hidden instead of getting
                clipped at the cell/row edge, same reasoning as ModalOverlay's
                use of createPortal for floating elements. */}
            {morePopover && createPortal(
                <div
                    className="fixed z-[90] w-56 max-h-64 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 pointer-events-none animate-soft-fade"
                    style={{
                        left: Math.min(Math.max(morePopover.rect.left, 8), window.innerWidth - 224 - 8),
                        ...(morePopover.rect.bottom + 260 > window.innerHeight
                            ? { bottom: window.innerHeight - morePopover.rect.top + 6 }
                            : { top: morePopover.rect.bottom + 6 }),
                    }}
                >
                    {morePopover.tasks.map(task => {
                        const subjectColor = getSubjectColor(task.subjectId);
                        return (
                            <div
                                key={task.id}
                                className={`text-xs font-semibold px-2 py-1.5 rounded-lg truncate border-l-2 ${
                                    task.completed
                                        ? "bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-500 line-through border-transparent"
                                        : `${subjectColor.bg} ${subjectColor.text} ${task.priority === "MEDIUM" ? "border-transparent" : getPriorityColor(task.priority).border}`
                                }`}
                            >
                                {task.title}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}

            {/* Add-chooser popover (Tarea/Evento) — same portal + anchored-
                rect positioning approach as morePopover above, but
                interactive (two buttons) and dismissed via a full-screen
                click-catcher instead of onMouseLeave, since it opens on
                click rather than hover. */}
            {addChooser && createPortal(
                <>
                    <div className="fixed inset-0 z-[89]" onClick={() => setAddChooser(null)} />
                    <div
                        className="fixed z-[90] w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 animate-soft-fade"
                        style={{
                            left: Math.min(Math.max(addChooser.rect.left, 8), window.innerWidth - 160 - 8),
                            ...(addChooser.rect.bottom + 100 > window.innerHeight
                                ? { bottom: window.innerHeight - addChooser.rect.top + 6 }
                                : { top: addChooser.rect.bottom + 6 }),
                        }}
                    >
                        {subjects.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { const d = addChooser.date; setAddChooser(null); openCreateModal(d); }}
                                className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                            >
                                <ListTodo size={14} className="text-red-500" /> {t.chooserTask}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { const d = addChooser.date; setAddChooser(null); openCreateEventModal(d); }}
                            className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                        >
                            <CalendarRange size={14} className="text-indigo-500" /> {t.chooserEvent}
                        </button>
                    </div>
                </>,
                document.body
            )}

            <Suspense fallback={null}>
                <CalendarTaskModal
                    isOpen={taskModalState !== null}
                    onClose={() => setTaskModalState(null)}
                    subjects={subjects}
                    mode={taskModalState?.mode ?? "create"}
                    initialDate={taskModalState?.mode === "create" ? taskModalState.date : undefined}
                    defaultSubjectId={taskModalState?.mode === "create" ? taskModalState.defaultSubjectId : undefined}
                    task={taskModalState?.mode === "edit" ? taskModalState.task : undefined}
                    onCreate={handleCreateTaskFromCalendar}
                    onUpdate={handleUpdateTaskFromCalendar}
                    onDelete={handleDeleteTaskFromCalendar}
                />
            </Suspense>
            <Suspense fallback={null}>
                <CalendarEventModal
                    isOpen={eventModalState !== null}
                    onClose={() => setEventModalState(null)}
                    categories={categories}
                    onCategoriesChanged={fetchCategories}
                    mode={eventModalState?.mode ?? "create"}
                    initialDate={eventModalState?.mode === "create" ? eventModalState.date : undefined}
                    initialEndDate={eventModalState?.mode === "create" ? eventModalState.endDate : undefined}
                    event={eventModalState?.mode === "edit" ? eventModalState.event : undefined}
                    onCreate={handleCreateEvent}
                    onCreateRecurring={handleCreateRecurringEvent}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                />
            </Suspense>
        </div>
    );
});