import { useState } from "react";
import { isAxiosError } from "axios";
import { X, KeyRound, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";
import { ModalOverlay } from "./ModalOverlay";
import { PasswordInput } from "./PasswordInput";
import { changePassword } from "../api/userApi";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    // A Google-only account (no password yet) gets a "set a password" framing
    // instead of "change password" — see redcheck-backend's User.password,
    // nullable for accounts created via Sign in with Google.
    hasPassword: boolean;
}

// --- Translation dictionary for ChangePasswordModal ---
const translations = {
    es: {
        title: "Cambiar contraseña",
        titleSet: "Crear contraseña",
        subtitle: "Actualiza la contraseña de tu cuenta",
        subtitleSet: "Tu cuenta usa Google — crea una contraseña para poder iniciar sesión también con tu email",
        close: "Cerrar",
        lblCurrent: "Contraseña actual",
        lblNew: "Nueva contraseña",
        lblConfirm: "Confirmar nueva contraseña",
        btnCancel: "Cancelar",
        btnSave: "Guardar",
        errMismatch: "Las contraseñas no coinciden.",
        errTooShort: "La nueva contraseña debe tener al menos 8 caracteres.",
        errWrongCurrent: "La contraseña actual es incorrecta.",
        errSameAsCurrent: "La nueva contraseña debe ser distinta de la actual.",
        errGeneric: "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
        successChange: "Contraseña actualizada.",
        successSet: "Contraseña creada."
    },
    en: {
        title: "Change password",
        titleSet: "Set a password",
        subtitle: "Update your account's password",
        subtitleSet: "Your account uses Google — set a password so you can also sign in with your email",
        close: "Close",
        lblCurrent: "Current password",
        lblNew: "New password",
        lblConfirm: "Confirm new password",
        btnCancel: "Cancel",
        btnSave: "Save",
        errMismatch: "The passwords don't match.",
        errTooShort: "The new password must be at least 8 characters long.",
        errWrongCurrent: "Your current password is incorrect.",
        errSameAsCurrent: "The new password must be different from the current one.",
        errGeneric: "Couldn't update your password. Please try again.",
        successChange: "Password updated.",
        successSet: "Password created."
    }
};

const NEW_PASSWORD_MIN_LENGTH = 8;

export const ChangePasswordModal = ({ isOpen, onClose, hasPassword }: ChangePasswordModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        if (submitting) return;
        onClose();
        // Same reset-after-close-animation pattern as FeedbackModal — avoids
        // flashing the form back to empty mid-close.
        setTimeout(() => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < NEW_PASSWORD_MIN_LENGTH) {
            toast.error(t.errTooShort);
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t.errMismatch);
            return;
        }
        if (hasPassword && newPassword === currentPassword) {
            toast.error(t.errSameAsCurrent);
            return;
        }

        setSubmitting(true);
        try {
            await changePassword(hasPassword ? currentPassword : null, newPassword);
            toast.success(hasPassword ? t.successChange : t.successSet);
            handleClose();
        } catch (error) {
            console.error("Error changing password:", error);
            if (isAxiosError(error) && error.response?.status === 400) {
                toast.error(t.errWrongCurrent);
            } else if (isAxiosError(error) && error.response?.status === 409) {
                toast.error(t.errSameAsCurrent);
            } else {
                toast.error(t.errGeneric);
            }
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
                            <KeyRound size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                                {hasPassword ? t.title : t.titleSet}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">
                                {hasPassword ? t.subtitle : t.subtitleSet}
                            </p>
                        </div>
                        <button onClick={handleClose} aria-label={t.close} title={t.close} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
                        {hasPassword && (
                            <label className="flex flex-col gap-1.5">
                                <span className={labelClass}>{t.lblCurrent}</span>
                                <PasswordInput
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    autoFocus
                                    required
                                />
                            </label>
                        )}

                        <label className="flex flex-col gap-1.5">
                            <span className={labelClass}>{t.lblNew}</span>
                            <PasswordInput
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={NEW_PASSWORD_MIN_LENGTH}
                                autoFocus={!hasPassword}
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className={labelClass}>{t.lblConfirm}</span>
                            <PasswordInput
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                minLength={NEW_PASSWORD_MIN_LENGTH}
                                required
                            />
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
