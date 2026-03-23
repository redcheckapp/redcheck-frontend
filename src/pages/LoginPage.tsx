import { useState, useEffect, memo } from "react"; // <-- Añadido 'memo' aquí
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { CheckSquare } from "lucide-react"; 
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

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
                    color: { value: "#ffffff" },
                    links: {
                        color: "#ffffff",
                        distance: 150,
                        enable: true,
                        opacity: 0.4,
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1.5,
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 80,
                    },
                    opacity: { value: 0.6 },
                    shape: { type: "circle" },
                    size: { value: { min: 1, max: 3 } },
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
            setError("Incorrect email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-slate-500 overflow-hidden p-4">
            
            {/* Usamos el nuevo componente memoizado */}
            <BackgroundParticles init={init} />

            <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex flex-col items-center gap-1 mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <CheckSquare size={32} className="text-red-700" />
                        <span className="text-2xl font-bold text-black">RedCheck</span>
                    </div>
                    <h2 className="text-gray-500 font-medium mt-1">
                        Iniciar sesión
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 mt-2"
                    >
                        {loading ? "Loading..." : "Enter"}
                    </button>

                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?{" "}
                    <a href="/register" className="text-blue-500 font-medium hover:underline">
                        Sign-in
                    </a>
                </p>

            </div>
        </div>
    );
};

export default LoginPage;