import { useState, useEffect, useMemo, useCallback, useRef, memo, lazy, Suspense, type TouchEvent, type KeyboardEvent, type DragEvent, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Plus, Check, Palette } from "lucide-react";
import { getProgressHeatmap } from "../api/progressRecordApi";
import { getTasksForDateRange } from "../api/taskApi";
import type { ProgressRecord, SubjectWithTasks, TaskPriority, TaskRequest, TaskResponse } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { getSubjectColor } from "../utils/subjectColors";
import { getPriorityColor } from "../utils/priorityColors";
import { DayOffIllustration } from "./illustrations/DayOffIllustration";

// Only needed once the user opens the create/edit task modal from the
// calendar — split out of the main AgendaView chunk, same pattern as the
// dashboard's own on-demand modals (SettingsModal, TrashView, etc.).
const CalendarTaskModal = lazy(() => import("./CalendarTaskModal").then(m => ({ default: m.CalendarTaskModal })));

type ViewMode = "day" | "week" | "month";

interface AgendaViewProps {
    subjects?: SubjectWithTasks[];
    onCreateTask: (subjectId: number, data: TaskRequest) => Promise<void>;
    onUpdateTask: (subjectId: number, taskId: number, data: TaskRequest) => Promise<void>;
    onDeleteTask: (subjectId: number, taskId: number) => Promise<void>;
    onToggleTask: (subjectId: number, taskId: number) => Promise<void>;
}

// Either creating a new task on a clicked date, or editing/rescheduling one
// clicked in Day/Week/Month — a single modal (CalendarTaskModal) handles
// both, keyed off which variant this is.
type TaskModalState =
    | { mode: "create"; date: Date; defaultSubjectId: number | null }
    | { mode: "edit"; task: TaskResponse };

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
        jumpToDate: "Ir a una fecha",
        toggleHeatmapOn: "Desactivar coloreado por progreso",
        toggleHeatmapOff: "Activar coloreado por progreso",
        prevPeriod: "Periodo anterior",
        nextPeriod: "Periodo siguiente",
        prevMonth: "Mes anterior",
        nextMonth: "Mes siguiente",
        addTaskTitle: "Añadir tarea",
        btnAddTask: "Añadir tarea",
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
        jumpToDate: "Jump to a date",
        toggleHeatmapOn: "Turn off progress coloring",
        toggleHeatmapOff: "Turn on progress coloring",
        prevPeriod: "Previous period",
        nextPeriod: "Next period",
        prevMonth: "Previous month",
        nextMonth: "Next month",
        addTaskTitle: "Add task",
        btnAddTask: "Add task",
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

const DAY_VIEW_HOUR_START = 0;
const DAY_VIEW_HOUR_END = 23;

// Week cells are one tall row (vs. Month's up to six short ones), so they
// can comfortably fit more real task cards before falling back to "+N more".
const WEEK_CELL_TASK_LIMIT = 6;

const VIEW_ORDER: ViewMode[] = ["day", "week", "month"];

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
        const handleClickOutside = (e: MouseEvent) => {
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

export const AgendaView = memo(({ subjects = [], onCreateTask, onUpdateTask, onDeleteTask, onToggleTask }: AgendaViewProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [view, setView] = useState<ViewMode>("month");

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
    // Whether Month/Week day cells get colored by completion ratio (see
    // getSquareColor below) — on by default, opt-out for users who find it
    // distracting. Local to AgendaView (not lifted to DashboardPage/a
    // shared context) since nothing outside the calendar reads it; plain
    // localStorage, same lightweight pattern as DashboardPage's own
    // remindersEnabled/taskFeedbackEnabled toggles rather than the
    // cookie+localStorage tier AccessibilityContext uses for whole-app
    // identity-level preferences.
    const [heatmapEnabled, setHeatmapEnabled] = useState(() => {
        try {
            return localStorage.getItem("rc_calendar_heatmap_enabled") !== "false";
        } catch {
            return true;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem("rc_calendar_heatmap_enabled", String(heatmapEnabled));
        } catch {
            // ignore (private browsing / storage disabled)
        }
    }, [heatmapEnabled]);
    const [taskModalState, setTaskModalState] = useState<TaskModalState | null>(null);
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

    const handleJumpToDate = (date: Date) => {
        setTransitionVariant("fade");
        setMorePopover(null);
        setCurrentDate(date);
        setDatePickerOpen(false);
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

    // Per-day task lookup used everywhere below: `subjects` (live-synced,
    // but pending/completed-today only) for today/future, the fetched
    // calendar-history data for past days.
    const getMergedTasksForDate = useCallback(
        (date: Date): CalendarTask[] =>
            isDateInPast(date, new Date())
                ? getHistoricalTasksForDate(historicalTasks, subjectNameById, date)
                : getTasksForDate(subjects, date),
        [subjects, historicalTasks, subjectNameById]
    );

    const tasksForCurrentDay = useMemo(
        () => getMergedTasksForDate(currentDate),
        [getMergedTasksForDate, currentDate]
    );

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
        if (tasksForCurrentDay.length === 0) {
            dayScrollRef.current.scrollTop = 0;
            return;
        }
        const isToday = currentDate.toDateString() === todayObj.toDateString();
        const targetHour = isToday ? todayObj.getHours() : 8;
        dayScrollRef.current.scrollTop = Math.max(0, (targetHour - 1) * 80);
        // todayObj is a fresh `new Date()` every render, not a stable value to
        // depend on — this should only re-run when the visible view/date (or
        // whether *this* day has any tasks) changes, not on every unrelated
        // re-render, which would fight the user's own manual scrolling.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, currentDate, tasksForCurrentDay.length === 0]);

    // One list per day of the visible week, for the Week view's per-day
    // task chips — same underlying filter as Day view, just run 7 times.
    const tasksByWeekDay = useMemo(
        () => currentWeekDays.map(date => getMergedTasksForDate(date)),
        [getMergedTasksForDate, currentWeekDays]
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
                        <button
                            onClick={() => setHeatmapEnabled(v => !v)}
                            aria-pressed={heatmapEnabled}
                            title={heatmapEnabled ? t.toggleHeatmapOn : t.toggleHeatmapOff}
                            aria-label={heatmapEnabled ? t.toggleHeatmapOn : t.toggleHeatmapOff}
                            className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-md transition-all ${heatmapEnabled ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
                        >
                            <Palette size={18} />
                        </button>
                    </div>
                </div>

                {/* Sliding pill: one animated background layer that glides between
                    the three buttons (translateX in multiples of its own width,
                    since it's sized to exactly 1/3 of the row) instead of each
                    button getting its own background flipped on/off — reads as
                    a single continuous selection rather than a state swap. */}
                <div className="relative flex w-full sm:w-auto bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div
                        aria-hidden="true"
                        className="absolute top-1 bottom-1 left-1 rounded-lg bg-red-50 dark:bg-red-900/30 shadow-sm transition-transform duration-300 ease-out"
                        style={{
                            width: "calc((100% - 0.5rem) / 3)",
                            transform: `translateX(${VIEW_ORDER.indexOf(view) * 100}%)`,
                        }}
                    />
                    {VIEW_ORDER.map((v) => (
                        <button
                            key={v}
                            onClick={() => changeView(v)}
                            className={`relative z-10 flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${view === v ? "text-red-700 dark:text-red-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
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
                                if (!dayNum) return <div key={i} className="bg-gray-50/30 dark:bg-gray-800/30 rounded-lg p-3 transition-colors duration-300" />;

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

                                const monthCellKey = `month-${cellDateString}`;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => jumpToDay(cellDateObj)}
                                        onDragOver={(e) => handleDropZoneDragOver(e, monthCellKey)}
                                        onDragLeave={() => handleDropZoneDragLeave(monthCellKey)}
                                        onDrop={(e) => handleDayCellDrop(e, cellDateObj)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={cellDateObj.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                                        onKeyDown={(e) => handleActivateKeyDown(e, () => jumpToDay(cellDateObj))}
                                        className={`${bgColorClass} rounded-lg p-1 sm:p-2 flex flex-col transition-all hover:brightness-95 dark:hover:brightness-110 hover:shadow-md hover:z-20 cursor-pointer relative group outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${isToday ? "z-10" : ""} ${
                                            dragOverKey === monthCellKey ? "z-20 ring-2 ring-inset ring-red-400 dark:ring-red-500" : ""
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm" : bgColorClass.includes("bg-[#4ade80]") || bgColorClass.includes("bg-[#16a34a]") ? "text-white drop-shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                                                {dayNum}
                                            </span>
                                            {subjects.length > 0 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openCreateModal(cellDateObj); }}
                                                    title={t.addTaskTitle}
                                                    aria-label={t.addTaskTitle}
                                                    className="can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100 no-hover:opacity-100 p-0.5 sm:p-1 rounded-md bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:scale-110 active:scale-90 shadow-sm transition-all"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            )}
                                        </div>
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
                                    </div>
                                );
                            })}
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
                                        {subjects.length > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openCreateModal(date); }}
                                                title={t.addTaskTitle}
                                                aria-label={t.addTaskTitle}
                                                className="absolute top-1 right-1 can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100 no-hover:opacity-100 p-0.5 sm:p-1 rounded-md bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:scale-110 active:scale-90 shadow-sm transition-all z-10"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        )}
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
                        {allDayTasks.length > 0 && (
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
                                        className="absolute left-0 right-0 top-[calc(0.75rem+var(--now-offset))] sm:top-[calc(1.5rem+var(--now-offset))] border-t-2 border-red-500 z-10 pointer-events-none"
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
                                <div className="relative z-20 sm:max-w-xl sm:ml-4">
                                    {hours.map(hour => {
                                        const hourDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour, 0);
                                        const hourKey = `hour-${hour}`;
                                        return (
                                            <div
                                                key={hour}
                                                onDragOver={(e) => handleDropZoneDragOver(e, hourKey)}
                                                onDragLeave={() => handleDropZoneDragLeave(hourKey)}
                                                onDrop={(e) => handleHourRowDrop(e, hour)}
                                                className={`h-20 shrink-0 flex items-center gap-1 overflow-y-auto no-scrollbar py-0.5 group rounded-lg transition-all ${
                                                    dragOverKey === hourKey ? "ring-2 ring-inset ring-red-400 dark:ring-red-500 bg-red-50/40 dark:bg-red-900/10" : ""
                                                }`}
                                            >
                                                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                                                    {(timedTasksByHour[hour] ?? []).map((task, taskIdx) => renderCompactHourTask(task, taskIdx))}
                                                </div>
                                                {subjects.length > 0 && (
                                                    <button
                                                        onClick={() => openCreateModal(hourDate)}
                                                        title={t.addTaskTitle}
                                                        aria-label={t.addTaskTitle}
                                                        className="can-hover:opacity-0 can-hover:group-hover:opacity-100 focus:opacity-100 no-hover:opacity-100 p-1 rounded-md text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 active:scale-90 shrink-0 transition-all"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
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
                                {tasksForCurrentDay.length === 0 && (
                                    <div className="absolute inset-x-0 top-0 z-30 mt-10 p-6 sm:max-w-xl sm:ml-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm transition-colors duration-300">
                                        <DayOffIllustration className="w-20 h-20 mb-2" />
                                        <h3 className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">{t.dayOffTitle}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 transition-colors duration-300">{t.dayOffDesc}</p>
                                        {subjects.length > 0 && (
                                            <button
                                                onClick={() => openCreateModal(currentDate)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-lg transition-all"
                                            >
                                                <Plus size={14} /> {t.btnAddTask}
                                            </button>
                                        )}
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
        </div>
    );
});