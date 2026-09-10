import { memo } from "react";
import { AlertCircle } from "lucide-react";
import type { SubjectWithTasks, TaskPriority } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { OverdueTaskRow } from "./OverdueTaskRow";

interface OverdueSectionProps {
    subjects: SubjectWithTasks[];
    totalPendingOverdue: number;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: {subjectId: number; taskId: number} | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string; priority: TaskPriority };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    setUpdatedTask: (task: { title: string; description: string; deadline: string; priority: TaskPriority }) => void;
    deletingTasks: number[];
    // Same selection-mode plumbing DashboardPage threads through
    // SubjectSection/TaskItem — overdue tasks now support long-press-select
    // and the bulk toolbar exactly like the main task list (2026-09-10).
    selectionMode?: boolean;
    selectedTaskKeys?: Set<string>;
    onToggleSelectTask?: (subjectId: number, taskId: number) => void;
    onLongPressSelectTask?: (subjectId: number, taskId: number) => void;
}

// --- Translation dictionary for OverdueSection ---
const translations = {
    es: {
        title: "Fuera de plazo",
    },
    en: {
        title: "Overdue",
    }
};

export const OverdueSection = memo(({
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
    deletingTasks,
    selectionMode,
    selectedTaskKeys,
    onToggleSelectTask,
    onLongPressSelectTask,
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
                                    .map(task => (
                                        <OverdueTaskRow
                                            key={`overdue-wrapper-${task.id}`}
                                            subjectId={subject.id}
                                            task={task}
                                            handleToggleTask={handleToggleTask}
                                            handleDeleteTask={handleDeleteTask}
                                            setOpenFormSubjectIdTaskId={setOpenFormSubjectIdTaskId}
                                            openFormSubjectIdTaskId={openFormSubjectIdTaskId}
                                            handleUpdateTask={handleUpdateTask}
                                            updatedTask={updatedTask}
                                            handleChangeUpdateTask={handleChangeUpdateTask}
                                            setUpdatedTask={setUpdatedTask}
                                            isDeleting={deletingTasks?.includes(task.id)}
                                            selectionMode={selectionMode}
                                            isSelected={selectedTaskKeys?.has(`${subject.id}:${task.id}`)}
                                            onToggleSelect={onToggleSelectTask}
                                            onLongPressSelect={onLongPressSelectTask}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
});
