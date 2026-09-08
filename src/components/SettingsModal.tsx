import { X, ArchiveRestore, Trash2, Moon, Sun, Bell, BellOff } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { ModalOverlay } from "./ModalOverlay";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectWithTasks[];
    handleArchiveSubject: (id: number) => void;
    handleDeleteAccount: () => void;
    userEmail: string;
    remindersEnabled: boolean;
    onToggleReminders: () => void;
}

// --- Translation dictionary for SettingsModal ---
const translations = {
    es: {
        title: "Ajustes",
        appearance: "Apariencia",
        darkMode: "Modo Oscuro",
        themeDesc: "Ajustar el tema visual",
        ttTheme: "Cambiar tema",
        language: "Idioma",
        langDesc: "Cambiar el idioma de la aplicación",
        ttLanguage: "Cambiar idioma",
        reminders: "Recordatorios de tareas",
        remindersDesc: "Avisa cuando una tarea esté por vencer (solo con la app abierta)",
        ttReminders: "Activar/desactivar recordatorios",
        archived: "Asignaturas Archivadas",
        noArchived: "No tienes asignaturas archivadas.",
        btnRestore: "Restaurar",
        dangerZone: "Zona de peligro",
        demoWarning: "Por motivos de seguridad, la eliminación de cuenta está desactivada en el entorno de demostración.",
        btnDeleteDemo: "Borrar cuenta (Deshabilitado)",
        deleteWarning: "Esta acción es irreversible. Se borrarán todos tus datos y tareas.",
        btnDelete: "Borrar cuenta"
    },
    en: {
        title: "Settings",
        appearance: "Appearance",
        darkMode: "Dark Mode",
        themeDesc: "Adjust visual theme",
        ttTheme: "Toggle theme",
        language: "Language",
        langDesc: "Change application language",
        ttLanguage: "Change language",
        reminders: "Task reminders",
        remindersDesc: "Get notified when a task is about to be due (app must be open)",
        ttReminders: "Turn reminders on/off",
        archived: "Archived Subjects",
        noArchived: "You have no archived subjects.",
        btnRestore: "Restore",
        dangerZone: "Danger Zone",
        demoWarning: "For security reasons, account deletion is disabled in the demo environment.",
        btnDeleteDemo: "Delete account (Disabled)",
        deleteWarning: "This action is irreversible. All your data and tasks will be deleted.",
        btnDelete: "Delete account"
    }
};

export const SettingsModal = ({ isOpen, onClose, subjects, handleArchiveSubject, handleDeleteAccount, userEmail, remindersEnabled, onToggleReminders }: SettingsModalProps) => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage(); // We extract the language and the toggle function
    const t = translations[language as keyof typeof translations];

    // We filter to keep ONLY the archived subjects
    const archivedSubjects = subjects.filter(subject => subject.archived);

    // ModalOverlay renders into document.body so it covers the entire window (including the Sidebar)
    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
            <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden transition-all duration-200 border border-transparent dark:border-gray-800 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                    
                    {/* Section 1: Appearance & Language */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.appearance}</h3>
                        
                        {/* Language selector (New) */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.language}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {t.langDesc}
                                </p>
                            </div>
                            <button 
                                onClick={toggleLanguage}
                                className="p-2 w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-lg hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
                                title={t.ttLanguage}
                            >
                                {/* Show the flag for the current language */}
                                {language === 'es' ? '🇪🇸' : '🇬🇧'}
                            </button>
                        </div>

                        {/* Dark mode toggle (Original) */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.darkMode}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {t.themeDesc}
                                </p>
                            </div>
                            <button 
                                onClick={toggleTheme}
                                className="p-2 w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
                                title={t.ttTheme}
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>

                        {/* Task reminders toggle — client-side only, no
                            backend push involved (see CLAUDE.md). */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.reminders}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {t.remindersDesc}
                                </p>
                            </div>
                            <button
                                onClick={onToggleReminders}
                                className={`p-2 w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all duration-200 border shadow-sm ${
                                    remindersEnabled
                                        ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400"
                                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                }`}
                                title={t.ttReminders}
                            >
                                {remindersEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Archived Subjects */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.archived}</h3>
                        
                        {archivedSubjects.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">{t.noArchived}</p>
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
                                            {t.btnRestore}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Danger Zone */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                        <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">{t.dangerZone}</h3>
                        
                        {userEmail === 'demo-es@redcheck.com' || userEmail === 'demo-en@redcheck.com' ? (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t.demoWarning}
                                </p>
                                <button 
                                    disabled
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed font-medium text-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                    {t.btnDeleteDemo}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t.deleteWarning}</p>
                                <button 
                                    onClick={handleDeleteAccount}
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition font-medium text-sm"
                                >
                                    <Trash2 size={16} />
                                    {t.btnDelete}
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>
            )}
        </ModalOverlay>
    );
};