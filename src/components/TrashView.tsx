import { Trash2, ArrowLeft, RotateCcw, X, Inbox } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getTrashSubjects, restoreSubject, hardDeleteSubject, getSubjects } from "../api/subjectApi";
import { getTrashTasks, restoreTask, hardDeleteTask } from "../api/taskApi";
import type { SubjectResponse, TaskResponse } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- Importamos el contexto

// --- Diccionario de traducciones para TrashView ---
const translations = {
    es: {
        title: "Papelera",
        emptyTrashBtn: "Vaciar papelera",
        loading: "Cargando...",
        emptyStateTitle: "La papelera está vacía",
        emptyStateDesc: "Los elementos que elimines aparecerán aquí.",
        subjectsTitle: "Asignaturas eliminadas",
        tasksTitle: "Tareas eliminadas",
        toastSubjectRestored: "Asignatura restaurada",
        toastTaskRestored: "Tarea restaurada",
        toastTrashEmptied: "Papelera vaciada correctamente",
        confirmDeleteSubject: "¿Borrar definitivamente? Esta acción es irreversible.",
        confirmDeleteTask: "¿Borrar definitivamente?",
        confirmEmptyTrash: "¿Estás seguro de que quieres vaciar toda la papelera? Esta acción es irreversible y se perderán todos los datos.",
        errEmptyTrash: "Hubo un error al vaciar algunos elementos."
    },
    en: {
        title: "Trash",
        emptyTrashBtn: "Empty trash",
        loading: "Loading...",
        emptyStateTitle: "Trash is empty",
        emptyStateDesc: "Items you delete will appear here.",
        subjectsTitle: "Deleted subjects",
        tasksTitle: "Deleted tasks",
        toastSubjectRestored: "Subject restored",
        toastTaskRestored: "Task restored",
        toastTrashEmptied: "Trash emptied successfully",
        confirmDeleteSubject: "Delete permanently? This action is irreversible.",
        confirmDeleteTask: "Delete permanently?",
        confirmEmptyTrash: "Are you sure you want to empty the trash? This action is irreversible and all data will be lost.",
        errEmptyTrash: "There was an error emptying some items."
    }
};

export const TrashView = ({ onClose, onRestore }: { onClose: () => void, onRestore: () => void }) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingSubjects, setRemovingSubjects] = useState<number[]>([]);
    const [removingTasks, setRemovingTasks] = useState<number[]>([]);

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
        setRemovingSubjects(prev => [...prev, id]);
        await restoreSubject(id);
        setTimeout(() => {
            setSubjects(current => current.filter(s => s.id !== id));
            setRemovingSubjects(prev => prev.filter(rId => rId !== id));
            toast.success(t.toastSubjectRestored); 
        }, 400);
    };

    const handleHardDeleteSubject = async (id: number) => {
        if (!window.confirm(t.confirmDeleteSubject)) return;
        setRemovingSubjects(prev => [...prev, id]);
        await hardDeleteSubject(id);
        setTimeout(() => {
            setSubjects(current => current.filter(s => s.id !== id));
            setRemovingSubjects(prev => prev.filter(rId => rId !== id));
        }, 400);
    };

    const handleRestoreTask = async (subjectId: number, taskId: number) => {
        setRemovingTasks(prev => [...prev, taskId]);
        await restoreTask(subjectId, taskId);
        setTimeout(() => {
            setTasks(current => current.filter(t => t.id !== taskId));
            setRemovingTasks(prev => prev.filter(rId => rId !== taskId));
            toast.success(t.toastTaskRestored);
        }, 400);
    };

    const handleHardDeleteTask = async (subjectId: number, taskId: number) => {
        if (!window.confirm(t.confirmDeleteTask)) return;
        setRemovingTasks(prev => [...prev, taskId]);
        await hardDeleteTask(subjectId, taskId);
        setTimeout(() => {
            setTasks(current => current.filter(t => t.id !== taskId));
            setRemovingTasks(prev => prev.filter(rId => rId !== taskId));
        }, 400);
    };

    const handleEmptyTrash = async () => {
        if (!window.confirm(t.confirmEmptyTrash)) return;
        
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
            toast.success(t.toastTrashEmptied);
        } catch (error) {
            console.error("Error al vaciar la papelera:", error);
            alert(t.errEmptyTrash);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 flex flex-col overflow-y-auto transition-colors duration-500">
            
            {/* Cabecera con el botón de Vaciar Papelera */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-500 transition-colors duration-300">
                        <Trash2 size={28} />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">{t.title}</h1>
                    </div>
                </div>

                {/* Botón de Vaciar Papelera (Solo aparece si no está vacía) */}
                {(subjects.length > 0 || tasks.length > 0) && (
                    <button 
                        onClick={handleEmptyTrash}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all duration-300 disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        <span>{t.emptyTrashBtn}</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-300">{t.loading}</div>
            ) : subjects.length === 0 && tasks.length === 0 ? (
                // Estado vacío más visual adaptado
                <div className="flex-1 flex flex-col items-center justify-center gap-3 transition-colors duration-300">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full text-gray-400 dark:text-gray-600 mb-2 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <Inbox size={48} strokeWidth={1} />
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200 transition-colors duration-300">{t.emptyStateTitle}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{t.emptyStateDesc}</p>
                </div>
            ) : (
                <div className="space-y-8 flex-1">
                        {/* Sección Asignaturas */}
                        {subjects.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 transition-colors duration-300">{t.subjectsTitle}</h2>
                                <div className="flex flex-col gap-3">
                                    {subjects.map(s => {
                                        const isRemoving = removingSubjects.includes(s.id);
                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`transition-all duration-400 ease-in-out flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden ${
                                                    isRemoving ? "opacity-0 scale-95 max-h-0 p-0 border-transparent dark:border-transparent mb-[-0.75rem]" : "opacity-100 scale-100 max-h-[100px] p-4"
                                                }`}
                                            >
                                                <span className="font-semibold text-gray-700 dark:text-gray-200 transition-colors duration-300">{s.name}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRestoreSubject(s.id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"><RotateCcw size={18}/></button>
                                                    <button onClick={() => handleHardDeleteSubject(s.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"><X size={18}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sección Tareas */}
                        {tasks.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 transition-colors duration-300">{t.tasksTitle}</h2>
                                <div className="flex flex-col gap-3">
                                    {tasks.map(t => {
                                        const isRemoving = removingTasks.includes(t.id);
                                        return (
                                            <div 
                                                key={t.id} 
                                                className={`transition-all duration-400 ease-in-out flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden ${
                                                    isRemoving ? "opacity-0 scale-95 max-h-0 p-0 border-transparent dark:border-transparent mb-[-0.75rem]" : "opacity-100 scale-100 max-h-[100px] p-4"
                                                }`}
                                            >
                                                <span className="text-gray-700 dark:text-gray-200 transition-colors duration-300">{t.title}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleRestoreTask(t.subjectId, t.id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200">
                                                        <RotateCcw size={18}/>
                                                    </button>
                                                    <button onClick={() => handleHardDeleteTask(t.subjectId, t.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200">
                                                        <X size={18}/>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
};