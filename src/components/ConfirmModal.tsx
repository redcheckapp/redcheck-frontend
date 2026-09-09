import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { ModalOverlay } from "./ModalOverlay";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

// --- Translation dictionary for ConfirmModal ---
const translations = {
    es: {
        btnCancel: "Cancelar",
        btnConfirm: "Eliminar"
    },
    en: {
        btnCancel: "Cancel",
        btnConfirm: "Delete"
    }
};

// The one confirm dialog for the whole app (see ConfirmContext's
// useConfirm()) — every destructive action here was a native
// window.confirm() before, so this is deliberately a single reusable
// component rather than one modal per call site. Every current caller is a
// destructive/irreversible action (delete subject/task/routine/account,
// empty trash), so this is styled for that case only (red icon badge, red
// confirm button) rather than adding an unused "danger vs. neutral" prop.
export const ConfirmModal = ({ isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    return (
        <ModalOverlay isOpen={isOpen} onClose={onCancel}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-start gap-3 p-5 sm:p-6">
                        <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 px-5 sm:px-6 pb-5 sm:pb-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-xl transition-all duration-200"
                        >
                            {cancelLabel ?? t.btnCancel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {confirmLabel ?? t.btnConfirm}
                        </button>
                    </div>
                </div>
            )}
        </ModalOverlay>
    );
};
