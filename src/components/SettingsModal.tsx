import { X, ArchiveRestore, Trash2 } from "lucide-react";
import type { SubjectWithTasks } from "../types";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectWithTasks[];
    handleArchiveSubject: (id: number) => void;
    handleDeleteAccount: () => void; 
}

export const SettingsModal = ({ isOpen, onClose, subjects, handleArchiveSubject, handleDeleteAccount }: SettingsModalProps) => {
    if (!isOpen) return null;

    // We filter to keep ONLY the archived subjects
    const archivedSubjects = subjects.filter(subject => subject.archived);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
            
            {/* Modal container with entry animation */}
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Ajustes</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition rounded-lg p-1 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                    
                    {/* Section 1: Archived Subjects */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Asignaturas Archivadas</h3>
                        
                        {archivedSubjects.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No tienes asignaturas archivadas.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {archivedSubjects.map(subject => (
                                    <div key={subject.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                {subject.name}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleArchiveSubject(subject.id)}
                                            className="p-2 rounded-lg transition flex items-center gap-2 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        >
                                            <ArchiveRestore size={14} />
                                            Restaurar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Danger Zone */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider">Zona de peligro</h3>
                        <p className="text-xs text-gray-500">Esta acción es irreversible. Se borrarán todos tus datos y tareas.</p>
                        <button 
                            onClick={handleDeleteAccount}
                            className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition font-medium text-sm"
                        >
                            <Trash2 size={16} />
                            Borrar cuenta
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};