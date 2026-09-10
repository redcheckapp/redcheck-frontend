import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { login, loginWithGoogle } from "../api/authApi";
import { Check, Loader2 } from "lucide-react";
import { PageTransition } from "../components/PageTransition";
import { AuthFloatingNav } from "../components/AuthFloatingNav";
import { PasswordInput } from "../components/PasswordInput";
import { useLanguage } from "../context/LanguageContext"; // <-- New context
import { useTheme } from "../context/ThemeContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Temporarily disabled: the Google Cloud project's OAuth consent screen is
// stuck showing "requires verification" even after removing the sensitive
// Calendar scopes that triggered it (see redcheck-backend/frontend CLAUDE.md,
// "Sign in with Google"). All the code/config stays in place — flip this back
// to true (and restore LoginPage.test.tsx's matching assertion) once that
// clears and real sign-ins work again.
const GOOGLE_SIGN_IN_ENABLED = false;

// --- Translation dictionary ---
const translations = {
    es: {
        loginTitle: "Iniciar sesión",
        emailOrUsername: "Correo electrónico o usuario",
        password: "Contraseña",
        loginBtn: "Entrar a RedCheck",
        loading: "Cargando...",
        demoBtn: "Demo",
        noAccount: "¿Aún no tienes una cuenta?",
        register: "Regístrate aquí",
        legal: "Aviso Legal",
        privacy: "Política de Privacidad",
        errCreds: "Correo/usuario o contraseña incorrectos",
        errDemo: "Error al acceder a la cuenta de demostración. Asegúrate de que el backend la ha inicializado.",
        errGoogle: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
        forgotPassword: "¿Olvidaste tu contraseña?",
        orContinueWith: "o continúa con",
        tags: ["Agenda", "Inteligente", "Interactiva"],
        copyright: "© 2026 RedCheck. Desarrollado por Francisco Javier Molina Cuenca. Todos los derechos reservados."
    },
    en: {
        loginTitle: "Sign in",
        emailOrUsername: "Email or username",
        password: "Password",
        loginBtn: "Log in to RedCheck",
        loading: "Loading...",
        demoBtn: "Demo",
        noAccount: "Don't have an account yet?",
        register: "Register here",
        legal: "Legal Notice",
        privacy: "Privacy Policy",
        errCreds: "Incorrect email/username or password",
        errDemo: "Error accessing demo account. Make sure the backend initialized it.",
        errGoogle: "Couldn't sign in with Google. Please try again.",
        forgotPassword: "Forgot your password?",
        orContinueWith: "or continue with",
        tags: ["AI-Powered", "Smart", "Planner"],
        copyright: "© 2026 RedCheck. Developed by Francisco Javier Molina Cuenca. All rights reserved."
    }
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { theme } = useTheme();
    const t = translations[language as keyof typeof translations];

    const [form, setForm] = useState({ emailOrUsername: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setError(null);
        setLoading(true);

        try {
            const response = await login(form);
            localStorage.setItem("token", response.token); 
            navigate("/dashboard");
        } catch {
            setError(t.errCreds);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setError(t.errGoogle);
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const response = await loginWithGoogle(credentialResponse.credential);
            localStorage.setItem("token", response.token);
            navigate("/dashboard");
        } catch {
            setError(t.errGoogle);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // We select the demo email based on the current language
        const demoEmail = language === 'en' ? "demo-en@redcheck.com" : "demo-es@redcheck.com";

        setForm({ emailOrUsername: demoEmail, password: "demo1234" });

        try {
            const response = await login({ emailOrUsername: demoEmail, password: "demo1234" });
            localStorage.setItem("token", response.token); 
            navigate("/dashboard");
        } catch {
            setError(t.errDemo);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen flex flex-col items-center justify-center overflow-y-auto p-4 py-8">

            <AuthFloatingNav backHref="https://redcheckapp.com" backAriaLabel="Back to redcheckapp.com" />

            <div className="relative z-10 bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500">

                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <div className="bg-[#cc2229] w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check size={36} strokeWidth={4} className="text-white" />
                        </div>
                        <div className="flex flex-col justify-center w-max">
                            <span className="text-[34px] font-black text-gray-900 dark:text-white leading-none tracking-tight transition-colors duration-300">
                                REDCHECK
                            </span>
                            <div className="flex justify-between w-full text-[11px] font-bold text-gray-800 dark:text-gray-300 mt-1.5 tracking-wide transition-colors duration-300">
                                <span>{t.tags[0]}</span>
                                <span>{t.tags[1]}</span>
                                <span>{t.tags[2]}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-6 transition-colors duration-300"></div>

                    <h2 className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">
                        {t.loginTitle}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="login-identifier" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                            {t.emailOrUsername}
                        </label>
                        <input
                            id="login-identifier"
                            type="text"
                            name="emailOrUsername"
                            autoComplete="username"
                            value={form.emailOrUsername}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="login-password" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                                {t.password}
                            </label>
                            <Link to="/forgot-password" className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                                {t.forgotPassword}
                            </Link>
                        </div>
                        <PasswordInput
                            id="login-password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
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
                        {loading ? t.loading : t.loginBtn}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {t.demoBtn}
                    </button>
                </form>

                {GOOGLE_SIGN_IN_ENABLED && GOOGLE_CLIENT_ID && (
                    <div className="mt-6">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 transition-colors duration-300" />
                            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                {t.orContinueWith}
                            </span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 transition-colors duration-300" />
                        </div>
                        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                            <div className="mt-4 flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError(t.errGoogle)}
                                    theme={theme === "dark" ? "filled_black" : "outline"}
                                    shape="pill"
                                    text="continue_with"
                                    locale={language}
                                />
                            </div>
                        </GoogleOAuthProvider>
                    </div>
                )}

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
                    {t.noAccount}{" "}
                    <Link to="/register" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                        {t.register}
                    </Link>
                </p>

                {/* --- GDPR LEGAL LINKS AND COPYRIGHT --- */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3 transition-colors duration-300">
                    <div className="flex justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-500">
                        <a href="/terms" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.legal}</a>
                        <span>•</span>
                        <a href="/privacy" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.privacy}</a>
                    </div>
                    <p className="text-[10px] text-gray-500/80 dark:text-gray-500/70 text-center">
                        {t.copyright}
                    </p>
                </div>

            </div>
            </div>
        </PageTransition>
    );
};

export default LoginPage;