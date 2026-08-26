import { AlertCircle, Check, Pencil, X } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { AnimatedVisibility } from "./AnimatedVisibility";
import { useLanguage } from "../context/LanguageContext"; // <-- Importamos el contexto

interface OverdueSectionProps {
    subjects: SubjectWithTasks[];
    totalPendingOverdue: number;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: {subjectId: number; taskId: number} | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setUpdatedTask: (task: { title: string; description: string; deadline: string }) => void;
    deletingTasks: number[];
}

// --- Diccionario de traducciones para OverdueSection ---
const translations = {
    es: {
        title: "Fuera de plazo",
        expiredOn: "Caducó el",
        noDeadline: "Sin fecha límite",
        editTooltip: "Editar tarea atrasada",
        deleteTooltip: "Eliminar tarea atrasada",
        editFormTitle: "Editar tarea atrasada",
        taskTitleLabel: "Título de la tarea",
        descLabel: "Descripción",
        deadlineLabel: "Fecha límite",
        btnCancel: "Cancelar",
        btnSave: "Guardar cambios"
    },
    en: {
        title: "Overdue",
        expiredOn: "Expired on",
        noDeadline: "No deadline",
        editTooltip: "Edit overdue task",
        deleteTooltip: "Delete overdue task",
        editFormTitle: "Edit overdue task",
        taskTitleLabel: "Task title",
        descLabel: "Description",
        deadlineLabel: "Deadline",
        btnCancel: "Cancel",
        btnSave: "Save changes"
    }
};

export const OverdueSection = ({
    subjects, 
    totalPendingOverdue, 
    handleToggleTask, 
    handleDeleteTask, 
    setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId,
    handleUpdateTask,
    updatedTask,
    handleChangeUpdateTask,
    setUpdatedTask,
    deletingTasks
}: OverdueSectionProps) => {

    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const hasAnyOverdue = subjects.some(subject => 
        !subject.archived && subject.tasks.some(task => task.overdue)
    );

    // If there are absolutely no overdue tasks, we hide the entire section
    if (!hasAnyOverdue) return null;

    return (
        <div className="mb-6 mt-8 border-t border-gray-100 dark:border-gray-800 pt-4 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{t.title}</h2>
                {/* The red bubble only shows the number of PENDING ones */}
                {totalPendingOverdue > 0 && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full transition-colors duration-300">
                        {totalPendingOverdue}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-6">
                {subjects
                    // We remove the restrictive filter from the subjects
                    .filter(subject => !subject.archived && subject.tasks.some(task => task.overdue))
                    .map(subject => (
                        <div key={`overdue-${subject.id}`}>
                            <h2 className="text-md font-semibold text-red-600 dark:text-red-400 mb-3 border-b border-red-100 dark:border-red-900/30 pb-2 transition-colors duration-300">
                                {subject.name}
                            </h2>
                            <div className="flex flex-col gap-2">
                                {subject.tasks
                                    // We remove the restrictive filter from the tasks
                                    .filter(task => task.overdue)
                                    .map(task => {
                                        
                                        const isEditing = openFormSubjectIdTaskId?.taskId === task.id;
                                        const isDeletingTask = deletingTasks?.includes(task.id);

                                        return (
                                            <div 
                                                key={`overdue-wrapper-${task.id}`} 
                                                className={`flex flex-col w-full transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                                                    isDeletingTask 
                                                        ? "opacity-0 scale-95 max-h-0 !mb-[-0.5rem] border-transparent" 
                                                        : "opacity-100 scale-100 max-h-[1000px]"
                                                }`}
                                            >
                                                {/* --- 1. NORMAL MODE (TASK VIEW) --- */}
                                                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors duration-300 group border ${
                                                    isEditing 
                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 shadow-sm' 
                                                        : task.completed 
                                                            ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800' 
                                                            : 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-100 dark:border-red-900/30'   
                                                }`}>
                                                    
                                                    {/* Animated Checkbox */}
                                                    <button 
                                                        onClick={() => handleToggleTask(subject.id, task.id)} 
                                                        className={`w-6 h-6 squared-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                                            task.completed 
                                                                ? 'bg-red-500 border-red-500' 
                                                                : 'border-red-300 dark:border-red-500/50 hover:border-red-500 dark:hover:border-red-400 bg-white dark:bg-transparent'
                                                        }`}
                                                    >
                                                        {task.completed && <Check size={12} color="white" />}
                                                    </button>
                                                    
                                                    {/* Texts with strikethrough effect */}
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium transition-all ${
                                                            task.completed ? "line-through text-gray-400 dark:text-gray-600" : "text-red-900 dark:text-red-200"
                                                        }`}>
                                                            {task.title}
                                                            {task.description && <span className={`ml-2 font-normal transition-colors duration-300 ${task.completed ? "text-gray-300 dark:text-gray-600" : "text-red-700 dark:text-red-300"}`}>— {task.description}</span>}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 font-medium transition-all ${
                                                            task.completed ? "text-gray-400 dark:text-gray-600" : "text-red-500 dark:text-red-400"
                                                        }`}>
                                                            {task.deadline ? `${t.expiredOn} ${new Date(task.deadline).toLocaleString(language === 'es' ? "es-ES" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : t.noDeadline}
                                                        </p>
                                                    </div>

                                                    {/* BOTONES DE ACCIÓN: Accesibles en táctil, hover en escritorio */}
                                                    <div className="flex items-center gap-1 opacity-100 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                                                        <button 
                                                            type="button" 
                                                            className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors duration-200" 
                                                            onClick={() => { 
                                                                setOpenFormSubjectIdTaskId({ subjectId: subject.id, taskId: task.id }); 
                                                                let formattedDate = "";
                                                                if (task.deadline) {
                                                                    const d = new Date(task.deadline);
                                                                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                                                    formattedDate = d.toISOString().slice(0, 16);
                                                                }
                                                                setUpdatedTask({ title: task.title, description: task.description || "", deadline: formattedDate });
                                                            }}
                                                            title={t.editTooltip}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200" 
                                                            onClick={() => { handleDeleteTask(subject.id, task.id); }}
                                                            title={t.deleteTooltip}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* --- 2. ANIMATED EDIT MODE --- */}
                                                <AnimatedVisibility isVisible={isEditing}>
                                                    <form 
                                                        onSubmit={(e) => handleUpdateTask(e, subject.id, task.id)}
                                                        className="flex flex-col gap-4 mt-2 mb-4 ml-10 p-5 bg-white dark:bg-gray-900 border border-red-100 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300"
                                                    >
                                                        <h3 className="text-sm font-bold text-red-800 dark:text-red-400 border-b border-red-50 dark:border-gray-800 pb-2 transition-colors duration-300">{t.editFormTitle}</h3>

                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.taskTitleLabel}</label>
                                                                <input 
                                                                    type="text" name="title" 
                                                                    value={updatedTask.title} onChange={handleChangeUpdateTask}
                                                                    className="w-full bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                                                    required
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.descLabel}</label>
                                                                    <input 
                                                                        type="text" name="description" 
                                                                        value={updatedTask.description} onChange={handleChangeUpdateTask}
                                                                        className="w-full bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                                                    />
                                                                </div>

                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider">{t.deadlineLabel}</label>
                                                                    <input 
                                                                        type="datetime-local" name="deadline" 
                                                                        value={updatedTask.deadline} onChange={handleChangeUpdateTask}
                                                                        className="w-full bg-red-50/30 dark:bg-gray-800 border border-red-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all"
                                                                    />
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
                                    })
                                }
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};