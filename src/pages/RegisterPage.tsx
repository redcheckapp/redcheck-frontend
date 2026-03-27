import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/registerApi";
import { CheckSquare } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// --- Partículas relajantes y adaptadas al fondo claro ---
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
                    color: { value: "#9ca3af" }, // Gris suave
                    links: {
                        color: "#9ca3af",
                        distance: 150,
                        enable: true,
                        opacity: 0.2, // Más transparente
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1.0, // Movimiento más lento
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 60, // Menos cantidad
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
        // Mismo fondo gris clarito que el Dashboard y Login
        <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] overflow-hidden p-4">
            
            <BackgroundParticles init={init} />

            <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex flex-col items-center gap-1 mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <CheckSquare size={32} className="text-red-700" />
                        <span className="text-2xl font-bold text-black">RedCheck</span>
                    </div>
                    <h2 className="text-gray-500 font-medium mt-1">
                        Crear cuenta
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre de usuario</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="tu_usuario"
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
                            required
                        />
                    </div>

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
                        // Botón oscuro alineado con el login
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-all shadow-sm hover:shadow disabled:opacity-50 mt-2"
                    >
                        {loading ? "Cargando..." : "Crear cuenta"}
                    </button>

                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    ¿Ya tienes una cuenta?{" "}
                    <a href="/login" className="text-red-600 font-semibold hover:text-red-700 hover:underline transition-colors">
                        Inicia sesión aquí
                    </a>
                </p>

            </div>
        </div>
    );
};

export default RegisterPage;