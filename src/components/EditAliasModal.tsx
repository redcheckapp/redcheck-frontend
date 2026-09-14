import { useState } from "react";
import { X, UserRound, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";
import { ModalOverlay } from "./ModalOverlay";
import { updateAlias } from "../api/userApi";

interface EditAliasModalProps {
    isOpen: boolean;
    onClose: () => void;
    // The current username, shown as a placeholder/hint for what an empty
    // alias falls back to (see redcheck-backend's User#getDisplayAlias).
    username: string;
    currentAlias: string;
    // Called with the alias the backend now has in effect (the trimmed
    // input, or the username itself if the field was cleared) so the
    // dashboard greeting updates immediately without a re-fetch.
    onAliasUpdated: (alias: string) => void;
}

const ALIAS_MAX_LENGTH = 30;

// --- Translation dictionary for EditAliasModal ---
const translations = {
    es: {
        title: "Editar alias",
        subtitle: "Así te saludará el panel — puedes cambiarlo cuando quieras",
        close: "Cerrar",
        lblAlias: "Alias",
        hint: "Déjalo vacío para usar tu nombre de usuario",
        btnCancel: "Cancelar",
        btnSave: "Guardar",
        errTooLong: `El alias no puede superar los ${ALIAS_MAX_LENGTH} caracteres.`,
        errGeneric: "No se pudo actualizar el alias. Inténtalo de nuevo.",
        success: "Alias actualizado."
    },
    en: {
        title: "Edit alias",
        subtitle: "This is how the dashboard greets you — change it whenever you like",
        close: "Close",
        lblAlias: "Alias",
        hint: "Leave it empty to use your username instead",
        btnCancel: "Cancel",
        btnSave: "Save",
        errTooLong: `Alias can't be longer than ${ALIAS_MAX_LENGTH} characters.`,
        errGeneric: "Couldn't update your alias. Please try again.",
        success: "Alias updated."
    }
};

export const EditAliasModal = ({ isOpen, onClose, username, currentAlias, onAliasUpdated }: EditAliasModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [alias, setAlias] = useState(currentAlias);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        if (submitting) return;
        onClose();
        // Same reset-after-close-animation pattern as ChangePasswordModal —
        // avoids flashing the form back to its opening value mid-close.
        setTimeout(() => setAlias(currentAlias), 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = alias.trim();
        if (trimmed.length > ALIAS_MAX_LENGTH) {
            toast.error(t.errTooLong);
            return;
        }

        setSubmitting(true);
        try {
            await updateAlias(trimmed);
            toast.success(t.success);
            onAliasUpdated(trimmed || username);
            onClose();
            setTimeout(() => setAlias(trimmed || username), 300);
        } catch (error) {
            console.error("Error updating alias:", error);
            toast.error(t.errGeneric);
        } finally {
            setSubmitting(false);
        }
    };

    const labelClass = "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider";

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 transition-colors duration-300">
                        <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            <UserRound size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                                {t.title}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">
                                {t.subtitle}
                            </p>
                        </div>
                        <button onClick={handleClose} aria-label={t.close} title={t.close} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
                        <label className="flex flex-col gap-1.5">
                            <span className={labelClass}>{t.lblAlias}</span>
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                maxLength={ALIAS_MAX_LENGTH}
                                autoFocus
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-500">{t.hint}</span>
                        </label>

                        <div className="flex items-center justify-end gap-2 mt-2 pt-1">
                            <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-xl transition-all duration-200">
                                {t.btnCancel}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {t.btnSave}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </ModalOverlay>
    );
};
