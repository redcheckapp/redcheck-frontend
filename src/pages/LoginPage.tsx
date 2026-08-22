import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { Check, Sun, Moon } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";
import { useTheme } from "../context/ThemeContext";

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

const LoginPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [init, setInit] = useState(false);

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

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
            setError("Correo o contraseña incorrectos");
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        setForm({ email: "demo@redcheck.com", password: "demo1234" });

        try {
            const response = await login({ email: "demo@redcheck.com", password: "demo1234" });
            localStorage.setItem("token", response.token); 
            navigate("/dashboard");
        } catch(err) {
            setError("Error al acceder a la cuenta de demostración. Asegúrate de que el backend la ha inicializado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 overflow-hidden p-4">
            
            <BackgroundParticles init={init} />

            {/* BOTÓN FLOTANTE MODO NOCHE (ESQUINA INFERIOR IZQUIERDA) */}
            <button
                onClick={toggleTheme}
                className="fixed bottom-4 left-4 z-50 p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 active:scale-95"
                title="Cambiar tema"
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

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
                                <span>Agenda</span>
                                <span>Inteligente</span>
                                <span>Interactiva</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-6 transition-colors duration-300"></div>

                    <h2 className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">
                        Iniciar sesión
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Correo electrónico</label>
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
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Contraseña</label>
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
                        {loading ? "Cargando..." : "Entrar a RedCheck"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="w-full bg-emerald-600 dark:bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        🚀 Demo
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
                    ¿Aún no tienes una cuenta?{" "}
                    <a href="/register" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                        Regístrate aquí
                    </a>
                </p>

                {/* --- ENLACES LEGALES RGPD --- */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 transition-colors duration-300">
                    <a href="/terms" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Aviso Legal</a>
                    <span>•</span>
                    <a href="/privacy" target="_blank" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Política de Privacidad</a>
                </div>

            </div>
            </div>
        </PageTransition>
    );
};

export default LoginPage;