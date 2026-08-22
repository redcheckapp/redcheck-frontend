import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";
import { useTheme } from "../context/ThemeContext";

const BackgroundParticles = memo(({ init }: { init: boolean }) => {
    if (!init) return null;
    
    return (
        <Particles
            id="tsparticles-terms"
            className="fixed inset-0 z-0" // fixed para que acompañen al scroll
            options={{
                background: { color: { value: "transparent" } },
                fpsLimit: 120,
                particles: {
                    color: { value: "#9ca3af" }, 
                    links: { color: "#9ca3af", distance: 150, enable: true, opacity: 0.2, width: 1 },
                    move: { direction: "none", enable: true, outModes: { default: "bounce" }, random: false, speed: 1.0, straight: false },
                    number: { density: { enable: true, area: 800 }, value: 60 },
                    opacity: { value: 0.3 },
                    shape: { type: "circle" },
                    size: { value: { min: 1, max: 2 } },
                },
                detectRetina: true,
            }}
        />
    );
});

const TermsPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            window.close(); // Cierra la pestaña si se abrió con target="_blank"
            navigate('/login'); // Fallback por si el navegador bloquea el cierre
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen bg-[#e3e7e2] dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 overflow-y-auto">
                
                <BackgroundParticles init={init} />

                {/* BOTÓN FLOTANTE MODO NOCHE */}
                <button
                    onClick={toggleTheme}
                    className="fixed bottom-4 left-4 z-50 p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 active:scale-95"
                    title="Cambiar tema"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {/* CONTENEDOR EFECTO CRISTAL */}
                <div className="relative z-10 max-w-3xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-colors duration-500">
                    
                    {/* --- HEADER --- */}
                    <div className="px-6 py-8 sm:px-10 border-b border-gray-100/50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/30 transition-colors duration-300">
                        <button 
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors mb-6 w-fit p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft size={16} />
                            Volver
                        </button>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
                            Aviso Legal y Términos de Servicio
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            Última actualización: Agosto de 2026
                        </p>
                    </div>

                    {/* --- CONTENIDO LEGAL --- */}
                    <div className="p-6 sm:p-10 space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-300">
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">1. Información Legal</h2>
                            <p>En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), se informa que la aplicación web <strong>RedCheck</strong> es operada y gestionada por su titular. Puede contactar con el responsable del servicio a través del correo electrónico: <strong>paco@redcheck.es</strong>.</p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">2. Condiciones de Uso</h2>
                            <p>El acceso y uso de RedCheck atribuye la condición de Usuario, que acepta plenamente y sin reservas los presentes Términos de Servicio. El Usuario se compromete a utilizar la aplicación de forma diligente, correcta y lícita, absteniéndose de utilizarla con fines fraudulentos o para almacenar información que vulnere la legalidad vigente.</p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">3. Propiedad Intelectual e Industrial</h2>
                            <p>Todos los derechos de propiedad intelectual del diseño, código fuente, logotipos y funcionalidades de RedCheck (incluyendo la integración del sistema "SmartCheck AI") pertenecen a su creador. Queda expresamente prohibida la reproducción, distribución o modificación no autorizada de dichos elementos.</p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">4. Exclusión de Garantías y Responsabilidad</h2>
                            <p>RedCheck se proporciona "tal cual" (<em>as is</em>), sin garantías de ningún tipo. Al ser un proyecto personal en constante desarrollo, el titular no garantiza la disponibilidad ininterrumpida de la plataforma ni se hace responsable de la posible pérdida de tareas, datos o configuraciones. El usuario utiliza la plataforma bajo su propia responsabilidad.</p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">5. Modificaciones</h2>
                            <p>El titular se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en la aplicación, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que éstos aparezcan presentados.</p>
                        </section>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default TermsPage;