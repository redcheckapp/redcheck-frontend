import { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../api/authApi";
import { PageTransition } from "../components/PageTransition";
import { AuthFloatingNav } from "../components/AuthFloatingNav";
import { useLanguage } from "../context/LanguageContext";

// --- Translation dictionary ---
const translations = {
    es: {
        title: "Restablece tu contraseña",
        subtitle: "Elige una nueva contraseña para tu cuenta.",
        newPassword: "Nueva contraseña",
        confirmPassword: "Confirmar nueva contraseña",
        submit: "Restablecer contraseña",
        loading: "Guardando...",
        backToLogin: "Volver a iniciar sesión",
        successTitle: "Contraseña actualizada",
        successBody: "Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión con ella.",
        goToLogin: "Iniciar sesión",
        invalidTitle: "Enlace no válido",
        invalidBody: "Este enlace para restablecer la contraseña no es válido o ha caducado.",
        requestNewLink: "Solicitar un nuevo enlace",
        errMismatch: "Las contraseñas no coinciden.",
        errTooShort: "La contraseña debe tener al menos 8 caracteres.",
        errInvalidToken: "Este enlace no es válido o ha caducado.",
        errGeneric: "No se pudo restablecer la contraseña. Inténtalo de nuevo."
    },
    en: {
        title: "Reset your password",
        subtitle: "Choose a new password for your account.",
        newPassword: "New password",
        confirmPassword: "Confirm new password",
        submit: "Reset password",
        loading: "Saving...",
        backToLogin: "Back to sign in",
        successTitle: "Password updated",
        successBody: "Your password has been reset successfully. You can now sign in with it.",
        goToLogin: "Sign in",
        invalidTitle: "Invalid link",
        invalidBody: "This password reset link is invalid or has expired.",
        requestNewLink: "Request a new link",
        errMismatch: "The passwords don't match.",
        errTooShort: "The password must be at least 8 characters long.",
        errInvalidToken: "This link is invalid or has expired.",
        errGeneric: "Couldn't reset your password. Please try again."
    }
};

const NEW_PASSWORD_MIN_LENGTH = 8;

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < NEW_PASSWORD_MIN_LENGTH) {
            setError(t.errTooShort);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t.errMismatch);
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token!, newPassword);
            setSuccess(true);
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 400) {
                setError(t.errInvalidToken);
            } else {
                setError(t.errGeneric);
            }
        } finally {
            setLoading(false);
        }
    };

    let content: React.ReactNode;

    if (!token) {
        content = (
            <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <ShieldAlert size={28} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.invalidTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.invalidBody}</p>
                <Link to="/forgot-password" className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                    {t.requestNewLink}
                </Link>
            </div>
        );
    } else if (success) {
        content = (
            <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={28} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.successTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.successBody}</p>
                <button
                    onClick={() => navigate("/login")}
                    className="mt-2 flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 shadow-sm hover:shadow"
                >
                    {t.goToLogin}
                </button>
            </div>
        );
    } else {
        content = (
            <>
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
                        <KeyRound size={26} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{t.subtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="reset-new-password" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                            {t.newPassword}
                        </label>
                        <input
                            id="reset-new-password"
                            type="password"
                            autoComplete="new-password"
                            autoFocus
                            minLength={NEW_PASSWORD_MIN_LENGTH}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="reset-confirm-password" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                            {t.confirmPassword}
                        </label>
                        <input
                            id="reset-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={NEW_PASSWORD_MIN_LENGTH}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg font-medium transition-colors duration-300">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 mt-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? t.loading : t.submit}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
                    <Link to="/login" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                        {t.backToLogin}
                    </Link>
                </p>
            </>
        );
    }

    return (
        <PageTransition>
            <div className="relative min-h-screen flex flex-col items-center justify-center overflow-y-auto p-4 py-8">

                <AuthFloatingNav onBack={() => navigate("/login")} backAriaLabel={language === 'es' ? 'Volver' : 'Back'} />

                <div className="relative z-10 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500">
                    {content}
                </div>
            </div>
        </PageTransition>
    );
};

export default ResetPasswordPage;
