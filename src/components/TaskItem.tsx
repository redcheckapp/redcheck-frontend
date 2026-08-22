import { Check, Pencil, X } from "lucide-react";
import type { SubjectWithTasks } from "../types";

type Task = SubjectWithTasks["tasks"][0]; 

interface TaskItemProps {
    subjectId: number;
    task: Task;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: { subjectId: number; taskId: number } | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement>) => void;

    setUpdatedTask: (task: { title: string; description: string; deadline: string }) => void;
    
    loading: boolean;
    error: string | null;
    isAdding?: boolean;
    isDeleting?: boolean;
}

    // Function that formats the date and gives it a "bubble" design according to proximity
    const renderDeadline = (deadlineStr: string | null, isCompleted: boolean) => {
        if (!deadlineStr) return "Sin fecha límite";

        const deadlineDate = new Date(deadlineStr);
        
        const taskDate = new Date(deadlineDate);
        taskDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const timeStr = deadlineDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        if (!isCompleted) {
            if (taskDate.getTime() === today.getTime()) {
                return (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                            Hoy, {timeStr}
                        </span>
                    </span>
                );
            }
            if (taskDate.getTime() === tomorrow.getTime()) {
                return (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                            Mañana, {timeStr}
                        </span>
                    </span>
                );
            }
            if (taskDate.getTime() === dayAfter.getTime()) {
                return (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-400 px-2 py-0.5 rounded-md font-medium tracking-wide">
                            Pasado mañana, {timeStr}
                        </span>
                    </span>
                );
            }
        }

        return (
            <span>
                {deadlineDate.toLocaleString("es-ES", { 
                    day: "2-digit", month: "2-digit", year: "numeric", 
                    hour: "2-digit", minute: "2-digit" 
                })}
            </span>
        );
    };

export const TaskItem = ({
    subjectId, task, handleToggleTask, handleDeleteTask, setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId, handleUpdateTask, updatedTask, handleChangeUpdateTask, setUpdatedTask, loading, error, isAdding, isDeleting,
}: TaskItemProps) => {

    return (
        <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                isAdding || isDeleting
                    ? "opacity-0 scale-95 max-h-0 !mb-[-0.5rem]" 
                    : "opacity-100 scale-100 max-h-[1000px]" 
        }`}>
            {/* Main task row */}
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">

                {/* Checkbox */}
                <button
                    onClick={() => handleToggleTask(subjectId, task.id)}
                    className={`w-6 h-6 squared-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110
                        ${task.completed
                            ? "bg-red-500 border-red-500"
                            : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
                        }`}>
                    {task.completed && <Check size={12} color="white" />}
                </button>

                {/* Title and deadline */}
                <div className="flex-1">
                    <p className={`text-sm font-medium transition
                        ${task.completed
                            ? "line-through text-gray-300 dark:text-gray-600"
                            : "text-gray-700 dark:text-gray-200"
                        }`}>
                        {task.title}
                                                            
                        {task.description && (
                            <span className={`ml-2 font-normal transition 
                                ${task.completed ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"}`}>
                                — {task.description}
                            </span>
                        )}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium transition-all ${task.completed ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"}`}>
                        {renderDeadline(task.deadline, task.completed)}
                    </p>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-center gap-1 opacity-100 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity duration-200">
                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/30 rounded-lg transition"
                        onClick={() => { 
                            setOpenFormSubjectIdTaskId({subjectId: subjectId, taskId: task.id}); 
                            
                            let formattedDate = "";
                            if (task.deadline) {
                                const d = new Date(task.deadline);
                                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                                formattedDate = d.toISOString().slice(0, 16);
                            }

                            setUpdatedTask({
                                title: task.title,
                                description: task.description || "",
                                deadline: formattedDate
                            });
                        }}
                        title="Editar tarea"
                    >
                        <Pencil size={16} />
                    </button>

                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition"
                        onClick={() => { handleDeleteTask(subjectId, task.id); }}  
                        title="Eliminar tarea"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* FORMULARIO EDITAR TAREA */}
            <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                openFormSubjectIdTaskId?.subjectId === subjectId && openFormSubjectIdTaskId?.taskId === task.id
                    ? "opacity-100 scale-100 max-h-[500px] mt-2 mb-4"
                    : "opacity-0 scale-95 max-h-0 !mt-0 !mb-0"
            }`}>
                <form onSubmit={(e) => handleUpdateTask(e, subjectId, task.id)}
                    className="flex flex-col gap-4 ml-10 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(234,179,8,0.1)] dark:shadow-none transition-colors duration-300">
                                                        
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 border-b border-gray-50 dark:border-gray-800 pb-2">Editar tarea</h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Título de la tarea</label>
                            <input
                                type="text"
                                name="title"
                                value={updatedTask.title}
                                onChange={handleChangeUpdateTask}
                                placeholder="Título de la tarea"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                                required
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={updatedTask.description}
                                    onChange={handleChangeUpdateTask}
                                    placeholder="Añade detalles..."
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                            </div>
                            
                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fecha límite</label>
                                <input
                                    type="datetime-local"
                                    name="deadline"
                                    value={updatedTask.deadline}
                                    onChange={handleChangeUpdateTask}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center mt-2 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <button type="button" 
                            onClick={() => {setOpenFormSubjectIdTaskId(null)}}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 dark:hover:bg-yellow-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};