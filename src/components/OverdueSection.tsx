import { AlertCircle, Check, Pencil, X } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { AnimatedVisibility } from "./AnimatedVisibility";

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

    const hasAnyOverdue = subjects.some(subject => 
        !subject.archived && subject.tasks.some(task => task.overdue)
    );

    // If there are absolutely no overdue tasks, we hide the entire section
    if (!hasAnyOverdue) return null;

    return (
        <div className="mb-6 mt-8 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} className="text-red-500" />
                <h2 className="text-lg font-bold text-gray-800">Fuera de plazo</h2>
                {/* The red bubble only shows the number of PENDING ones */}
                {totalPendingOverdue > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
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
                            <h2 className="text-md font-semibold text-red-600 mb-3 border-b border-red-100 pb-2">
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
                                                {/* Here we change the colors if it is completed */}
                                                <div className={`flex items-center gap-3 p-3 rounded-xl transition group border ${
                                                    isEditing 
                                                        ? 'bg-red-50 border-red-300 shadow-sm' 
                                                        : task.completed 
                                                            ? 'bg-gray-50 border-gray-100 hover:bg-gray-100' // Soft gray if completed
                                                            : 'bg-red-50 hover:bg-red-100 border-red-100'   // Alert red if pending
                                                }`}>
                                                    
                                                    {/* Animated Checkbox */}
                                                    <button 
                                                        onClick={() => handleToggleTask(subject.id, task.id)} 
                                                        className={`w-6 h-6 squared-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                                            task.completed 
                                                                ? 'bg-red-500 border-red-500' 
                                                                : 'border-red-300 hover:border-red-500 bg-white'
                                                        }`}
                                                    >
                                                        {task.completed && <Check size={12} color="white" />}
                                                    </button>
                                                    
                                                    {/* Texts with strikethrough effect */}
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium transition-all ${
                                                            task.completed ? "line-through text-gray-400" : "text-red-900"
                                                        }`}>
                                                            {task.title}
                                                            {task.description && <span className={`ml-2 font-normal transition ${task.completed ? "text-gray-300" : "text-red-700"}`}>— {task.description}</span>}
                                                        </p>
                                                        <p className={`text-xs mt-0.5 font-medium transition-all ${
                                                            task.completed ? "text-gray-400" : "text-red-500"
                                                        }`}>
                                                            {task.deadline ? `Caducó el ${new Date(task.deadline).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : "Sin fecha límite"}
                                                        </p>
                                                    </div>

                                                    {/* Buttons */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button 
                                                            type="button" 
                                                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition" 
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
                                                            title="Editar tarea atrasada"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                            onClick={() => { handleDeleteTask(subject.id, task.id); }}
                                                            title="Eliminar tarea atrasada"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* --- 2. ANIMATED EDIT MODE --- */}
                                                <AnimatedVisibility isVisible={isEditing}>
                                                    <form 
                                                        onSubmit={(e) => handleUpdateTask(e, subject.id, task.id)}
                                                        className="flex flex-col gap-4 mt-2 mb-4 ml-10 p-5 bg-white border border-red-100 rounded-2xl shadow-sm"
                                                    >
                                                        <h3 className="text-sm font-bold text-red-800 border-b border-red-50 pb-2">Editar tarea atrasada</h3>

                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Título de la tarea</label>
                                                                <input 
                                                                    type="text" name="title" 
                                                                    value={updatedTask.title} onChange={handleChangeUpdateTask}
                                                                    placeholder="Título de la tarea" 
                                                                    className="w-full bg-red-50/30 border border-red-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                                                                    required
                                                                />
                                                            </div>
                                                            
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Descripción</label>
                                                                    <input 
                                                                        type="text" name="description" 
                                                                        value={updatedTask.description} onChange={handleChangeUpdateTask}
                                                                        placeholder="Añade detalles..." 
                                                                        className="w-full bg-red-50/30 border border-red-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                                                                    />
                                                                </div>

                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Fecha límite</label>
                                                                    <input 
                                                                        type="datetime-local" name="deadline" 
                                                                        value={updatedTask.deadline} onChange={handleChangeUpdateTask}
                                                                        className="w-full bg-red-50/30 border border-red-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-red-50">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setOpenFormSubjectIdTaskId(null)} 
                                                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button 
                                                                type="submit" 
                                                                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                                                            >
                                                                Guardar cambios
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