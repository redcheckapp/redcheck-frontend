import { useCallback, useEffect, useState } from "react";
import { X, Trash2, Power, PowerOff, Pencil, Repeat } from "lucide-react";
import { toast } from "react-hot-toast";
import { getRecurringTasks, toggleRecurringTaskActive, deleteRecurringTask, updateRecurringTask } from "../api/recurringTaskApi";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { useConfirm } from "../context/ConfirmContext";
import type { RecurringTaskResponse } from "../types";
import { ModalOverlay } from "./ModalOverlay";
import { WeekdayPicker } from "./WeekdayPicker";
import { buildCustomFrequency, formatCustomFrequencyLabel, parseCustomFrequencyDays } from "../utils/recurrenceUtils";

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
        optDaily: "Diariamente",
        optWeekly: "Semanalmente",
        optBiweekly: "Quincenalmente",
        optMonthly: "Mensualmente",
        close: "Cerrar",
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios",
        noDesc: "Sin descripción",
        ttEdit: "Editar rutina",
        ttPause: "Pausar rutina",
        ttResume: "Reactivar rutina",
        ttDelete: "Borrar rutina permanentemente",
        confirmDeleteTitle: "¿Borrar rutina?",
        confirmDelete: "¿Seguro que quieres borrar esta rutina? No se generarán más tareas.",
        errUpdate: "Hubo un error al actualizar la rutina.",
        freqDaily: "Diaria",
        freqWeekly: "Semanal",
        freqBiweekly: "Quincenal",
        freqMonthly: "Mensual",
        optCustom: "Personalizada",
        lblCustomDays: "Se repite los días",
        weekDaysShort: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
        errCustomDaysRequired: "Selecciona al menos un día de la semana"
    },
    en: {
        title: "Recurring Routines",
        subject: "Subject",
        loading: "Loading routines...",
        empty: "No recurring tasks for this subject.",
        phTitle: "Title",
        phDesc: "Description (optional)",
        optDaily: "Daily",
        optWeekly: "Weekly",
        optBiweekly: "Biweekly",
        optMonthly: "Monthly",
        close: "Close",
        btnCancel: "Cancel",
        btnSave: "Save changes",
        noDesc: "No description",
        ttEdit: "Edit routine",
        ttPause: "Pause routine",
        ttResume: "Resume routine",
        ttDelete: "Delete routine permanently",
        confirmDeleteTitle: "Delete routine?",
        confirmDelete: "Are you sure you want to delete this routine? No more tasks will be generated.",
        errUpdate: "There was an error updating the routine.",
        freqDaily: "Daily",
        freqWeekly: "Weekly",
        freqBiweekly: "Biweekly",
        freqMonthly: "Monthly",
        optCustom: "Custom",
        lblCustomDays: "Repeats on",
        weekDaysShort: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        errCustomDaysRequired: "Select at least one day of the week"
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
    const [editForm, setEditForm] = useState({ title: "", description: "", frequency: "DAILY", customDays: [] as number[] });

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
        const customDays = parseCustomFrequencyDays(task.frequency);
        setEditForm({
            title: task.title,
            description: task.description || "",
            frequency: customDays ? "CUSTOM" : task.frequency,
            customDays: customDays ?? []
        });
    };

    const handleToggleEditCustomDay = (day: number) => {
        setEditForm(prev => ({
            ...prev,
            customDays: prev.customDays.includes(day) ? prev.customDays.filter(d => d !== day) : [...prev.customDays, day]
        }));
    };

    const handleUpdateSubmit = async (e: React.FormEvent, taskId: number) => {
        e.preventDefault();
        if (editForm.frequency === "CUSTOM" && editForm.customDays.length === 0) {
            toast.error(t.errCustomDaysRequired);
            return;
        }
        try {
            const updatedTask = await updateRecurringTask(subjectId, taskId, {
                title: editForm.title,
                description: editForm.description,
                frequency: editForm.frequency === "CUSTOM" ? buildCustomFrequency(editForm.customDays) : editForm.frequency,
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

    const translateFrequency = (freq: string) => {
        const customLabel = formatCustomFrequencyLabel(freq, t.weekDaysShort);
        if (customLabel) return customLabel;
        const dict: Record<string, string> = {
            "DAILY": t.freqDaily,
            "WEEKLY": t.freqWeekly,
            "BIWEEKLY": t.freqBiweekly,
            "MONTHLY": t.freqMonthly
        };
        return dict[freq] || freq;
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
                                            <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" required placeholder={t.phTitle} />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" placeholder={t.phDesc} />
                                            <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})} className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 cursor-pointer transition-colors duration-300">
                                                <option value="DAILY">{t.optDaily}</option>
                                                <option value="WEEKLY">{t.optWeekly}</option>
                                                <option value="BIWEEKLY">{t.optBiweekly}</option>
                                                <option value="MONTHLY">{t.optMonthly}</option>
                                                <option value="CUSTOM">{t.optCustom}</option>
                                            </select>
                                        </div>
                                        {editForm.frequency === "CUSTOM" && (
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.lblCustomDays}</label>
                                                <WeekdayPicker selectedDays={editForm.customDays} onToggleDay={handleToggleEditCustomDay} dayLabels={t.weekDaysShort} />
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2 mt-1 transition-colors duration-300">
                                            <button type="button" onClick={() => setEditingTaskId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all duration-300">{t.btnCancel}</button>
                                            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm transition-all duration-300">{t.btnSave}</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* VIEW MODE */
                                    <div key={task.id} className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${task.active ? 'border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-75'}`}>
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className={`text-sm font-semibold truncate transition-colors duration-300 ${task.active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>{task.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 transition-colors duration-300">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                                    {translateFrequency(task.frequency)}
                                                </span>
                                                <span className="truncate">{task.description || t.noDesc}</span>
                                            </p>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => handleStartEdit(task)}
                                                className="p-2 text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 rounded-lg transition-all duration-200"
                                                title={t.ttEdit}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(task.id, task.active)}
                                                className={`p-2 rounded-lg active:scale-90 transition-all duration-200 ${task.active ? 'text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                title={task.active ? t.ttPause : t.ttResume}
                                            >
                                                {task.active ? <Power size={18} /> : <PowerOff size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="p-2 text-red-400 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 rounded-lg transition-all duration-200"
                                                title={t.ttDelete}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
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