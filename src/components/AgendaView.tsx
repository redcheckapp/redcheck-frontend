import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { getProgressHeatmap } from "../api/progressRecordApi";
import type { ProgressRecord, SubjectWithTasks } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context

type ViewMode = "day" | "week" | "month";

interface AgendaViewProps {
    subjects?: SubjectWithTasks[];
}

// --- Translation dictionary for AgendaView ---
const translations = {
    es: {
        btnToday: "Hoy",
        btnDay: "Día",
        btnWeek: "Semana",
        btnMonth: "Mes",
        loadingHistory: "Cargando historial...",
        lblTasks: "Tareas",
        lblViewTasks: "Ver tareas",
        lblAllDay: "Todo el día",
        moreTasks: "más",
        jumpToDate: "Ir a una fecha",
        dayOffTitle: "¡Día libre!",
        dayOffDesc: "No hay tareas programadas para este día.",
        weekDays: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
        months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    },
    en: {
        btnToday: "Today",
        btnDay: "Day",
        btnWeek: "Week",
        btnMonth: "Month",
        loadingHistory: "Loading history...",
        lblTasks: "Tasks",
        lblViewTasks: "View tasks",
        lblAllDay: "All day",
        moreTasks: "more",
        jumpToDate: "Jump to a date",
        dayOffTitle: "Day off!",
        dayOffDesc: "No tasks scheduled for this day.",
        weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
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

const DAY_VIEW_HOUR_START = 8;
const DAY_VIEW_HOUR_END = 20;

// A stable per-subject color across the whole calendar (Day/Week/Month),
// so the same subject always reads the same color regardless of view or
// current filter/sort order. Keyed by `subjectId % length`, not array
// position, so it stays stable even if the subjects list gets reordered,
// filtered, or a subject is deleted. Full literal class strings (not
// template-built) so Tailwind's build-time scanner picks them all up.
const SUBJECT_COLOR_PALETTE = [
    { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
    { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
    { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-900/30", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
    { bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-900/30", text: "text-pink-700 dark:text-pink-400", dot: "bg-pink-500" },
    { bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-900/30", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-500" },
    { bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
];

const getSubjectColor = (subjectId: number) =>
    SUBJECT_COLOR_PALETTE[subjectId % SUBJECT_COLOR_PALETTE.length];

export const AgendaView = ({ subjects = [] }: AgendaViewProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [view, setView] = useState<ViewMode>("month");
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<Record<string, ProgressRecord>>({});
    const [loadingRecords, setLoadingRecords] = useState(true);
    const jumpDateInputRef = useRef<HTMLInputElement>(null);

    const todayObj = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); 

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
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 1));
    };

    const handleNext = () => {
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 1));
    };

    const handleJumpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!value) return;
        const [year, month, day] = value.split("-").map(Number);
        setCurrentDate(new Date(year, month - 1, day));
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

    const tasksForCurrentDay = useMemo(
        () => getTasksForDate(subjects, currentDate),
        [subjects, currentDate]
    );

    // One list per day of the visible week, for the Week view's per-day
    // task chips — same underlying filter as Day view, just run 7 times.
    const tasksByWeekDay = useMemo(
        () => currentWeekDays.map(date => getTasksForDate(subjects, date)),
        [subjects, currentWeekDays]
    );

    // Buckets currentDate's tasks so Day view can actually place them on
    // the hourly grid instead of floating an unrelated list over it:
    // tasks with no time (deadline at midnight) go in an "all day" strip
    // above the grid, and timed tasks go in their hour's row — clamped to
    // the visible 8-20 range so a very early/late deadline still shows
    // (at the nearest edge row) rather than disappearing, with its real
    // time still shown on the card itself.
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
            const hour = Math.min(Math.max(d.getHours(), DAY_VIEW_HOUR_START), DAY_VIEW_HOUR_END);
            (byHour[hour] ??= []).push(task);
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

    let headerTitle = "";
    if (view === "month") {
        headerTitle = `${t.months[currentMonth]} ${currentYear}`;
    } else if (view === "week") {
        const first = currentWeekDays[0];
        const last = currentWeekDays[6];
        if (first.getMonth() === last.getMonth()) {
            headerTitle = `${first.getDate()} - ${last.getDate()} ${t.months[first.getMonth()]} ${first.getFullYear()}`;
        } else {
            headerTitle = `${first.getDate()} ${t.months[first.getMonth()].substring(0,3)} - ${last.getDate()} ${t.months[last.getMonth()].substring(0,3)} ${last.getFullYear()}`;
        }
    } else {
        headerTitle = `${currentDate.getDate()} ${t.months[currentDate.getMonth()]} ${currentYear}`;
    }

    const getSquareColor = (dateString: string) => {
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "bg-white dark:bg-gray-900"; 
        const ratio = record.completionRate;
        if (ratio === 0) return "bg-red-50 dark:bg-red-950/30";            
        if (ratio < 0.5) return "bg-[#eaf6ed] dark:bg-green-900/20";         
        if (ratio < 0.8) return "bg-[#4ade80] dark:bg-green-600";         
        return "bg-[#16a34a] dark:bg-green-500";                          
    };

    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    // Shared between the "all day" strip and the hourly grid — one card
    // style, just placed in different containers.
    const renderDayTaskCard = (task: (typeof tasksForCurrentDay)[number]) => {
        const tDate = new Date(task.deadline!);
        const hasTime = tDate.getHours() !== 0 || tDate.getMinutes() !== 0;
        const timeString = hasTime
            ? tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : t.lblAllDay;
        const subjectColor = getSubjectColor(task.subjectId);

        return (
            <div
                key={task.id}
                title={task.title}
                className={`bg-white dark:bg-gray-800 border p-2 sm:p-3 rounded-xl shadow-sm flex items-start gap-2 sm:gap-3 transition-all hover:shadow-md ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800' : subjectColor.border}`}
            >
                <div className={`mt-1 w-3 h-3 rounded-full border-2 shrink-0 transition-colors duration-300 ${task.completed ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : `border-transparent ${subjectColor.dot}`}`} />
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate transition-colors duration-300">
                            {task.subjectName}
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
    const renderCompactHourTask = (task: (typeof tasksForCurrentDay)[number]) => {
        const timeString = new Date(task.deadline!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const subjectColor = getSubjectColor(task.subjectId);
        return (
            <div
                key={task.id}
                title={`${task.subjectName} — ${task.title}`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shrink-0 transition-colors ${
                    task.completed
                        ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 line-through'
                        : `${subjectColor.bg} ${subjectColor.border} text-gray-700 dark:text-gray-200`
                }`}
            >
                <span className="shrink-0 font-semibold text-gray-400 dark:text-gray-500">{timeString}</span>
                <span className="truncate font-medium">{task.title}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 p-3 sm:p-8 overflow-hidden">

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-y-2 mb-4 sm:mb-8 shrink-0">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight capitalize sm:min-w-[280px] transition-colors duration-300">
                        {headerTitle}
                    </h1>

                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                            {t.btnToday}
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                        <div className="relative w-px self-stretch bg-gray-100 dark:bg-gray-800 mx-0.5" />
                        <div className="relative">
                            <button
                                onClick={() => jumpDateInputRef.current?.showPicker?.() ?? jumpDateInputRef.current?.click()}
                                title={t.jumpToDate}
                                aria-label={t.jumpToDate}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <CalendarDays size={18} />
                            </button>
                            <input
                                ref={jumpDateInputRef}
                                type="date"
                                onChange={handleJumpDateChange}
                                value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`}
                                aria-hidden="true"
                                tabIndex={-1}
                                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex w-full sm:w-auto bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <button onClick={() => setView("day")} className={`flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${view === "day" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>{t.btnDay}</button>
                    <button onClick={() => setView("week")} className={`flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${view === "week" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>{t.btnWeek}</button>
                    <button onClick={() => setView("month")} className={`flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${view === "month" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>{t.btnMonth}</button>
                </div>
            </div>

            {/* --- GRID AREA --- */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col relative transition-colors duration-300">
                
                {loadingRecords && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-colors duration-300">
                        <span className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">{t.loadingHistory}</span>
                    </div>
                )}

                {/* --- VIEW: MONTH --- */}
                {view === "month" && (
                    <>
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {t.weekDays.map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{day.substring(0,3)}</div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 bg-gray-100 dark:bg-gray-800 gap-[1px] transition-colors duration-300" style={{ gridTemplateRows: `repeat(${rowsNeeded}, minmax(0, 1fr))` }}>
                            {calendarCells.map((dayNum, i) => {
                                if (!dayNum) return <div key={i} className="bg-gray-50/30 dark:bg-gray-800/30 p-3 transition-colors duration-300" />;

                                const cellDateObj = new Date(currentYear, currentMonth, dayNum);
                                const isToday = cellDateObj.toDateString() === todayObj.toDateString();
                                const isPast = cellDateObj < todayObj && !isToday;
                                
                                const cellDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                
                                let bgColorClass = isPast || isToday ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                    bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                }

                                const record = records[cellDateString];
                                // Real task data (from `subjects`) only ever covers currently-
                                // incomplete tasks, so this is naturally empty for past days
                                // whose tasks are done — that's fine, the heatmap `record`
                                // fallback below covers history. For today/future days, this
                                // is the only source of truth, and wasn't used here at all
                                // before (future days showed nothing but a bare number).
                                const dayTasks = getTasksForDate(subjects, cellDateObj);

                                return (
                                    <div key={i} onClick={() => { setCurrentDate(cellDateObj); setView("day"); }} className={`${bgColorClass} p-1 sm:p-2 flex flex-col transition-colors hover:brightness-95 dark:hover:brightness-110 cursor-pointer relative group ${isToday ? "z-10" : ""}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm" : bgColorClass.includes("bg-[#4ade80]") || bgColorClass.includes("bg-[#16a34a]") ? "text-white drop-shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                                                {dayNum}
                                            </span>
                                        </div>
                                        {dayTasks.length > 0 ? (
                                            <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 overflow-y-auto no-scrollbar">
                                                {dayTasks.slice(0, 2).map(task => {
                                                    const subjectColor = getSubjectColor(task.subjectId);
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            title={`${task.subjectName} — ${task.title}`}
                                                            className={`text-[8px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded truncate transition-colors ${
                                                                task.completed
                                                                    ? "bg-white/60 dark:bg-gray-900/60 text-gray-400 dark:text-gray-500 line-through"
                                                                    : `${subjectColor.bg} ${subjectColor.text}`
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > 2 && (
                                                    <span className="hidden sm:inline text-[9px] text-gray-400 dark:text-gray-500 font-bold px-1">
                                                        +{dayTasks.length - 2} {t.moreTasks}
                                                    </span>
                                                )}
                                            </div>
                                        ) : record && record.totalTasks > 0 && (
                                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 sm:py-1 rounded truncate shadow-sm flex items-center justify-center sm:justify-between transition-colors duration-300">
                                                    <span className="hidden sm:inline">{t.lblTasks}</span>
                                                    <span className={record.completionRate === 1 ? "text-green-600 dark:text-green-400" : ""}>{record.completedTasks}/{record.totalTasks}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* --- VIEW: WEEK --- */}
                {view === "week" && (
                    <div className="flex-1 flex flex-col">
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                return (
                                    <div key={i} className={`py-2 sm:py-4 flex flex-col items-center justify-center gap-1 border-r border-gray-100 dark:border-gray-800 last:border-0 transition-colors duration-300 ${isToday ? "bg-red-50/50 dark:bg-red-900/20" : ""}`}>
                                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isToday ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                                            {t.weekDays[i].substring(0,3)}
                                        </span>
                                        <span className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-base sm:text-xl font-black transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm mt-0.5" : "text-gray-800 dark:text-gray-200"}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex-1 grid grid-cols-7 bg-gray-100 dark:bg-gray-800 gap-[1px] transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                const cellDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                
                                let bgColorClass = (date < todayObj || isToday) ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                    bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                }
                                
                                const dayTasks = tasksByWeekDay[i];

                                return (
                                    <div
                                        key={i}
                                        onClick={() => { setCurrentDate(date); setView("day"); }}
                                        className={`${bgColorClass} p-1 sm:p-2 flex flex-col gap-1 overflow-y-auto no-scrollbar cursor-pointer transition-colors hover:brightness-95 dark:hover:brightness-110`}
                                    >
                                        {dayTasks.length === 0 ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <span className="hidden sm:inline text-[10px] text-gray-300 dark:text-gray-600 font-medium">{t.dayOffTitle}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {dayTasks.slice(0, 4).map(task => {
                                                    const subjectColor = getSubjectColor(task.subjectId);
                                                    return (
                                                        <div
                                                            key={task.id}
                                                            title={`${task.subjectName} — ${task.title}`}
                                                            className={`text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-md truncate transition-colors ${
                                                                task.completed
                                                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 line-through"
                                                                    : `${subjectColor.bg} ${subjectColor.text}`
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > 4 && (
                                                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-bold px-1">
                                                        +{dayTasks.length - 4} {t.moreTasks}
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
                            <div className="shrink-0 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-2 sm:p-3 flex flex-col gap-1.5 transition-colors duration-300">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">{t.lblAllDay}</span>
                                {allDayTasks.map(task => renderDayTaskCard(task))}
                            </div>
                        )}

                        {/* Both columns below share this ONE scroll container rather
                            than each scrolling independently — two separate
                            overflow-y-auto elements that are supposed to stay
                            row-aligned can drift out of sync (they did, visibly,
                            once tasks were actually placed per-hour-row). */}
                        <div className="flex-1 flex overflow-y-auto">
                            <div className="w-12 sm:w-20 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 pt-3 sm:pt-6 pb-6 flex flex-col shrink-0 transition-colors duration-300">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 shrink-0 flex justify-end pr-1.5 sm:pr-4 text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 relative transition-colors duration-300">
                                        <span className="-mt-2">{hour.toString().padStart(2, '0')}:00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Notebook-style ruled lines, adapted to #1f2937 (gray-800) in dark mode */}
                            <div className="flex-1 relative bg-[linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] dark:bg-[linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:100%_5rem] p-3 sm:p-6 transition-colors duration-300">

                                {currentDate.toDateString() === todayObj.toDateString() && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-red-500 z-10 flex items-center pointer-events-none"
                                        style={{ top: `${((todayObj.getHours() - 8) * 5) + (todayObj.getMinutes() / 12)}rem` }}
                                    >
                                        <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white dark:border-gray-900 transition-colors duration-300"></div>
                                    </div>
                                )}

                                {tasksForCurrentDay.length === 0 ? (
                                    <div className="relative z-20 mt-10 p-6 sm:max-w-xl sm:ml-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-gray-800/50 transition-colors duration-300">
                                        <CheckCircle2 size={32} className="text-gray-300 dark:text-gray-600 mb-2 transition-colors duration-300" />
                                        <h3 className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">{t.dayOffTitle}</h3>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">{t.dayOffDesc}</p>
                                    </div>
                                ) : (
                                    // Tasks are placed in the row for their own hour — clamped
                                    // to the visible 8-20 range — instead of floating in an
                                    // unrelated list on top of the (previously decorative) grid.
                                    <div className="relative z-20 sm:max-w-xl sm:ml-4">
                                        {hours.map(hour => (
                                            <div key={hour} className="h-20 shrink-0 flex flex-col justify-center gap-1 overflow-y-auto no-scrollbar py-0.5">
                                                {(timedTasksByHour[hour] ?? []).map(task => renderCompactHourTask(task))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};