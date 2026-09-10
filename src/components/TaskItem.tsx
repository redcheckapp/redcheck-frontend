import { memo, useRef } from "react";
import { Check, Pencil, X, Type, AlignLeft, Clock3, Flag } from "lucide-react";
import type { SubjectWithTasks, TaskPriority } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { getPriorityColor } from "../utils/priorityColors";
import { triggerHapticFeedback } from "../utils/feedback";

type Task = SubjectWithTasks["tasks"][0];

interface TaskItemProps {
    subjectId: number;
    task: Task;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;

    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: { subjectId: number; taskId: number } | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string; priority: TaskPriority };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;

    setUpdatedTask: (task: { title: string; description: string; deadline: string; priority: TaskPriority }) => void;

    loading: boolean;
    error: string | null;
    isAdding?: boolean;
    isDeleting?: boolean;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (subjectId: number, taskId: number) => void;
    onLongPressSelect?: (subjectId: number, taskId: number) => void;
}

// Gallery-style long-press-to-select, touch only (desktop keeps the
// explicit "Select" button in DashboardPage.tsx, hidden on mobile — see
// that file). Hand-rolled with raw touch handlers rather than a gesture
// library, same reasoning as AgendaView's swipe navigation and Sidebar's
// drawer swipe.
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

// --- Translation dictionary for TaskItem ---
const translations = {
    es: {
        noDeadline: "Sin fecha límite",
        today: "Hoy",
        tomorrow: "Mañana",
        dayAfter: "Pasado mañana",
        ttEdit: "Editar tarea",
        ttDelete: "Eliminar tarea",
        ttMarkComplete: "Marcar como completada",
        ttMarkIncomplete: "Marcar como pendiente",
        ttSelectTask: "Seleccionar tarea",
        editTitle: "Editar tarea",
        lblTitle: "Título de la tarea",
        lblDesc: "Descripción",
        lblDeadline: "Fecha límite",
        lblPriority: "Prioridad",
        priorityLow: "Baja",
        priorityMedium: "Media",
        priorityHigh: "Alta",
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios"
    },
    en: {
        noDeadline: "No deadline",
        today: "Today",
        tomorrow: "Tomorrow",
        dayAfter: "Day after tomorrow",
        ttEdit: "Edit task",
        ttDelete: "Delete task",
        ttMarkComplete: "Mark as complete",
        ttMarkIncomplete: "Mark as pending",
        ttSelectTask: "Select task",
        editTitle: "Edit task",
        lblTitle: "Task title",
        lblDesc: "Description",
        lblDeadline: "Deadline",
        lblPriority: "Priority",
        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        btnCancel: "Cancel",
        btnSave: "Save changes"
    }
};

const priorityLabel = (priority: TaskPriority, t: typeof translations["es"]) =>
    priority === "HIGH" ? t.priorityHigh : priority === "LOW" ? t.priorityLow : t.priorityMedium;

// We pass `t` (translations) and `locale` as parameters to the helper function
const renderDeadline = (deadlineStr: string | null, isCompleted: boolean, t: typeof translations['es'], locale: string) => {
    if (!deadlineStr) return t.noDeadline;

    const deadlineDate = new Date(deadlineStr);
    
    const taskDate = new Date(deadlineDate);
    taskDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Use the dynamic locale to format the time (e.g. 10:00 vs 10:00 AM)
    const timeStr = deadlineDate.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    if (!isCompleted) {
        if (taskDate.getTime() === today.getTime()) {
            return (
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                        {t.today}, {timeStr}
                    </span>
                </span>
            );
        }
        if (taskDate.getTime() === tomorrow.getTime()) {
            return (
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                        {t.tomorrow}, {timeStr}
                    </span>
                </span>
            );
        }
        if (taskDate.getTime() === dayAfter.getTime()) {
            return (
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                        {t.dayAfter}, {timeStr}
                    </span>
                </span>
            );
        }
    }

    return (
        <span>
            {deadlineDate.toLocaleString(locale, { 
                day: "2-digit", month: "2-digit", year: "numeric", 
                hour: "2-digit", minute: "2-digit" 
            })}
        </span>
    );
};

export const TaskItem = memo(({
    subjectId, task, handleToggleTask, handleDeleteTask, setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId, handleUpdateTask, updatedTask, handleChangeUpdateTask, setUpdatedTask, loading, error, isAdding, isDeleting,
    selectionMode, isSelected, onToggleSelect, onLongPressSelect,
}: TaskItemProps) => {

    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const locale = language === 'es' ? 'es-ES' : 'en-US';

    // See LONG_PRESS_MS above. Attached to the row itself (not just the
    // checkbox) so a hold anywhere on the task — title, deadline, even the
    // edit/delete icons — enters selection mode, matching a photo gallery's
    // long-press-anywhere-on-the-tile behavior.
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

    const clearLongPressTimer = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressStartRef.current = null;
    };

    const handleRowTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (selectionMode || !onLongPressSelect) return;
        const touch = e.touches[0];
        longPressStartRef.current = { x: touch.clientX, y: touch.clientY };
        longPressTimerRef.current = setTimeout(() => {
            longPressTimerRef.current = null;
            if (localStorage.getItem("taskFeedbackEnabled") !== "false") {
                triggerHapticFeedback();
            }
            onLongPressSelect(subjectId, task.id);
        }, LONG_PRESS_MS);
    };

    // A scroll starts with the same touchstart as a long-press — cancel the
    // timer once the finger has clearly moved rather than held still, same
    // threshold-based disambiguation AgendaView's swipe handling uses.
    const handleRowTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const start = longPressStartRef.current;
        if (!start || !longPressTimerRef.current) return;
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - start.x);
        const deltaY = Math.abs(touch.clientY - start.y);
        if (deltaX > LONG_PRESS_MOVE_THRESHOLD_PX || deltaY > LONG_PRESS_MOVE_THRESHOLD_PX) {
            clearLongPressTimer();
        }
    };

    return (
        <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                isAdding || isDeleting
                    ? "opacity-0 scale-95 max-h-0 !mb-[-0.5rem]"
                    : "opacity-100 scale-100 max-h-[1000px]"
        }`}>
            {/* Main task row — while selectionMode is active, the whole row
                (not just the checkbox) toggles selection: a tap anywhere
                bubbles up to this onClick. The checkbox's own onClick only
                acts outside selectionMode, so a checkbox tap isn't handled
                twice (once there, once bubbled here). */}
            <div
                onClick={() => { if (selectionMode) onToggleSelect?.(subjectId, task.id); }}
                onTouchStart={handleRowTouchStart}
                onTouchMove={handleRowTouchMove}
                onTouchEnd={clearLongPressTimer}
                onTouchCancel={clearLongPressTimer}
                className={`flex items-center gap-3 p-3 rounded-xl transition active:scale-[0.99] group no-hover:select-none no-hover:[-webkit-touch-callout:none] ${
                selectionMode && isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}>

                {/* Checkbox — doubles as the selection toggle in selection mode */}
                <button
                    onClick={() => { if (!selectionMode) handleToggleTask(subjectId, task.id); }}
                    role="checkbox"
                    aria-checked={selectionMode ? isSelected : task.completed}
                    aria-label={selectionMode ? t.ttSelectTask : (task.completed ? t.ttMarkIncomplete : t.ttMarkComplete)}
                    title={selectionMode ? t.ttSelectTask : (task.completed ? t.ttMarkIncomplete : t.ttMarkComplete)}
                    className={`w-6 h-6 squared-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500
                        ${selectionMode
                            ? (isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500")
                            : (task.completed
                                ? "bg-red-500 border-red-500"
                                : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500")
                        }`}>
                    <Check
                        size={12}
                        color="white"
                        className={`transition-all duration-200 ${(selectionMode ? isSelected : task.completed) ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                    />
                </button>

                {/* Title and deadline */}
                <div className="flex-1">
                    <p className={`text-sm font-medium transition
                        ${task.completed
                            ? "line-through text-gray-300 dark:text-gray-600"
                            : "text-gray-700 dark:text-gray-200"
                        }`}>
                        {task.title}
                                                            
                        {task.description && (
                            <span className={`ml-2 font-normal transition 
                                ${task.completed ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-500"}`}>
                                — {task.description}
                            </span>
                        )}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium transition-all ${task.completed ? "text-gray-500 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
                        {renderDeadline(task.deadline, task.completed, t, locale)}
                    </p>
                </div>

                {/* Priority badge — separate color dimension from subject
                    color (see priorityColors.ts), so it stays legible next
                    to the deadline badge above rather than competing with it.
                    MEDIUM is the default every task gets when priority isn't
                    deliberately set (see redcheck-backend's TaskService), so
                    it's treated as "no priority" here and shown as nothing —
                    the badge only appears once the user actually picks LOW
                    or HIGH, keeping it opt-in rather than on every task. */}
                {!task.completed && task.priority !== "MEDIUM" && (() => {
                    const pc = getPriorityColor(task.priority);
                    return (
                        <span
                            title={priorityLabel(task.priority, t)}
                            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                            {priorityLabel(task.priority, t)}
                        </span>
                    );
                })()}

                {/* ACTION BUTTONS — hidden during selection mode, which uses
                    the row's own checkbox/highlight instead */}
                {!selectionMode && (
                    <div className="flex items-center gap-1 opacity-100 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                        <button type="button"
                            className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition"
                            onClick={() => {
                                setOpenFormSubjectIdTaskId({subjectId: subjectId, taskId: task.id});

                                let formattedDate = "";
                                if (task.deadline) {
                                    const d = new Date(task.deadline);
                                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                    formattedDate = d.toISOString().slice(0, 16);
                                }

                                setUpdatedTask({
                                    title: task.title,
                                    description: task.description || "",
                                    deadline: formattedDate,
                                    priority: task.priority
                                });
                            }}
                            title={t.ttEdit}
                        >
                            <Pencil size={16} />
                        </button>

                        <button type="button"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
                            onClick={() => { handleDeleteTask(subjectId, task.id); }}
                            title={t.ttDelete}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* EDIT TASK FORM */}
            <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                openFormSubjectIdTaskId?.subjectId === subjectId && openFormSubjectIdTaskId?.taskId === task.id
                    ? "opacity-100 scale-100 max-h-[500px] mt-2 mb-4"
                    : "opacity-0 scale-95 max-h-0 !mt-0 !mb-0"
            }`}>
                <form onSubmit={(e) => handleUpdateTask(e, subjectId, task.id)}
                    className="flex flex-col gap-4 ml-10 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(220,38,38,0.1)] dark:shadow-none transition-colors duration-300">
                                                        
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-gray-800 pb-2">{t.editTitle}</h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblTitle}</label>
                            <div className="relative">
                                <Type size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    name="title"
                                    value={updatedTask.title}
                                    onChange={handleChangeUpdateTask}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblDesc}</label>
                                <div className="relative">
                                    <AlignLeft size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        name="description"
                                        value={updatedTask.description}
                                        onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblDeadline}</label>
                                <div className="relative">
                                    <Clock3 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        name="deadline"
                                        value={updatedTask.deadline}
                                        onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 [color-scheme:light] dark:[color-scheme:dark] transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblPriority}</label>
                                <div className="relative">
                                    <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <select
                                        name="priority"
                                        value={updatedTask.priority}
                                        onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                                    >
                                        <option value="LOW">{t.priorityLow}</option>
                                        <option value="MEDIUM">{t.priorityMedium}</option>
                                        <option value="HIGH">{t.priorityHigh}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center mt-2 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <button type="button" 
                            onClick={() => {setOpenFormSubjectIdTaskId(null)}}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                        >
                            {t.btnCancel}
                        </button>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                            {t.btnSave}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});