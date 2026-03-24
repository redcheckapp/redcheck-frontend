import { Check, Pencil, X } from "lucide-react";
import type { SubjectWithTasks } from "../types";

// Un pequeño truco de TypeScript para extraer el tipo "Task" a partir de tu SubjectWithTasks
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
            {/* Fila principal de la tarea (le añadimos "group" para el hover) */}
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">

                {/* Checkbox */}
                <button
                    onClick={() => handleToggleTask(subjectId, task.id)}
                    className={`w-6 h-6 squared-full border-2 flex
                        items-center justify-center transition
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
                                                            
                        {/* Descripción justo al lado (si existe) */}
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

                {/* Botones de acción: transparentes por defecto, aparecen al hacer hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    
                    {/* Botón editar tarea */}
                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        onClick={() => { setOpenFormSubjectIdTaskId({subjectId: subjectId, taskId: task.id}); }}
                        title="Editar tarea"
                    >
                        <Pencil size={16} />
                    </button>

                    {/* Botón borrar tarea */}
                    <button type="button" 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        onClick={() => { handleDeleteTask(subjectId, task.id); }}  
                        title="Eliminar tarea"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Formulario de edición (ahora debajo de la fila, no dentro del mismo flex) */}
            {openFormSubjectIdTaskId?.subjectId === subjectId && openFormSubjectIdTaskId?.taskId === task.id && (
                <form onSubmit={(e) => handleUpdateTask(e, subjectId, task.id)}
                    className="flex flex-col gap-2 mt-2 ml-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                            
                    {/* input title */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Título</label>
                        <input
                            type="text"
                            name="title"
                            value={updatedTask.title}
                            onChange={handleChangeUpdateTask}
                            placeholder="Título"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* input description */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Descripción</label>
                        <input
                            type="text"
                            name="description"
                            value={updatedTask.description}
                            onChange={handleChangeUpdateTask}
                            placeholder="Descripción"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* input deadline */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Fecha límite</label>
                        <input
                            type="datetime-local"
                            name="deadline"
                            value={updatedTask.deadline}
                            onChange={handleChangeUpdateTask}
                            placeholder="Fecha límite"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Errores */}
                    {error && (
                        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
                    )}

                    {/* Botones Guardar y Cancelar */}
                    <div className="flex gap-2 mt-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            Guardar
                        </button>
        
                        <button type="button" 
                            onClick={() => {setOpenFormSubjectIdTaskId(null)}}
                            className="border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};