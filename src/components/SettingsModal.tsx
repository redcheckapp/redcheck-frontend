import { X, ArchiveRestore, Trash2, Moon, Sun } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { useTheme } from "../context/ThemeContext"; // <-- Ajusta la ruta si es necesario

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectWithTasks[];
    handleArchiveSubject: (id: number) => void;
    handleDeleteAccount: () => void; 
    userEmail: string;
}

export const SettingsModal = ({ isOpen, onClose, subjects, handleArchiveSubject, handleDeleteAccount, userEmail }: SettingsModalProps) => {
    const { theme, toggleTheme } = useTheme();

    if (!isOpen) return null;

    // We filter to keep ONLY the archived subjects
    const archivedSubjects = subjects.filter(subject => subject.archived);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
            
            {/* Modal container with entry animation and DARK MODE styles */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ajustes</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                    
                    {/* Section 1: Appearance */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Apariencia</h3>
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    Modo Oscuro
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    Ajustar el tema visual
                                </p>
                            </div>
                            <button 
                                onClick={toggleTheme}
                                className="p-2 rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
                                title="Cambiar tema"
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Archived Subjects */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asignaturas Archivadas</h3>
                        
                        {archivedSubjects.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No tienes asignaturas archivadas.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {archivedSubjects.map(subject => (
                                    <div key={subject.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                {subject.name}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleArchiveSubject(subject.id)}
                                            className="p-2 rounded-lg transition flex items-center gap-2 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                        >
                                            <ArchiveRestore size={14} />
                                            Restaurar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Danger Zone */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                        <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">Zona de peligro</h3>
                        
                        {userEmail === 'demo@redcheck.com' ? (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Por motivos de seguridad, la eliminación de cuenta está desactivada en el entorno de demostración.
                                </p>
                                <button 
                                    disabled
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed font-medium text-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Borrar cuenta (Deshabilitado)
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Esta acción es irreversible. Se borrarán todos tus datos y tareas.</p>
                                <button 
                                    onClick={handleDeleteAccount}
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition font-medium text-sm"
                                >
                                    <Trash2 size={16} />
                                    Borrar cuenta
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};