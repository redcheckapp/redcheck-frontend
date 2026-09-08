import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { Check, Sun, Moon } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext"; // <-- New context

// --- We extract the particles to an immutable component ---
const BackgroundParticles = memo(({ init }: { init: boolean }) => {
    if (!init) return null;
    
    return (
        <Particles
            id="tsparticles"
            className="absolute inset-0 z-0"
            options={{
                background: {
                    color: { value: "transparent" },
                },
                fpsLimit: 120,
                particles: {
                    color: { value: "#9ca3af" }, 
                    links: {
                        color: "#9ca3af",      
                        distance: 150,
                        enable: true,
                        opacity: 0.2,          
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1.0,            
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 60,             
                    },
                    opacity: { value: 0.3 },
                    shape: { type: "circle" },
                    size: { value: { min: 1, max: 2 } },
                },
                detectRetina: true,
            }}
        />
    );
});

// --- Translation dictionary ---
const translations = {
    es: {
        loginTitle: "Iniciar sesión",
        email: "Correo electrónico",
        password: "Contraseña",
        loginBtn: "Entrar a RedCheck",
        loading: "Cargando...",
        demoBtn: "Demo",
        noAccount: "¿Aún no tienes una cuenta?",
        register: "Regístrate aquí",
        legal: "Aviso Legal",
        privacy: "Política de Privacidad",
        errCreds: "Correo o contraseña incorrectos",
        errDemo: "Error al acceder a la cuenta de demostración. Asegúrate de que el backend la ha inicializado.",
        tags: ["Agenda", "Inteligente", "Interactiva"],
        copyright: "© 2026 RedCheck. Desarrollado por Francisco Javier Molina Cuenca. Todos los derechos reservados."
    },
    en: {
        loginTitle: "Sign in",
        email: "Email address",
        password: "Password",
        loginBtn: "Log in to RedCheck",
        loading: "Loading...",
        demoBtn: "Demo",
        noAccount: "Don't have an account yet?",
        register: "Register here",
        legal: "Legal Notice",
        privacy: "Privacy Policy",
        errCreds: "Incorrect email or password",
        errDemo: "Error accessing demo account. Make sure the backend initialized it.",
        tags: ["AI-Powered", "Smart", "Planner"],
        copyright: "© 2026 RedCheck. Developed by Francisco Javier Molina Cuenca. All rights reserved."
    }
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [init, setInit] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

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
        } catch(err) {
            setError(t.errCreds);
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

        setForm({ email: demoEmail, password: "demo1234" });

        try {
            const response = await login({ email: demoEmail, password: "demo1234" });
            localStorage.setItem("token", response.token); 
            navigate("/dashboard");
        } catch(err) {
            setError(t.errDemo);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 overflow-hidden p-4">
            
            <BackgroundParticles init={init} />

            {/* FLOATING CONTROLS (LANGUAGE AND THEME) */}
            <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-3">
                <button
                    onClick={toggleLanguage}
                    className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 active:scale-95 flex items-center justify-center text-lg"
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                    {language === 'es' ? '🇬🇧' : '🇪🇸'}
                </button>
                
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 active:scale-95 flex items-center justify-center"
                    title={language === 'es' ? 'Cambiar tema' : 'Toggle theme'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <div className="relative z-10 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500">

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
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                            {t.email}
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">
                            {t.password}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
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
                        className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 mt-2"
                    >
                        {loading ? t.loading : t.loginBtn}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {t.demoBtn}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
                    {t.noAccount}{" "}
                    <a href="/register" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                        {t.register}
                    </a>
                </p>

                {/* --- GDPR LEGAL LINKS AND COPYRIGHT --- */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3 transition-colors duration-300">
                    <div className="flex justify-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
                        <a href="/terms" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.legal}</a>
                        <span>•</span>
                        <a href="/privacy" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.privacy}</a>
                    </div>
                    <p className="text-[10px] text-gray-400/80 dark:text-gray-500/70 text-center">
                        {t.copyright}
                    </p>
                </div>

            </div>
            </div>
        </PageTransition>
    );
};

export default LoginPage;