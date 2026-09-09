import { Pencil, Archive, X, Plus, Repeat } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { WeekdayPicker } from "./WeekdayPicker";
import { RecurrencePreview } from "./RecurrencePreview";
import { Suspense, lazy, useState, memo } from "react";
import type { SubjectWithTasks, TaskPriority } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { buildCustomFrequency } from "../utils/recurrenceUtils";

// Only needed once the user opens the recurring-routines modal for a subject.
const RecurringTasksModal = lazy(() => import("./RecurringTasksModal").then(m => ({ default: m.RecurringTasksModal })));

interface SubjectSectionProps {
    subject: SubjectWithTasks;
    setOpenFormUpdateSubject: (id: number | null) => void;
    openFormUpdateSubject: number | null;
    handleUpdateSubject: (e: React.FormEvent, subjectId: number) => void;
    handleArchiveSubject: (id: number) => void;
    handleDeleteSubject: (id: number) => void;
    updatedSubject: { name: string; description: string };
    handleChangeUpdateSubject: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: { subjectId: number; taskId: number } | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string; priority: TaskPriority };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    setOpenFormSubjectId: (id: number | null) => void;
    openFormSubjectId: number | null;
    handleSubmitTask: (e: React.FormEvent, subjectId: number) => void;
    newTask: { title: string; description: string; deadline: string; recurrence: string; priority: TaskPriority; customDays: number[]; recurrenceTime: string; recurrenceEndDate: string };
    handleChangeTask: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onToggleNewTaskCustomDay: (day: number) => void;
    error: string | null;
    loading: boolean;
    deletingTasks: number[];
    addingTasks: number[];
    setUpdatedTask: (task: { title: string; description: string; deadline: string; priority: TaskPriority }) => void;
    setUpdatedSubject: (subject: { name: string; description: string }) => void;
    selectionMode?: boolean;
    selectedTaskKeys?: Set<string>;
    onToggleSelectTask?: (subjectId: number, taskId: number) => void;
    onLongPressSelectTask?: (subjectId: number, taskId: number) => void;
}

// --- Translation dictionary for SubjectSection ---
const translations = {
    es: {
        ttRoutines: "Gestionar rutinas recurrentes",
        ttEditSubject: "Editar asignatura",
        ttArchive: "Archivar asignatura",
        ttDelete: "Eliminar asignatura",
        editSubjectTitle: "Editar asignatura",
        lblName: "Nombre",
        lblDesc: "Descripción",
        btnCancel: "Cancelar",
        btnSaveSubject: "Guardar cambios",
        noTasks: "No hay tareas pendientes para hoy.",
        ttAddTask: "Añadir nueva tarea a esta asignatura",
        btnAddTask: "Añadir tarea",
        newTaskTitle: "Nueva tarea para",
        lblTaskTitle: "Título de la tarea",
        lblDeadline: "Fecha límite",
        lblRecurrence: "Repetición",
        optNone: "No se repite",
        optDaily: "Diariamente",
        optWeekly: "Semanalmente",
        optBiweekly: "Quincenalmente",
        optMonthly: "Mensualmente",
        optCustom: "Personalizada",
        lblCustomDays: "Se repite los días",
        weekDaysShort: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
        lblRecurrenceTime: "Hora (opcional)",
        lblEndDate: "Termina el (opcional)",
        lblUpcoming: "Próximas fechas:",
        lblPriority: "Prioridad",
        priorityLow: "Baja",
        priorityMedium: "Media",
        priorityHigh: "Alta",
        btnSaveTask: "Guardar tarea"
    },
    en: {
        ttRoutines: "Manage recurring routines",
        ttEditSubject: "Edit subject",
        ttArchive: "Archive subject",
        ttDelete: "Delete subject",
        editSubjectTitle: "Edit subject",
        lblName: "Name",
        lblDesc: "Description",
        btnCancel: "Cancel",
        btnSaveSubject: "Save changes",
        noTasks: "No pending tasks for today.",
        ttAddTask: "Add new task to this subject",
        btnAddTask: "Add task",
        newTaskTitle: "New task for",
        lblTaskTitle: "Task title",
        lblDeadline: "Deadline",
        lblRecurrence: "Recurrence",
        optNone: "Does not repeat",
        optDaily: "Daily",
        optWeekly: "Weekly",
        optBiweekly: "Biweekly",
        optMonthly: "Monthly",
        optCustom: "Custom",
        lblCustomDays: "Repeats on",
        weekDaysShort: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
        lblRecurrenceTime: "Time (optional)",
        lblEndDate: "Ends on (optional)",
        lblUpcoming: "Upcoming dates:",
        lblPriority: "Priority",
        priorityLow: "Low",
        priorityMedium: "Medium",
        priorityHigh: "High",
        btnSaveTask: "Save task"
    }
};

export const SubjectSection = memo(({
    subject,
    setOpenFormUpdateSubject,
    openFormUpdateSubject,
    handleUpdateSubject,
    handleArchiveSubject,
    handleDeleteSubject,
    updatedSubject,
    handleChangeUpdateSubject,
    handleToggleTask,
    handleDeleteTask,
    setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId,
    handleUpdateTask,
    updatedTask,
    handleChangeUpdateTask,
    setOpenFormSubjectId,
    openFormSubjectId,
    handleSubmitTask,
    newTask,
    handleChangeTask,
    onToggleNewTaskCustomDay,
    error,
    setUpdatedTask,
    setUpdatedSubject,
    loading,
    deletingTasks,
    addingTasks,
    selectionMode,
    selectedTaskKeys,
    onToggleSelectTask,
    onLongPressSelectTask
}: SubjectSectionProps) => {

    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    
    const normalTasks = subject.tasks.filter((task) => !task.overdue);

    return (
        <div key={subject.id} className="group/section">
            
            <div className="group/header flex items-start justify-between gap-4 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 transition-colors duration-300">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                        {subject.name}
                    </h2>
                    {subject.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-500 font-medium mt-0.5">
                            {subject.description}
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-1 opacity-100 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover/header:opacity-100 transition-opacity duration-200 shrink-0">
                    <button type="button" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition" onClick={() => setIsRecurringModalOpen(true)} title={t.ttRoutines}><Repeat size={16} /></button>
                    <button type="button" className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition" onClick={() => { setOpenFormUpdateSubject(subject.id); setUpdatedSubject({ name: subject.name, description: subject.description || "" }); }} title={t.ttEditSubject}><Pencil size={16} /></button>
                    <button type="button" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition" onClick={() => { handleArchiveSubject(subject.id); }} title={t.ttArchive}><Archive size={16} /></button>
                    <button type="button" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition" onClick={() => { handleDeleteSubject(subject.id); }} title={t.ttDelete}><X size={16} /></button>
                </div>
            </div>

            {/* EDIT SUBJECT FORM */}
            <div 
                className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                    openFormUpdateSubject === subject.id 
                        ? "opacity-100 scale-100 max-h-[500px] mb-4" 
                        : "opacity-0 scale-95 max-h-0 mb-0"
                }`}
            >
                <form onSubmit={(e) => handleUpdateSubject(e, subject.id)} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none font-normal transition-colors duration-300">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-gray-800 pb-2">{t.editSubjectTitle}</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblName}</label>
                            <input type="text" name="name" value={updatedSubject.name} onChange={handleChangeUpdateSubject} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" required />
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblDesc}</label>
                            <input type="text" name="description" value={updatedSubject.description} onChange={handleChangeUpdateSubject} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>}
                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <button type="button" onClick={() => { setOpenFormUpdateSubject(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200">{t.btnCancel}</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50">{t.btnSaveSubject}</button>
                    </div>
                </form>
            </div>

            <div className="flex flex-col gap-2">
                {normalTasks.length === 0 ? (
                    <p className="text-[13px] text-gray-500 dark:text-gray-500 font-medium italic mb-1 pl-1">
                        {t.noTasks}
                    </p>
                ) : (
                    normalTasks.map((task) => (
                        <TaskItem
                            key={`task-${task.id}`} 
                            subjectId={subject.id}
                            task={task}
                            isAdding={addingTasks?.includes(task.id)}
                            handleToggleTask={handleToggleTask}
                            handleDeleteTask={handleDeleteTask}
                            setOpenFormSubjectIdTaskId={setOpenFormSubjectIdTaskId}
                            openFormSubjectIdTaskId={openFormSubjectIdTaskId}
                            handleUpdateTask={handleUpdateTask}
                            updatedTask={updatedTask}
                            handleChangeUpdateTask={handleChangeUpdateTask}
                            setUpdatedTask={setUpdatedTask}
                            loading={loading}
                            error={error}
                            isDeleting={deletingTasks?.includes(task.id)}
                            selectionMode={selectionMode}
                            isSelected={selectedTaskKeys?.has(`${subject.id}:${task.id}`)}
                            onToggleSelect={onToggleSelectTask}
                            onLongPressSelect={onLongPressSelectTask}
                        />
                    ))
                )}

                <div className={`grid transition-all duration-300 ease-in-out focus-within:opacity-100 ${
                    openFormSubjectId === subject.id || normalTasks.length === 0 
                        ? 'grid-rows-[1fr] opacity-100' 
                        : 'grid-rows-[1fr] opacity-100 [@media(any-hover:hover)]:grid-rows-[0fr] [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover/section:grid-rows-[1fr] [@media(any-hover:hover)]:group-hover/section:opacity-100'
                }`}>
                    <div className="overflow-hidden flex items-center">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-lg px-2 py-2 text-sm transition-all w-fit mt-1"
                            onClick={() => { setOpenFormSubjectId(subject.id); }}
                            title={t.ttAddTask}
                        >
                            <Plus size={16} className="transition-transform group-hover/section:scale-110" />
                            <span className="font-medium">{t.btnAddTask}</span>
                        </button>
                    </div>
                </div>

                {/* ADD TASK FORM */}
                <div 
                    className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                        openFormSubjectId === subject.id 
                            ? "opacity-100 scale-100 max-h-[600px] mt-2 mb-4" 
                            : "opacity-0 scale-95 max-h-0 !mt-0 !mb-0" 
                    }`}
                >
                    <form onSubmit={(e) => handleSubmitTask(e, subject.id)} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(34,197,94,0.1)] dark:shadow-none transition-colors duration-300">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-gray-800 pb-2">{t.newTaskTitle} {subject.name}</h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblTaskTitle}</label>
                                <input type="text" name="title" value={newTask.title} onChange={handleChangeTask} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" required />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblDesc}</label>
                                <input type="text" name="description" value={newTask.description} onChange={handleChangeTask} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblDeadline}</label>
                                    <input type="datetime-local" name="deadline" value={newTask.deadline} onChange={handleChangeTask} disabled={newTask.recurrence !== "NONE"} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none disabled:opacity-50" />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblRecurrence}</label>
                                    <select name="recurrence" value={newTask.recurrence} onChange={handleChangeTask} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer">
                                        <option value="NONE">{t.optNone}</option>
                                        <option value="DAILY">{t.optDaily}</option>
                                        <option value="WEEKLY">{t.optWeekly}</option>
                                        <option value="BIWEEKLY">{t.optBiweekly}</option>
                                        <option value="MONTHLY">{t.optMonthly}</option>
                                        <option value="CUSTOM">{t.optCustom}</option>
                                    </select>
                                </div>
                            </div>
                            {newTask.recurrence === "CUSTOM" && (
                                <div className="flex flex-col">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblCustomDays}</label>
                                    <WeekdayPicker selectedDays={newTask.customDays} onToggleDay={onToggleNewTaskCustomDay} dayLabels={t.weekDaysShort} />
                                </div>
                            )}
                            {newTask.recurrence !== "NONE" && (
                                <>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 flex flex-col">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblRecurrenceTime}</label>
                                            <input type="time" name="recurrenceTime" value={newTask.recurrenceTime} onChange={handleChangeTask} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblEndDate}</label>
                                            <input type="date" name="recurrenceEndDate" value={newTask.recurrenceEndDate} onChange={handleChangeTask} min={new Date().toISOString().slice(0, 10)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none" />
                                        </div>
                                    </div>
                                    {(newTask.recurrence !== "CUSTOM" || newTask.customDays.length > 0) && (
                                        <RecurrencePreview
                                            frequency={newTask.recurrence === "CUSTOM" ? buildCustomFrequency(newTask.customDays) : newTask.recurrence}
                                            endDate={newTask.recurrenceEndDate}
                                            locale={language}
                                            label={t.lblUpcoming}
                                        />
                                    )}
                                </>
                            )}
                            <div className="flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.lblPriority}</label>
                                <select name="priority" value={newTask.priority} onChange={handleChangeTask} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer">
                                    <option value="LOW">{t.priorityLow}</option>
                                    <option value="MEDIUM">{t.priorityMedium}</option>
                                    <option value="HIGH">{t.priorityHigh}</option>
                                </select>
                            </div>
                        </div>
                        {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded-lg text-center">{error}</p>}
                        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                            <button type="button" onClick={() => { setOpenFormSubjectId(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200">{t.btnCancel}</button>
                            <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50">{t.btnSaveTask}</button>
                        </div>
                    </form>
                </div>
            </div>

            <Suspense fallback={null}>
                <RecurringTasksModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} subjectId={subject.id} subjectName={subject.name} />
            </Suspense>
        </div>
    );
});