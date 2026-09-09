import { ArrowLeft, Repeat, Flame, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getAllRecurringTasks, toggleRecurringTaskActive, deleteRecurringTask, updateRecurringTask } from "../api/recurringTaskApi";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { useConfirm } from "../context/ConfirmContext";
import type { RecurringTaskResponse, SubjectWithTasks } from "../types";
import { getSubjectColor } from "../utils/subjectColors";
import { DEFAULT_RECURRENCE_STATE, isRecurrenceStateValid, parseFrequencyForEditing, resolveFrequency, type RecurrenceState } from "../utils/recurrenceUtils";
import { RecurrenceFieldset } from "./RecurrenceFieldset";
import { RoutineRow } from "./RoutineRow";

// --- Translation dictionary for RoutinesView ---
const translations = {
    es: {
        title: "Mis rutinas",
        subtitle: "Todas las tareas recurrentes, de todas tus asignaturas",
        backTitle: "Volver",
        loading: "Cargando rutinas...",
        emptyTitle: "Aún no tienes rutinas",
        emptyDesc: "Las tareas recurrentes que crees en tus asignaturas aparecerán aquí, todas juntas.",
        statActive: "Activas",
        statBestStreak: "Mejor racha",
        statAvgCompletion: "Cumplimiento medio",
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
        title: "My Routines",
        subtitle: "Every recurring task, across every subject",
        backTitle: "Back",
        loading: "Loading routines...",
        emptyTitle: "No routines yet",
        emptyDesc: "Recurring tasks you create inside your subjects will show up here, all together.",
        statActive: "Active",
        statBestStreak: "Best streak",
        statAvgCompletion: "Avg. completion",
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

interface RoutinesViewProps {
    subjects: SubjectWithTasks[];
    onClose: () => void;
}

export const RoutinesView = ({ subjects, onClose }: RoutinesViewProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const confirm = useConfirm();

    const [routines, setRoutines] = useState<RecurringTaskResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editRecurrence, setEditRecurrence] = useState<RecurrenceState>(DEFAULT_RECURRENCE_STATE);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getAllRecurringTasks();
                setRoutines(data);
            } catch (error) {
                console.error("Error loading routines:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const subjectById = new Map(subjects.map(s => [s.id, s]));

    const handleToggle = async (task: RecurringTaskResponse) => {
        try {
            await toggleRecurringTaskActive(task.subjectId, task.id, !task.active);
            setRoutines(prev => prev.map(r => r.id === task.id ? { ...r, active: !task.active } : r));
        } catch (error) {
            console.error("Error changing status:", error);
        }
    };

    const handleDelete = async (task: RecurringTaskResponse) => {
        if (!(await confirm({ title: t.confirmDeleteTitle, message: t.confirmDelete }))) return;
        try {
            await deleteRecurringTask(task.subjectId, task.id);
            setRoutines(prev => prev.filter(r => r.id !== task.id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleStartEdit = (task: RecurringTaskResponse) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
        setEditRecurrence({
            ...parseFrequencyForEditing(task.frequency),
            time: task.time ? task.time.slice(0, 5) : "",
            endDate: task.endDate || ""
        });
    };

    const handleUpdateSubmit = async (e: React.FormEvent, task: RecurringTaskResponse) => {
        e.preventDefault();
        if (!isRecurrenceStateValid(editRecurrence)) {
            toast.error(t.errCustomDaysRequired);
            return;
        }
        try {
            const updated = await updateRecurringTask(task.subjectId, task.id, {
                title: editTitle,
                description: editDescription,
                frequency: resolveFrequency(editRecurrence.recurrence, editRecurrence.customMode, editRecurrence.customDays, editRecurrence.monthDay),
                time: editRecurrence.time,
                endDate: editRecurrence.endDate,
                subjectId: task.subjectId
            });
            setRoutines(prev => prev.map(r => r.id === task.id ? { ...r, ...updated } : r));
            setEditingId(null);
        } catch (error) {
            console.error("Error updating the routine:", error);
            toast.error(t.errUpdate);
        }
    };

    const activeCount = routines.filter(r => r.active).length;
    const bestStreak = routines.reduce((max, r) => Math.max(max, r.longestStreak), 0);
    const withHistory = routines.filter(r => r.totalGenerated > 0);
    const avgCompletion = withHistory.length === 0 ? 0 : withHistory.reduce((sum, r) => sum + r.completionRate, 0) / withHistory.length;

    // Grouped by subject, subjects sorted by name — mirrors TrashView's
    // section-per-category layout so this reads consistently with the rest
    // of the app's "management" screens (the other one swapped into this
    // same main-content slot).
    const groups = [...subjectById.entries()]
        .map(([subjectId, subject]) => ({ subject, routines: routines.filter(r => r.subjectId === subjectId) }))
        .filter(g => g.routines.length > 0)
        .sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    return (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 flex flex-col overflow-y-auto transition-colors duration-500">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={onClose} aria-label={t.backTitle} title={t.backTitle} className="p-2 text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-3 text-red-600 dark:text-red-500 transition-colors duration-300">
                    <Repeat size={28} />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{t.title}</h1>
                </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 ml-[3.25rem] transition-colors duration-300">{t.subtitle}</p>

            {loading ? (
                <div className="flex-1 space-y-8 animate-pulse">
                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                    </div>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="h-5 w-40 rounded-md bg-gray-200 dark:bg-gray-800 mb-1" />
                            <div className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />
                        </div>
                    ))}
                </div>
            ) : routines.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 transition-colors duration-300">
                    <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2">
                        <Repeat size={40} className="text-red-300 dark:text-red-700" />
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300">{t.emptyTitle}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm transition-colors duration-300">{t.emptyDesc}</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-8">
                    {/* Summary strip */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center justify-center gap-0.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{activeCount}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">{t.statActive}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-0.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <span className="flex items-center gap-1 text-2xl font-black text-orange-500 dark:text-orange-400"><Flame size={20} />{bestStreak}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">{t.statBestStreak}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-0.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            <span className="flex items-center gap-1 text-2xl font-black text-green-600 dark:text-green-500"><CheckCircle2 size={20} />{Math.round(avgCompletion * 100)}%</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500">{t.statAvgCompletion}</span>
                        </div>
                    </div>

                    {groups.map(({ subject, routines: subjectRoutines }) => (
                        <div key={subject.id}>
                            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors duration-300">
                                <span className={`w-2 h-2 rounded-full ${getSubjectColor(subject.id).dot}`} />
                                {subject.name}
                            </h2>
                            <div className="flex flex-col gap-3">
                                {subjectRoutines.map(task => (
                                    editingId === task.id ? (
                                        <form key={task.id} onSubmit={(e) => handleUpdateSubmit(e, task)} className="flex flex-col gap-3 p-3.5 border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 rounded-xl transition-all w-full duration-300">
                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" required placeholder={t.phTitle} />
                                            <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300" placeholder={t.phDesc} />
                                            <RecurrenceFieldset value={editRecurrence} onChange={setEditRecurrence} labels={t} locale={language} compact allowNone={false} />
                                            <div className="flex justify-end gap-2 mt-1 transition-colors duration-300">
                                                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all duration-300">{t.btnCancel}</button>
                                                <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm transition-all duration-300">{t.btnSave}</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <RoutineRow
                                            key={task.id}
                                            task={task}
                                            labels={t}
                                            onEdit={() => handleStartEdit(task)}
                                            onToggleActive={() => handleToggle(task)}
                                            onDelete={() => handleDelete(task)}
                                            showCompletionRate
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
