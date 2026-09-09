import { useEffect, useRef, useState } from "react";
import { Archive, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import type { SubjectWithTasks } from "../types";

interface ArchivedSubjectsPopoverProps {
    subjects: SubjectWithTasks[]; // already filtered to archived === true by the caller
    onRestore: (subjectId: number) => Promise<void>;
    onClose: () => void;
}

// --- Translation dictionary for ArchivedSubjectsPopover ---
const translations = {
    es: {
        title: "Asignaturas archivadas",
        restore: "Restaurar",
        toastRestored: "Asignatura restaurada",
        empty: "No quedan asignaturas archivadas."
    },
    en: {
        title: "Archived subjects",
        restore: "Restore",
        toastRestored: "Subject restored",
        empty: "No archived subjects left."
    }
};

// Trigger lives inline in DashboardPage's bulk-actions row (only rendered
// when there's at least one archived subject, so it takes zero space
// otherwise) — this is the flyout it opens. Same click-outside/Escape
// dismissal as AgendaView's DatePickerPopover, and the same "fade the row
// out locally before it actually leaves the list" restore animation as
// TrashView, rather than the instant snap SettingsModal's old archived
// section had.
export const ArchivedSubjectsPopover = ({ subjects, onRestore, onClose }: ArchivedSubjectsPopoverProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const containerRef = useRef<HTMLDivElement>(null);
    const [localSubjects, setLocalSubjects] = useState(subjects);
    const [removingIds, setRemovingIds] = useState<number[]>([]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
        };
        const handleEscKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscKeyDown);
        };
    }, [onClose]);

    const handleRestoreClick = async (subjectId: number) => {
        setRemovingIds(prev => [...prev, subjectId]);
        try {
            await onRestore(subjectId);
            toast.success(t.toastRestored);
        } finally {
            setTimeout(() => {
                setLocalSubjects(current => current.filter(s => s.id !== subjectId));
                setRemovingIds(prev => prev.filter(id => id !== subjectId));
            }, 400);
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute top-full left-0 mt-2 z-50 w-72 max-h-80 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-2 animate-soft-fade"
        >
            <div className="flex items-center gap-2 px-2 py-2 mb-1 border-b border-gray-50 dark:border-gray-800">
                <Archive size={14} className="text-gray-400 dark:text-gray-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t.title}</span>
            </div>

            {localSubjects.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">{t.empty}</p>
            ) : (
                <div className="flex flex-col gap-1">
                    {localSubjects.map(subject => {
                        const isRemoving = removingIds.includes(subject.id);
                        return (
                            <div
                                key={subject.id}
                                className={`flex items-center justify-between gap-2 px-2 rounded-xl transition-all duration-300 ease-in-out overflow-hidden ${
                                    isRemoving ? "opacity-0 scale-95 max-h-0 py-0" : "opacity-100 scale-100 max-h-12 py-2"
                                }`}
                            >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{subject.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRestoreClick(subject.id)}
                                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 rounded-lg transition-all"
                                >
                                    <RotateCcw size={12} /> {t.restore}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
