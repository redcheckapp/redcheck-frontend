import { useState, useEffect, memo } from "react"; // <-- Añadido 'memo' aquí
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { Check, CheckSquare } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";

// --- NUEVO: Extraemos las partículas a un componente inmutable ---
// Al usar memo(), React solo lo dibujará 1 vez y no lo recargará al escribir
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
                    color: { value: "#9ca3af" }, // <-- Gris suave
                    links: {
                        color: "#9ca3af",      // <-- Enlaces gris suave
                        distance: 150,
                        enable: true,
                        opacity: 0.2,          // <-- Más transparente para que no moleste
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1.0,            // <-- Un poco más lentas y relajantes
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 60,             // <-- Un poco menos densas
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
// -----------------------------------------------------------------

const LoginPage = () => {
    const navigate = useNavigate();

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

    return (
        <PageTransition>
            <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] overflow-hidden p-4">
            
            {/* Usamos el nuevo componente memoizado */}
            <BackgroundParticles init={init} />

            <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex flex-col items-center mb-8">
                    
                    <div className="flex items-center justify-center gap-4">
                        
                        {/* El cuadrado rojo con el check blanco */}
                        <div className="bg-[#cc2229] w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check size={36} strokeWidth={4} className="text-white" />
                        </div>
                        
                        {/* BLOQUE DE TEXTO: w-max hace que el ancho lo marque "REDCHECK" */}
                        <div className="flex flex-col justify-center w-max">
                            
                            <span className="text-[34px] font-black text-gray-900 leading-none tracking-tight">
                                REDCHECK
                            </span>
                            
                            {/* flex justify-between empuja la primera palabra a la izquierda y la última a la derecha */}
                            <div className="flex justify-between w-full text-[11px] font-bold text-gray-800 mt-1.5 tracking-wide">
                                <span>Agenda</span>
                                <span>Inteligente</span>
                                <span>Interactiva</span>
                            </div>

                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-6"></div>

                    <h2 className="text-gray-500 font-medium">
                        Iniciar sesión
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-6">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Correo electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-all shadow-sm hover:shadow disabled:opacity-50 mt-2"
                    >
                        {loading ? "Cargando..." : "Entrar a RedCheck"}
                    </button>

                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    ¿Aún no tienes una cuenta?{" "}
                    <a href="/register" className="text-red-600 font-semibold hover:text-red-700 hover:underline transition-colors">
                        Regístrate aquí
                    </a>
                </p>

            </div>
            </div>
        </PageTransition>
    );
};

export default LoginPage;