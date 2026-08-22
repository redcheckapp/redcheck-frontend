import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/registerApi";
import { Check } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";

// --- Relaxing particles adapted to the light background ---
const BackgroundParticles = memo(({ init }: { init: boolean }) => {
    if (!init) return null;
    
    return (
        <Particles
            id="tsparticles-register"
            className="absolute inset-0 z-0"
            options={{
                background: {
                    color: { value: "transparent" },
                },
                fpsLimit: 120,
                particles: {
                    color: { value: "#9ca3af" }, // Soft gray
                    links: {
                        color: "#9ca3af",
                        distance: 150,
                        enable: true,
                        opacity: 0.2, // More transparent
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1.0, // Slower movement
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 60, // Less quantity
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
// -----------------------------------------------------------

const RegisterPage = () => {
    const navigate = useNavigate();

    const [init, setInit] = useState(false);

    const [form, setForm] = useState({
        username: "",
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
            await register(form);
            navigate("/login");
        } catch(err) {
            // Traducido y acortado para ser más directo
            setError("Ya existe una cuenta con este correo electrónico");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            {/* Same light gray background as Dashboard and Login with dark mode */}
            <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 overflow-hidden p-4">
            
            <BackgroundParticles init={init} />

            <div className="relative z-10 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500">

                <div className="flex flex-col items-center mb-8">
                    
                    <div className="flex items-center justify-center gap-4">
                        
                        {/* The red square with the white check */}
                        <div className="bg-[#cc2229] w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check size={36} strokeWidth={4} className="text-white" />
                        </div>
                        
                        {/* TEXT BLOCK: w-max makes the width marked by "REDCHECK" */}
                        <div className="flex flex-col justify-center w-max">
                            
                            <span className="text-[34px] font-black text-gray-900 dark:text-white leading-none tracking-tight transition-colors duration-300">
                                REDCHECK
                            </span>
                            
                            {/* flex justify-between pushes the first word to the left and the last to the right */}
                            <div className="flex justify-between w-full text-[11px] font-bold text-gray-800 dark:text-gray-300 mt-1.5 tracking-wide transition-colors duration-300">
                                <span>Agenda</span>
                                <span>Inteligente</span>
                                <span>Interactiva</span>
                            </div>

                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 my-6 transition-colors duration-300"></div>

                    <h2 className="text-gray-500 dark:text-gray-400 font-medium transition-colors duration-300">
                        Crear cuenta
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Nombre de usuario</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="tu_usuario"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Correo electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
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
                            placeholder="••••••••"
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
                        // Dark button aligned with the login
                        className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 shadow-sm hover:shadow disabled:opacity-50 mt-2"
                    >
                        {loading ? "Cargando..." : "Crear cuenta"}
                    </button>

                </form>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
                    ¿Ya tienes una cuenta?{" "}
                    <a href="/login" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 hover:underline transition-colors duration-300">
                        Inicia sesión aquí
                    </a>
                </p>

            </div>
            </div>
        </PageTransition>
    );
};

export default RegisterPage;