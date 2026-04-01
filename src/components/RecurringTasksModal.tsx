import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Power, PowerOff, Pencil } from "lucide-react";
import { getRecurringTasks, toggleRecurringTaskActive, deleteRecurringTask, updateRecurringTask } from "../api/recurringTaskApi";

interface RecurringTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectId: number;
    subjectName: string;
}

export const RecurringTasksModal = ({ isOpen, onClose, subjectId, subjectName }: RecurringTasksModalProps) => {
    const [recurringTasks, setRecurringTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // States for editing
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ title: "", description: "", frequency: "DAILY" });

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await getRecurringTasks(subjectId);
            setRecurringTasks(data);
        } catch (error) {
            console.error("Error cargando rutinas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTasks();
            setEditingTaskId(null); // Resets the form when opening/closing
        }
    }, [isOpen, subjectId]);

    const handleToggle = async (taskId: number, currentActive: boolean) => {
        try {
            await toggleRecurringTaskActive(subjectId, taskId, !currentActive);
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, active: !currentActive } : t));
        } catch (error) {
            console.error("Error al cambiar estado:", error);
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!window.confirm("¿Seguro que quieres borrar esta rutina? No se generarán más tareas.")) return;
        try {
            await deleteRecurringTask(subjectId, taskId);
            setRecurringTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Error al borrar:", error);
        }
    };

    const handleStartEdit = (task: any) => {
        setEditingTaskId(task.id);
        setEditForm({ 
            title: task.title, 
            description: task.description || "", 
            frequency: task.frequency 
        });
    };

    const handleUpdateSubmit = async (e: React.FormEvent, taskId: number) => {
        e.preventDefault();
        try {
            const updatedTask = await updateRecurringTask(subjectId, taskId, {
                title: editForm.title,
                description: editForm.description,
                frequency: editForm.frequency,
                subjectId: subjectId
            });
            // We update visually
            setRecurringTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedTask } : t));
            setEditingTaskId(null); // We close the form
        } catch (error) {
            console.error("Error al actualizar la rutina:", error);
            alert("Hubo un error al actualizar la rutina.");
        }
    };

    const translateFrequency = (freq: string) => {
        const dict: Record<string, string> = { "DAILY": "Diaria", "WEEKLY": "Semanal", "BIWEEKLY": "Quincenal", "MONTHLY": "Mensual" };
        return dict[freq] || freq;
    };

    // Rendering control: if closed, we return nothing
    if (!isOpen) return null;

    // We use createPortal and anchor it to document.body
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Rutinas recurrentes</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Asignatura: {subjectName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Routines list */}
                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <p className="text-center text-gray-400 py-4 text-sm">Cargando rutinas...</p>
                    ) : recurringTasks.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No hay tareas recurrentes para esta asignatura.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recurringTasks.map(task => (
                                editingTaskId === task.id ? (
                                    /* INLINE EDIT MODE */
                                    <form key={task.id} onSubmit={(e) => handleUpdateSubmit(e, task.id)} className="flex flex-col gap-3 p-3.5 border border-purple-200 bg-purple-50/50 rounded-xl transition-all w-full">
                                        <div className="flex flex-col gap-1.5">
                                            <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" required placeholder="Título" />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="flex-1 bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Descripción (opcional)" />
                                            <select value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})} className="w-full sm:w-auto bg-white border border-gray-200 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer">
                                                <option value="DAILY">Diariamente</option>
                                                <option value="WEEKLY">Semanalmente</option>
                                                <option value="BIWEEKLY">Quincenalmente</option>
                                                <option value="MONTHLY">Mensualmente</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button type="button" onClick={() => setEditingTaskId(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-all">Cancelar</button>
                                            <button type="submit" className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-all">Guardar cambios</button>
                                        </div>
                                    </form>
                                ) : (
                                    /* VIEW MODE */
                                    <div key={task.id} className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${task.active ? 'border-purple-100 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className={`text-sm font-semibold truncate ${task.active ? 'text-gray-800' : 'text-gray-500'}`}>{task.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                    {translateFrequency(task.frequency)}
                                                </span>
                                                <span className="truncate">{task.description || "Sin descripción"}</span>
                                            </p>
                                        </div>
                                        
                                        {/* Action buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button 
                                                onClick={() => handleStartEdit(task)}
                                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                title="Editar rutina"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleToggle(task.id, task.active)}
                                                className={`p-2 rounded-lg transition-all ${task.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`}
                                                title={task.active ? "Pausar rutina" : "Reactivar rutina"}
                                            >
                                                {task.active ? <Power size={18} /> : <PowerOff size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(task.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Borrar rutina permanentemente"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body // The second parameter of createPortal
    );
};