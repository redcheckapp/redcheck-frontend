import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Power, PowerOff, Pencil } from "lucide-react";
import { getRecurringTasks, toggleRecurringTaskActive, deleteRecurringTask, updateRecurringTask } from "../api/recurringTaskApi";
import { useLanguage } from "../context/LanguageContext"; // <-- Importamos el contexto

interface RecurringTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectId: number;
    subjectName: string;
}

// --- Diccionario de traducciones para RecurringTasksModal ---
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
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios",
        noDesc: "Sin descripción",
        ttEdit: "Editar rutina",
        ttPause: "Pausar rutina",
        ttResume: "Reactivar rutina",
        ttDelete: "Borrar rutina permanentemente",
        confirmDelete: "¿Seguro que quieres borrar esta rutina? No se generarán más tareas.",
        errUpdate: "Hubo un error al actualizar la rutina.",
        freqDaily: "Diaria",
        freqWeekly: "Semanal",
        freqBiweekly: "Quincenal",
        freqMonthly: "Mensual"
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
        btnCancel: "Cancel",
        btnSave: "Save changes",
        noDesc: "No description",
        ttEdit: "Edit routine",
        ttPause: "Pause routine",
        ttResume: "Resume routine",
        ttDelete: "Delete routine permanently",
        confirmDelete: "Are you sure you want to delete this routine? No more tasks will be generated.",
        errUpdate: "There was an error updating the routine.",
        freqDaily: "Daily",
        freqWeekly: "Weekly",
        freqBiweekly: "Biweekly",
        freqMonthly: "Monthly"
    }
};

export const RecurringTasksModal = ({ isOpen, onClose, subjectId, subjectName }: RecurringTasksModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [recurringTasks, setRecurringTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // States for editing
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", frequency: "DAILY" });

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await getRecurringTasks(subjectId);
            setRecurringTasks(data);
        } catch (error) {
            console.error("Error cargando rutinas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
            setEditingTaskId(null); // Resets the form when opening/closing
        }
    }, [isOpen, subjectId]);

    const handleToggle = async (taskId: number, currentActive: boolean) => {
        try {
            await toggleRecurringTaskActive(subjectId, taskId, !currentActive);
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, active: !currentActive } : t));
        } catch (error) {
            console.error("Error al cambiar estado:", error);
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!window.confirm(t.confirmDelete)) return;
        try {
            await deleteRecurringTask(subjectId, taskId);
            setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Error al borrar:", error);
        }
    };

    const handleStartEdit = (task: any) => {
        setEditingTaskId(task.id);
        setEditForm({ 
            title: task.title, 
            description: task.description || "", 
            frequency: task.frequency 
        });
    };

    const handleUpdateSubmit = async (e: React.FormEvent, taskId: number) => {
        e.preventDefault();
        try {
            const updatedTask = await updateRecurringTask(subjectId, taskId, {
                title: editForm.title,
                description: editForm.description,
                frequency: editForm.frequency,
                subjectId: subjectId
            });
            // We update visually
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
            setEditingTaskId(null); // We close the form
        } catch (error) {
            console.error("Error al actualizar la rutina:", error);
            alert(t.errUpdate);
        }
    };

    const translateFrequency = (freq: string) => {
        const dict: Record<string, string> = { 
            "DAILY": t.freqDaily, 
            "WEEKLY": t.freqWeekly, 
            "BIWEEKLY": t.freqBiweekly, 
            "MONTHLY": t.freqMonthly 
        };
        return dict[freq] || freq;
    };

    // Rendering control: if closed, we return nothing
    if (!isOpen) return null;

    // We use createPortal and anchor it to document.body
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 transition-colors">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-transparent dark:border-gray-800 transition-colors duration-300">
                
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors duration-300">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{t.title}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors duration-300">{t.subject}: {subjectName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Routines list */}
                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm transition-colors duration-300">{t.loading}</p>
                    ) : recurringTasks.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            {t.empty}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recurringTasks.map(task => (
                                editingTaskId === task.id ? (
                                    /* INLINE EDIT MODE */
                                    <form key={task.id} onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="flex flex-col gap-3 p-3.5 border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl transition-all w-full duration-300">
                                        <div className="flex flex-col gap-1.5">
                                            <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500/50 transition-colors duration-300" required placeholder={t.phTitle} />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500/50 transition-colors duration-300" placeholder={t.phDesc} />
                                            <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})} className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-500/50 cursor-pointer transition-colors duration-300">
                                                <option value="DAILY">{t.optDaily}</option>
                                                <option value="WEEKLY">{t.optWeekly}</option>
                                                <option value="BIWEEKLY">{t.optBiweekly}</option>
                                                <option value="MONTHLY">{t.optMonthly}</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-1 transition-colors duration-300">
                                            <button type="button" onClick={() => setEditingTaskId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all duration-300">{t.btnCancel}</button>
                                            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 rounded-lg shadow-sm transition-all duration-300">{t.btnSave}</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* VIEW MODE */
                                    <div key={task.id} className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${task.active ? 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-75'}`}>
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className={`text-sm font-semibold truncate transition-colors duration-300 ${task.active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>{task.title}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 transition-colors duration-300">
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
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                                                title={t.ttEdit}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleToggle(task.id, task.active)}
                                                className={`p-2 rounded-lg transition-all duration-200 ${task.active ? 'text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                title={task.active ? t.ttPause : t.ttResume}
                                            >
                                                {task.active ? <Power size={18} /> : <PowerOff size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(task.id)}
                                                className="p-2 text-red-400 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
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
        </div>,
        document.body 
    );
};