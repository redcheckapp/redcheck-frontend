import { memo, useRef } from "react";
import { Check, Pencil, X, Type, AlignLeft, Clock3, Flag } from "lucide-react";
import type { SubjectWithTasks, TaskPriority } from "../types";
import { AnimatedVisibility } from "./AnimatedVisibility";
import { useLanguage } from "../context/LanguageContext";
import { getPriorityColor } from "../utils/priorityColors";
import { triggerHapticFeedback } from "../utils/feedback";
import { useCheckboxStyle } from "../context/CheckboxStyleContext";
import { checkboxShapeClass } from "../utils/checkboxShapes";
import { CHECKBOX_ICON_COMPONENTS } from "../utils/checkboxIcons";

type Task = SubjectWithTasks["tasks"][0];

interface OverdueTaskRowProps {
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
    isDeleting?: boolean;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: (subjectId: number, taskId: number) => void;
    onLongPressSelect?: (subjectId: number, taskId: number) => void;
}

// Same gallery-style long-press-to-select as TaskItem.tsx, duplicated
// rather than shared via a hook — this codebase already hand-rolls each
// touch gesture separately (AgendaView's swipe nav, Sidebar's drawer
// swipe) rather than reaching for a shared abstraction, so this follows
// that precedent instead of introducing a first hooks/ directory for it.
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

// --- Translation dictionary for OverdueTaskRow ---
const translations = {
    es: {
        expiredOn: "Caducó el",
        noDeadline: "Sin fecha límite",
        editTooltip: "Editar tarea atrasada",
        deleteTooltip: "Eliminar tarea atrasada",
        ttMarkComplete: "Marcar como completada",
        ttMarkIncomplete: "Marcar como pendiente",
        ttSelectTask: "Seleccionar tarea",
        editFormTitle: "Editar tarea atrasada",
        taskTitleLabel: "Título de la tarea",
        descLabel: "Descripción",
        deadlineLabel: "Fecha límite",
        priorityLabel: "Prioridad",
        priorityLow: "Baja",
        priorityMedium: "Media",
        priorityHigh: "Alta",
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios"
    },
    en: {
        expiredOn: "Expired on",
        noDeadline: "No deadline",
        editTooltip: "Edit overdue task",
        deleteTooltip: "Delete overdue task",
        ttMarkComplete: "Mark as complete",
        ttMarkIncomplete: "Mark as pending",
        ttSelectTask: "Select task",
        editFormTitle: "Edit overdue task",
        taskTitleLabel: "Task title",
        descLabel: "Description",
        deadlineLabel: "Deadline",
        priorityLabel: "Priority",
        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        btnCancel: "Cancel",
        btnSave: "Save changes"
    }
};

const priorityText = (priority: TaskPriority, t: typeof translations["es"]) =>
    priority === "HIGH" ? t.priorityHigh : priority === "LOW" ? t.priorityLow : t.priorityMedium;

export const OverdueTaskRow = memo(({
    subjectId, task, handleToggleTask, handleDeleteTask, setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId, handleUpdateTask, updatedTask, handleChangeUpdateTask, setUpdatedTask, isDeleting,
    selectionMode, isSelected, onToggleSelect, onLongPressSelect,
}: OverdueTaskRowProps) => {

    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const { checkboxStyle, checkboxIcon } = useCheckboxStyle();
    const CheckboxGlyph = selectionMode ? Check : CHECKBOX_ICON_COMPONENTS[checkboxIcon];

    const isEditing = openFormSubjectIdTaskId?.subjectId === subjectId && openFormSubjectIdTaskId?.taskId === task.id;

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
        <div
            className={`flex flex-col w-full transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                isDeleting
                    ? "opacity-0 scale-95 max-h-0 !mb-[-0.5rem] border-transparent"
                    : "opacity-100 scale-100 max-h-[1000px]"
            }`}
        >
            {/* --- 1. NORMAL MODE (TASK VIEW) --- */}
            <div
                onClick={() => { if (selectionMode) onToggleSelect?.(subjectId, task.id); }}
                onTouchStart={handleRowTouchStart}
                onTouchMove={handleRowTouchMove}
                onTouchEnd={clearLongPressTimer}
                onTouchCancel={clearLongPressTimer}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors duration-300 group border no-hover:select-none no-hover:[-webkit-touch-callout:none] ${
                    selectionMode && isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : isEditing
                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 shadow-sm"
                            : task.completed
                                ? "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                                : "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30"
                }`}>

                {/* Checkbox — doubles as the selection toggle in selection mode */}
                <button
                    onClick={() => { if (!selectionMode) handleToggleTask(subjectId, task.id); }}
                    role="checkbox"
                    aria-checked={selectionMode ? isSelected : task.completed}
                    aria-label={selectionMode ? t.ttSelectTask : (task.completed ? t.ttMarkIncomplete : t.ttMarkComplete)}
                    title={selectionMode ? t.ttSelectTask : (task.completed ? t.ttMarkIncomplete : t.ttMarkComplete)}
                    className={`w-6 h-6 border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500 ${
                        checkboxShapeClass(checkboxStyle)
                    } ${
                        selectionMode
                            ? (isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-transparent")
                            : (task.completed
                                ? "bg-red-500 border-red-500"
                                : "border-red-300 dark:border-red-500/50 hover:border-red-500 dark:hover:border-red-400 bg-white dark:bg-transparent")
                    }`}
                >
                    <CheckboxGlyph
                        size={12}
                        color="white"
                        fill="white"
                        className={`transition-all duration-200 ${(selectionMode ? isSelected : task.completed) ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                    />
                </button>

                {/* Texts with strikethrough effect */}
                <div className="flex-1">
                    <p className={`text-sm font-medium transition-all ${
                        task.completed ? "line-through text-gray-500 dark:text-gray-600" : "text-red-900 dark:text-red-200"
                    }`}>
                        {task.title}
                        {task.description && <span className={`ml-2 font-normal transition-colors duration-300 ${task.completed ? "text-gray-300 dark:text-gray-600" : "text-red-700 dark:text-red-300"}`}>— {task.description}</span>}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium transition-all ${
                        task.completed ? "text-gray-500 dark:text-gray-600" : "text-red-500 dark:text-red-400"
                    }`}>
                        {task.deadline ? `${t.expiredOn} ${new Date(task.deadline).toLocaleString(language === 'es' ? "es-ES" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : t.noDeadline}
                    </p>
                </div>

                {/* Priority badge — see priorityColors.ts; a separate color
                    dimension from this section's red overdue styling. MEDIUM
                    is the default (see TaskItem.tsx's identical note), so it
                    shows nothing — only a deliberate LOW/HIGH gets a badge. */}
                {!task.completed && task.priority !== "MEDIUM" && (() => {
                    const pc = getPriorityColor(task.priority);
                    return (
                        <span
                            title={priorityText(task.priority, t)}
                            className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pc.bg} ${pc.text}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                            {priorityText(task.priority, t)}
                        </span>
                    );
                })()}

                {/* ACTION BUTTONS — hidden during selection mode (row's own
                    checkbox/highlight takes over) and on touch devices
                    entirely, same reasoning as TaskItem.tsx: long-press +
                    the bulk toolbar's Edit/Delete now cover mobile. */}
                {!selectionMode && (
                    <div className="hidden can-hover:flex items-center gap-1 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            type="button"
                            className="p-1.5 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors duration-200"
                            onClick={() => {
                                setOpenFormSubjectIdTaskId({ subjectId: subjectId, taskId: task.id });
                                let formattedDate = "";
                                if (task.deadline) {
                                    const d = new Date(task.deadline);
                                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                    formattedDate = d.toISOString().slice(0, 16);
                                }
                                setUpdatedTask({ title: task.title, description: task.description || "", deadline: formattedDate, priority: task.priority });
                            }}
                            title={t.editTooltip}
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            type="button"
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                            onClick={() => { handleDeleteTask(subjectId, task.id); }}
                            title={t.deleteTooltip}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* --- 2. ANIMATED EDIT MODE --- */}
            <AnimatedVisibility isVisible={isEditing}>
                <form
                    onSubmit={(e) => handleUpdateTask(e, subjectId, task.id)}
                    className="flex flex-col gap-4 mt-2 mb-4 ml-10 p-5 bg-white dark:bg-gray-900 border border-red-100 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300"
                >
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-400 border-b border-red-50 dark:border-gray-800 pb-2 transition-colors duration-300">{t.editFormTitle}</h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.taskTitleLabel}</label>
                            <div className="relative">
                                <Type size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-300 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text" name="title"
                                    value={updatedTask.title} onChange={handleChangeUpdateTask}
                                    className="w-full pl-10 pr-4 bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.descLabel}</label>
                                <div className="relative">
                                    <AlignLeft size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-300 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="text" name="description"
                                        value={updatedTask.description} onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.deadlineLabel}</label>
                                <div className="relative">
                                    <Clock3 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-300 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="datetime-local" name="deadline"
                                        value={updatedTask.deadline} onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl py-2.5 text-sm [color-scheme:light] dark:[color-scheme:dark] focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.priorityLabel}</label>
                                <div className="relative">
                                    <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-300 dark:text-gray-500 pointer-events-none" />
                                    <select
                                        name="priority"
                                        value={updatedTask.priority} onChange={handleChangeUpdateTask}
                                        className="w-full pl-10 pr-4 bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all cursor-pointer"
                                    >
                                        <option value="LOW">{t.priorityLow}</option>
                                        <option value="MEDIUM">{t.priorityMedium}</option>
                                        <option value="HIGH">{t.priorityHigh}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-red-50 dark:border-gray-800 transition-colors duration-300">
                        <button
                            type="button"
                            onClick={() => setOpenFormSubjectIdTaskId(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                        >
                            {t.btnCancel}
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                        >
                            {t.btnSave}
                        </button>
                    </div>
                </form>
            </AnimatedVisibility>
        </div>
    );
});
