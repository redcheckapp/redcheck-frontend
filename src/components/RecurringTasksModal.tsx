import { useCallback, useEffect, useState } from "react";
import { X, Repeat } from "lucide-react";
import { toast } from "react-hot-toast";
import { getRecurringTasks, toggleRecurringTaskActive, deleteRecurringTask, updateRecurringTask } from "../api/recurringTaskApi";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { useConfirm } from "../context/ConfirmContext";
import type { RecurringTaskResponse } from "../types";
import { ModalOverlay } from "./ModalOverlay";
import { RecurrenceFieldset } from "./RecurrenceFieldset";
import { RoutineRow } from "./RoutineRow";
import { DEFAULT_RECURRENCE_STATE, isRecurrenceStateValid, parseFrequencyForEditing, resolveFrequency, type RecurrenceState } from "../utils/recurrenceUtils";

interface RecurringTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectId: number;
    subjectName: string;
}

// --- Translation dictionary for RecurringTasksModal ---
const translations = {
    es: {
        title: "Rutinas recurrentes",
        subject: "Asignatura",
        loading: "Cargando rutinas...",
        empty: "No hay tareas recurrentes para esta asignatura.",
        phTitle: "Título",
        phDesc: "Descripción (opcional)",
        lblRecurrence: "Repetición",
        optNone: "No se repite",
        optDaily: "Diariamente",
        optWeekly: "Semanalmente",
        optBiweekly: "Quincenalmente",
        optMonthly: "Mensualmente",
        optCustom: "Personalizada",
        lblCustomDays: "Se repite los días",
        weekDaysShort: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
        lblMonthDay: "Día del mes",
        monthlyDayPrefix: "Día",
        lastDay: "Último día",
        lblRecurrenceTime: "Hora (opcional)",
        lblEndDate: "Termina el (opcional)",
        lblUpcoming: "Próximas fechas:",
        errCustomDaysRequired: "Selecciona al menos un día de la semana",
        close: "Cerrar",
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios",
        noDesc: "Sin descripción",
        ttEdit: "Editar rutina",
        ttPause: "Pausar rutina",
        ttResume: "Reactivar rutina",
        ttDelete: "Borrar rutina permanentemente",
        ttStreak: "Racha actual",
        ttCompletionRate: "Cumplimiento",
        confirmDeleteTitle: "¿Borrar rutina?",
        confirmDelete: "¿Seguro que quieres borrar esta rutina? No se generarán más tareas.",
        errUpdate: "Hubo un error al actualizar la rutina.",
        freqDaily: "Diaria",
        freqWeekly: "Semanal",
        freqBiweekly: "Quincenal",
        freqMonthly: "Mensual",
        lblUntil: "hasta",
        lblNext: "Próxima:",
        lblPaused: "En pausa"
    },
    en: {
        title: "Recurring Routines",
        subject: "Subject",
        loading: "Loading routines...",
        empty: "No recurring tasks for this subject.",
        phTitle: "Title",
        phDesc: "Description (optional)",
        lblRecurrence: "Recurrence",
        optNone: "Does not repeat",
        optDaily: "Daily",
        optWeekly: "Weekly",
        optBiweekly: "Biweekly",
        optMonthly: "Monthly",
        optCustom: "Custom",
        lblCustomDays: "Repeats on",
        weekDaysShort: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        lblMonthDay: "Day of month",
        monthlyDayPrefix: "Day",
        lastDay: "Last day",
        lblRecurrenceTime: "Time (optional)",
        lblEndDate: "Ends on (optional)",
        lblUpcoming: "Upcoming dates:",
        errCustomDaysRequired: "Select at least one day of the week",
        close: "Close",
        btnCancel: "Cancel",
        btnSave: "Save changes",
        noDesc: "No description",
        ttEdit: "Edit routine",
        ttPause: "Pause routine",
        ttResume: "Resume routine",
        ttDelete: "Delete routine permanently",
        ttStreak: "Current streak",
        ttCompletionRate: "Completion rate",
        confirmDeleteTitle: "Delete routine?",
        confirmDelete: "Are you sure you want to delete this routine? No more tasks will be generated.",
        errUpdate: "There was an error updating the routine.",
        freqDaily: "Daily",
        freqWeekly: "Weekly",
        freqBiweekly: "Biweekly",
        freqMonthly: "Monthly",
        lblUntil: "until",
        lblNext: "Next:",
        lblPaused: "Paused"
    }
};

export const RecurringTasksModal = ({ isOpen, onClose, subjectId, subjectName }: RecurringTasksModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const confirm = useConfirm();

    const [recurringTasks, setRecurringTasks] = useState<RecurringTaskResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // States for editing
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editRecurrence, setEditRecurrence] = useState<RecurrenceState>(DEFAULT_RECURRENCE_STATE);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getRecurringTasks(subjectId);
            setRecurringTasks(data);
        } catch (error) {
            console.error("Error loading routines:", error);
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
            setEditingTaskId(null); // Resets the form when opening/closing
        }
    }, [isOpen, subjectId, fetchTasks]);

    const handleToggle = async (taskId: number, currentActive: boolean) => {
        try {
            await toggleRecurringTaskActive(subjectId, taskId, !currentActive);
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, active: !currentActive } : t));
        } catch (error) {
            console.error("Error changing status:", error);
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!(await confirm({ title: t.confirmDeleteTitle, message: t.confirmDelete }))) return;
        try {
            await deleteRecurringTask(subjectId, taskId);
            setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleStartEdit = (task: RecurringTaskResponse) => {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
        setEditRecurrence({
            ...parseFrequencyForEditing(task.frequency),
            time: task.time ? task.time.slice(0, 5) : "",
            endDate: task.endDate || ""
        });
    };

    const handleUpdateSubmit = async (e: React.FormEvent, taskId: number) => {
        e.preventDefault();
        if (!isRecurrenceStateValid(editRecurrence)) {
            toast.error(t.errCustomDaysRequired);
            return;
        }
        try {
            const updatedTask = await updateRecurringTask(subjectId, taskId, {
                title: editTitle,
                description: editDescription,
                frequency: resolveFrequency(editRecurrence.recurrence, editRecurrence.customMode, editRecurrence.customDays, editRecurrence.monthDay),
                time: editRecurrence.time,
                endDate: editRecurrence.endDate,
                subjectId: subjectId
            });
            // We update visually
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
            setEditingTaskId(null); // We close the form
        } catch (error) {
            console.error("Error updating the routine:", error);
            toast.error(t.errUpdate);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
            <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>

                {/* Modal header */}
                <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 transition-colors duration-300">
                    <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <Repeat size={20} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">{t.title}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">{t.subject}: {subjectName}</p>
                    </div>
                    <button onClick={onClose} aria-label={t.close} title={t.close} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Routines list */}
                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col gap-3 animate-pulse">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800" />
                            ))}
                        </div>
                    ) : recurringTasks.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-500 py-8 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            {t.empty}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recurringTasks.map(task => (
                                editingTaskId === task.id ? (
                                    /* INLINE EDIT MODE */
                                    <form key={task.id} onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="flex flex-col gap-3 p-3.5 border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 rounded-xl transition-all w-full duration-300">
                                        <div className="flex flex-col gap-1.5">
                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" required placeholder={t.phTitle} />
                                        </div>
                                        <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" placeholder={t.phDesc} />
                                        <RecurrenceFieldset value={editRecurrence} onChange={setEditRecurrence} labels={t} locale={language} compact allowNone={false} />
                                        <div className="flex justify-end gap-2 mt-1 transition-colors duration-300">
                                            <button type="button" onClick={() => setEditingTaskId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all duration-300">{t.btnCancel}</button>
                                            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm transition-all duration-300">{t.btnSave}</button>
                                        </div>
                                    </form>
                                ) : (
                                    <RoutineRow
                                        key={task.id}
                                        task={task}
                                        labels={t}
                                        onEdit={() => handleStartEdit(task)}
                                        onToggleActive={() => handleToggle(task.id, task.active)}
                                        onDelete={() => handleDelete(task.id)}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
            )}
        </ModalOverlay>
    );
};
