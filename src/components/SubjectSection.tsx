import { Pencil, Archive, X, Plus } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { AnimatedVisibility } from "./AnimatedVisibility";
import type { SubjectWithTasks } from "../types";

interface SubjectSectionProps {
    subject: SubjectWithTasks;

    // Props de la Asignatura
    setOpenFormUpdateSubject: (id: number | null) => void;
    openFormUpdateSubject: number | null;
    handleUpdateSubject: (e: React.FormEvent, subjectId: number) => void;
    handleArchiveSubject: (id: number) => void;
    handleDeleteSubject: (id: number) => void;
    updatedSubject: { name: string; description: string };
    handleChangeUpdateSubject: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Props de la Tarea Individual
    handleToggleTask: (subjectId: number, taskId: number) => void;
    handleDeleteTask: (subjectId: number, taskId: number) => void;
    setOpenFormSubjectIdTaskId: (val: { subjectId: number; taskId: number } | null) => void;
    openFormSubjectIdTaskId: { subjectId: number; taskId: number } | null;
    handleUpdateTask: (e: React.FormEvent, subjectId: number, taskId: number) => void;
    updatedTask: { title: string; description: string; deadline: string };
    handleChangeUpdateTask: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Props para crear Nueva Tarea
    setOpenFormSubjectId: (id: number | null) => void;
    openFormSubjectId: number | null;
    handleSubmitTask: (e: React.FormEvent, subjectId: number) => void;
    newTask: { title: string; description: string; deadline: string; recurrence: string }; // Actualizado con recurrence
    handleChangeTask: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; // Acepta selects

    // Globales
    error: string | null;
    loading: boolean;
}

export const SubjectSection = ({
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
    error,
    loading,
}: SubjectSectionProps) => {
    return (
        <div key={subject.id}>
            {/* Nombre de la asignatura */}
            <h2 className="group text-lg font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span>{subject.name}</span>
                        {subject.description && (
                            <span className="text-gray-500 font-normal">
                                — {subject.description}
                            </span>
                        )}
                    </div>
                    
                    {/* Contenedor de botones: invisible por defecto, aparece en hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            type="button"
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            onClick={() => { setOpenFormUpdateSubject(subject.id); }}
                            title="Editar asignatura"
                        >
                            <Pencil size={16} />
                        </button>

                        <button
                            type="button"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            onClick={() => { handleArchiveSubject(subject.id); }}
                            title="Archivar asignatura"
                        >
                            <Archive size={16} />
                        </button>

                        <button
                            type="button"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            onClick={() => { handleDeleteSubject(subject.id); }}
                            title="Eliminar asignatura"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Formulario de edición de asignatura */}
                <AnimatedVisibility isVisible={openFormUpdateSubject === subject.id}>
                    <form
                        onSubmit={(e) => handleUpdateSubject(e, subject.id)}
                        className="flex flex-col gap-4 mt-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm font-normal"
                    >
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Editar asignatura</h3>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={updatedSubject.name}
                                    onChange={handleChangeUpdateSubject}
                                    placeholder="Ej. Desarrollo de Interfaces"
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={updatedSubject.description}
                                    onChange={handleChangeUpdateSubject}
                                    placeholder="Añade detalles..."
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
                        )}

                        <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => { setOpenFormUpdateSubject(null); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                            >
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                </AnimatedVisibility>
            </h2>

            {/* Tareas */}
            <div className="flex flex-col gap-2">
                {/* Primero filtramos las tareas normales */}
                {(() => {
                    const normalTasks = subject.tasks.filter((task) => !task.overdue);

                    if (normalTasks.length === 0) {
                        return (
                            <p className="text-sm text-gray-400 italic mb-2">
                                No hay tareas normales para hoy.
                            </p>
                        );
                    }

                    return normalTasks.map((task) => (
                        <TaskItem
                            key={task.id} 
                            subjectId={subject.id}
                            task={task}
                            handleToggleTask={handleToggleTask}
                            handleDeleteTask={handleDeleteTask}
                            setOpenFormSubjectIdTaskId={setOpenFormSubjectIdTaskId}
                            openFormSubjectIdTaskId={openFormSubjectIdTaskId}
                            handleUpdateTask={handleUpdateTask}
                            updatedTask={updatedTask}
                            handleChangeUpdateTask={handleChangeUpdateTask}
                            loading={loading}
                            error={error}
                        />
                    ));
                })()}

                {/* Botón añadir tarea */}
                <button
                    type="button"
                    className="flex items-center gap-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg px-3 py-1.5 text-sm transition w-fit group"
                    onClick={() => { setOpenFormSubjectId(subject.id); }}
                    title="Añadir nueva tarea a esta asignatura"
                >
                    <Plus size={16} className="transition-colors group-hover:text-green-600" />
                    <span>Añadir tarea</span>
                </button>

                <AnimatedVisibility isVisible={openFormSubjectId === subject.id}>
                    <form onSubmit={(e) => handleSubmitTask(e, subject.id)} className="flex flex-col gap-4 mt-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        
                        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Nueva tarea para {subject.name}</h3>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título de la tarea</label>
                                <input type="text" name="title" value={newTask.title} onChange={handleChangeTask} placeholder="Ej. Hacer el diagrama de base de datos" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all" required />
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</label>
                                <input type="text" name="description" value={newTask.description} onChange={handleChangeTask} placeholder="Añade detalles..." className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all" />
                            </div>

                            {/* Fila compacta para Fecha y Repetición */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha límite</label>
                                    <input 
                                        type="datetime-local" 
                                        name="deadline" 
                                        value={newTask.deadline} 
                                        onChange={handleChangeTask} 
                                        disabled={newTask.recurrence !== "NONE"}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repetición</label>
                                    <select 
                                        name="recurrence" 
                                        value={newTask.recurrence} 
                                        onChange={handleChangeTask} 
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all cursor-pointer"
                                    >
                                        <option value="NONE">No se repite</option>
                                        <option value="DAILY">Diariamente</option>
                                        <option value="WEEKLY">Semanalmente</option>
                                        <option value="BIWEEKLY">Quincenalmente</option>
                                        <option value="MONTHLY">Mensualmente</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg text-center">{error}</p>}

                        <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-50">
                            <button type="button" onClick={() => { setOpenFormSubjectId(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50">Guardar tarea</button>
                        </div>
                    </form>
                </AnimatedVisibility>
            </div>
        </div>
    );
};