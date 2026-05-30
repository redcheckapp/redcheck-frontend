import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info } from "lucide-react"; 
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

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    return (
        <PageTransition>
            {/* Same light gray background as Dashboard and Login */}
            <div className="relative min-h-screen flex items-center justify-center bg-[#e3e7e2] overflow-hidden p-4">
            
            <BackgroundParticles init={init} />

            <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex flex-col items-center mb-6">
                    
                    <div className="flex items-center justify-center gap-4">
                        
                        {/* The red square with the white check */}
                        <div className="bg-[#cc2229] w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shadow-sm flex-shrink-0">
                            <Check size={36} strokeWidth={4} className="text-white" />
                        </div>
                        
                        {/* TEXT BLOCK: w-max makes the width marked by "REDCHECK" */}
                        <div className="flex flex-col justify-center w-max">
                            
                            <span className="text-[34px] font-black text-gray-900 leading-none tracking-tight">
                                REDCHECK
                            </span>
                            
                            {/* flex justify-between pushes the first word to the left and the last to the right */}
                            <div className="flex justify-between w-full text-[11px] font-bold text-gray-800 mt-1.5 tracking-wide">
                                <span>Agenda</span>
                                <span>Inteligente</span>
                                <span>Interactiva</span>
                            </div>

                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 mt-6 mb-2"></div>
                </div>

                {/* --- BLOQUE DE AVISO: REGISTRO DESHABILITADO --- */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
                    <div className="flex justify-center mb-3">
                        <Info className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-blue-900 font-bold mb-2 text-center">Registro Deshabilitado</h3>
                    <p className="text-sm text-blue-700 leading-relaxed text-center">
                        Por motivos de seguridad y mantenimiento, la creación de nuevas cuentas está deshabilitada en esta versión de demostración. 
                    </p>
                    <p className="text-sm text-blue-700 leading-relaxed mt-2 text-center">
                        Por favor, utiliza el <strong>Acceso Rápido</strong> para evaluar la plataforma.
                    </p>
                </div>
                {/* --------------------------------------------- */}

                <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-black transition-all shadow-sm hover:shadow"
                >
                    Volver al Inicio de Sesión
                </button>

            </div>
            </div>
        </PageTransition>
    );
};

export default RegisterPage;