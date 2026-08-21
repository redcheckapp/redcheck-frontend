import { Trash2, ArrowLeft, RotateCcw, X, Inbox } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getTrashSubjects, restoreSubject, hardDeleteSubject, getSubjects } from "../api/subjectApi";
import { getTrashTasks, restoreTask, hardDeleteTask } from "../api/taskApi";
import type { SubjectResponse, TaskResponse } from "../types";

export const TrashView = ({ onClose, onRestore }: { onClose: () => void, onRestore: () => void }) => {
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const loadTrash = async () => {
        setLoading(true);
        try {
            // 1. Obtenemos las asignaturas eliminadas
            const deletedSubjects = await getTrashSubjects();
        
            // 2. Obtenemos el listado completo de asignaturas activas 
            // (para poder consultar sus tareas borradas)
            const allSubjects = await getSubjects(); 

            // 3. Recopilamos todas las tareas borradas de todas las asignaturas
            const tasksPromises = allSubjects.map(s => getTrashTasks(s.id));
            const results = await Promise.all(tasksPromises);
        
            // 4. Aplanamos el array de resultados
            const allDeletedTasks = results.flat();

            setSubjects(deletedSubjects);
            setTasks(allDeletedTasks);
        } catch (error) {
            console.error("Error al cargar la papelera:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrash();
    }, []);

    const handleRestoreSubject = async (id: number) => {
        await restoreSubject(id);
        setSubjects(subjects.filter(s => s.id !== id));
        // Puedes añadir una pequeña alerta visual o un toast aquí
        toast.success("Asignatura restaurada"); 
    };

    const handleHardDeleteSubject = async (id: number) => {
        if (!window.confirm("¿Borrar definitivamente? Esta acción es irreversible.")) return;
        await hardDeleteSubject(id);
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const handleRestoreTask = async (subjectId: number, taskId: number) => {
        await restoreTask(subjectId, taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
        toast.success("Tarea restaurada");
    };

    const handleHardDeleteTask = async (subjectId: number, taskId: number) => {
        if (!window.confirm("¿Borrar definitivamente?")) return;
        await hardDeleteTask(subjectId, taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm("¿Estás seguro de que quieres vaciar toda la papelera? Esta acción es irreversible y se perderán todos los datos.")) return;
        
        setLoading(true);
        try {
            // Preparamos todas las peticiones de borrado definitivo
            const taskPromises = tasks.map(t => hardDeleteTask(t.subjectId, t.id));
            const subjectPromises = subjects.map(s => hardDeleteSubject(s.id));
            
            // Las ejecutamos todas a la vez
            await Promise.all([...taskPromises, ...subjectPromises]);
            
            // Vaciamos el estado local de la interfaz
            setSubjects([]);
            setTasks([]);
            toast.success("Papelera vaciada correctamente");
        } catch (error) {
            console.error("Error al vaciar la papelera:", error);
            alert("Hubo un error al vaciar algunos elementos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-white rounded-2xl shadow-md p-8 flex flex-col overflow-y-auto">
            
            {/* MEJORA 4: Cabecera con el botón de Vaciar Papelera */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3 text-red-600">
                        <Trash2 size={28} />
                        <h1 className="text-3xl font-bold text-gray-800">Papelera</h1>
                    </div>
                </div>

                {/* Botón de Vaciar Papelera (Solo aparece si no está vacía) */}
                {(subjects.length > 0 || tasks.length > 0) && (
                    <button 
                        onClick={handleEmptyTrash}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        <span>Vaciar papelera</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>
            ) : subjects.length === 0 && tasks.length === 0 ? (
                // MEJORA 3: Estado vacío más visual
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <div className="bg-gray-50 p-6 rounded-full text-gray-400 mb-2 border border-gray-100">
                        <Inbox size={48} strokeWidth={1} />
                    </div>
                    <p className="text-lg font-bold text-gray-800">La papelera está vacía</p>
                    <p className="text-sm text-gray-500">Los elementos que elimines aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-8 flex-1">
                    {/* Sección Asignaturas */}
                    {subjects.length > 0 && (
                        <div>
                            {/* MEJORA 5: Subtítulos con más contraste (text-gray-500 y mb-6) */}
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Asignaturas eliminadas</h2>
                            <div className="grid gap-3">
                                {subjects.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="font-semibold text-gray-700">{s.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRestoreSubject(s.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><RotateCcw size={18}/></button>
                                            <button onClick={() => handleHardDeleteSubject(s.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><X size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sección Tareas */}
                    {tasks.length > 0 && (
                        <div>
                            {/* MEJORA 5: Subtítulos con más contraste (text-gray-500 y mb-6) */}
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Tareas eliminadas</h2>
                            <div className="grid gap-3">
                                {tasks.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-gray-700">{t.title}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRestoreTask(t.subjectId, t.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                                                <RotateCcw size={18}/>
                                            </button>
                                            <button onClick={() => handleHardDeleteTask(t.subjectId, t.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                                <X size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};