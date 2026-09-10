import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { forgotPassword } from "../api/authApi";
import { PageTransition } from "../components/PageTransition";
import { AuthFloatingNav } from "../components/AuthFloatingNav";
import { useLanguage } from "../context/LanguageContext";

// --- Translation dictionary ---
const translations = {
    es: {
        title: "¿Olvidaste tu contraseña?",
        subtitle: "Introduce tu correo y te enviaremos un enlace para restablecerla.",
        email: "Correo electrónico",
        submit: "Enviar enlace",
        loading: "Enviando...",
        backToLogin: "Volver a iniciar sesión",
        sentTitle: "Revisa tu correo",
        sentBody: "Si existe una cuenta con ese correo, te hemos enviado un enlace para restablecer tu contraseña. Caduca en 30 minutos.",
        errGeneric: "No se pudo procesar la solicitud. Inténtalo de nuevo."
    },
    en: {
        title: "Forgot your password?",
        subtitle: "Enter your email and we'll send you a link to reset it.",
        email: "Email",
        submit: "Send reset link",
        loading: "Sending...",
        backToLogin: "Back to sign in",
        sentTitle: "Check your email",
        sentBody: "If an account exists for that email, we've sent a link to reset your password. It expires in 30 minutes.",
        errGeneric: "Couldn't process your request. Please try again."
    }
};

// Deliberately no per-field enumeration feedback (e.g. "no account with
// that email") — see redcheck-backend's AuthController#forgotPassword,
// which always responds 200 regardless of whether the email is registered.
// The success state below is shown unconditionally on any non-error
// response, matching that same "never reveal account existence" intent.
const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await forgotPassword(email.trim(), language);
            setSent(true);
        } catch {
            setError(t.errGeneric);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen flex flex-col items-center justify-center overflow-y-auto p-4 py-8">

                <AuthFloatingNav onBack={() => navigate("/login")} backAriaLabel={language === 'es' ? 'Volver' : 'Back'} />

                <div className="relative z-10 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500">
                    {sent ? (
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                <MailCheck size={28} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.sentTitle}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.sentBody}</p>
                            <Link to="/login" className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                                {t.backToLogin}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center mb-8 text-center">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{t.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="forgot-email" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                                        {t.email}
                                    </label>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default ForgotPasswordPage;
