import { Check, Pencil, X } from "lucide-react";
import { AnimatedVisibility } from "./AnimatedVisibility";
import type { SubjectWithTasks } from "../types";

type Task = SubjectWithTasks["tasks"][0]; 

interface TaskItemProps {
    subjectId: number;
    task: Task;
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    
    // Props para el formulario de edición
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: { subjectId: number; taskId: number } | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement>) => void;
    
    loading: boolean;
    error: string | null;
}

export const TaskItem = ({
    subjectId, task, handleToggleTask, handleDeleteTask, setOpenFormSubjectIdTaskId,
    openFormSubjectIdTaskId, handleUpdateTask, updatedTask, handleChangeUpdateTask, loading, error
}: TaskItemProps) => {

    return (
        <div className="flex flex-col w-full">
            {/* Fila principal de la tarea */}
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">

                {/* Checkbox */}
                <button
                    onClick={() => handleToggleTask(subjectId, task.id)}
                    className={`w-6 h-6 squared-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110
                        ${task.completed
                            ? "bg-red-500 border-red-500"
                            : "border-gray-300 hover:border-red-400"
                        }`}>
                    {task.completed && <Check size={12} color="white" />}
                </button>

                {/* Título y deadline */}
                <div className="flex-1">
                    <p className={`text-sm font-medium transition
                        ${task.completed
                            ? "line-through text-gray-300"
                            : "text-gray-700"
                        }`}>
                        {task.title}
                                                            
                        {task.description && (
                            <span className={`ml-2 font-normal transition 
                                ${task.completed ? "text-gray-300" : "text-gray-400"}`}>
                                — {task.description}
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {task.deadline 
                            ? new Date(task.deadline).toLocaleString("es-ES", { 
                                day: "2-digit", 
                                month: "2-digit", 
                                year: "numeric",
                                hour: "2-digit", 
                                minute: "2-digit" 
                            })
                            : "Sin fecha límite"
                        }
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        onClick={() => { setOpenFormSubjectIdTaskId({subjectId: subjectId, taskId: task.id}); }}
                        title="Editar tarea"
                    >
                        <Pencil size={16} />
                    </button>

                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        onClick={() => { handleDeleteTask(subjectId, task.id); }}  
                        title="Eliminar tarea"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Formulario de edición de tarea */}
            <AnimatedVisibility isVisible={openFormSubjectIdTaskId?.subjectId === subjectId && openFormSubjectIdTaskId?.taskId === task.id}>
                <form onSubmit={(e) => handleUpdateTask(e, subjectId, task.id)}
                    className="flex flex-col gap-4 mt-2 mb-4 ml-10 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                        
                    <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Editar tarea</h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título de la tarea</label>
                            <input
                                type="text"
                                name="title"
                                value={updatedTask.title}
                                onChange={handleChangeUpdateTask}
                                placeholder="Título de la tarea"
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 transition-all"
                                required
                            />
                        </div>

                        {/* Fila compacta para Descripción y Fecha */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={updatedTask.description}
                                    onChange={handleChangeUpdateTask}
                                    placeholder="Añade detalles..."
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 transition-all"
                                />
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha límite</label>
                                <input
                                    type="datetime-local"
                                    name="deadline"
                                    value={updatedTask.deadline}
                                    onChange={handleChangeUpdateTask}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100 focus:border-yellow-400 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center mt-2 bg-red-50 p-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-50">
                        <button type="button" 
                            onClick={() => {setOpenFormSubjectIdTaskId(null)}}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </AnimatedVisibility>
        </div>
    );
};