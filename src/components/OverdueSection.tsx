import { Check, Pencil, X } from "lucide-react";
import type { SubjectWithTasks } from "../types";

interface OverdueSectionProps {
    subjects: SubjectWithTasks[];
    totalPendingOverdue: number;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
}

export const OverdueSection = ({
    subjects, totalPendingOverdue, handleToggleTask, handleDeleteTask, setOpenFormSubjectIdTaskId
}: OverdueSectionProps) => {

    return (
        <div className="mb-6 mt-8 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500 mt-1 mb-4">
                {totalPendingOverdue === 0
                    ? "¡No tienes tareas fuera de plazo! 🎉"
                    : `Tienes ${totalPendingOverdue} tarea${totalPendingOverdue > 1 ? "s" : ""} fuera de plazo`
                }
            </p>

            {totalPendingOverdue > 0 && (
                <div className="flex flex-col gap-6">
                    {subjects
                        .filter(subject => !subject.archived && subject.tasks.some(task => !task.completed && task.overdue))
                        .map(subject => (
                            <div key={`overdue-${subject.id}`}>
                                <h2 className="text-md font-semibold text-red-600 mb-3 border-b border-red-100 pb-2">
                                    {subject.name}
                               </h2>
                                <div className="flex flex-col gap-2">
                                    {subject.tasks
                                        .filter(task => !task.completed && task.overdue)
                                        .map(task => (
                                            <div key={`overdue-task-${task.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition group border border-red-100">
                                                <button onClick={() => handleToggleTask(subject.id, task.id)} className="w-6 h-6 squared-full border-2 flex items-center justify-center transition border-red-300 hover:border-red-500 bg-white">
                                                    {task.completed && <Check size={12} color="red" />}
                                                </button>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-900">
                                                        {task.title}
                                                        {task.description && <span className={`ml-2 font-normal transition ${task.completed ? "text-gray-300" : "text-red-700"}`}>— {task.description}</span>}
                                                    </p>
                                                    <p className="text-xs text-red-500 mt-0.5 font-medium">
                                                        {task.deadline ? `Caducó el ${new Date(task.deadline).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : "Sin fecha límite"}
                                                    </p>
                                                </div>
                                                <button type="button" className="flex items-center gap-2 text-yellow-600 hover:bg-white rounded-xl px-3 py-2 text-sm transition w-fit" onClick={() => { setOpenFormSubjectIdTaskId({ subjectId: subject.id, taskId: task.id }); }}>
                                                    <div className="w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center"><Pencil size={12} /></div>
                                                </button>
                                                <button type="button" className="flex items-center gap-2 text-red-600 hover:bg-white rounded-xl px-3 py-2 text-sm transition w-fit" onClick={() => { handleDeleteTask(subject.id, task.id); }}>
                                                    <div className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center"><X size={12} /></div>
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};