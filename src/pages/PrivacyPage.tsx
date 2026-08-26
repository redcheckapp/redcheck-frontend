import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { PageTransition } from "../components/PageTransition";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const BackgroundParticles = memo(({ init }: { init: boolean }) => {
    if (!init) return null;
    
    return (
        <Particles
            id="tsparticles-privacy"
            className="fixed inset-0 z-0" 
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

// Añadimos el copyright al diccionario
const translations = {
    es: {
        copyright: "© 2026 RedCheck. Desarrollado por Francisco Javier Molina Cuenca. Todos los derechos reservados."
    },
    en: {
        copyright: "© 2026 RedCheck. Developed by Francisco Javier Molina Cuenca. All rights reserved."
    }
};

const PrivacyPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language as keyof typeof translations];
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
            window.close();
            navigate('/login');
        }
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen flex flex-col bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 overflow-y-auto">
                
                <BackgroundParticles init={init} />

                {/* CONTROLES FLOTANTES (IDIOMA Y TEMA) */}
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

                <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                    {/* CONTENEDOR EFECTO CRISTAL */}
                    <div className="relative z-10 max-w-3xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-colors duration-500 mb-8">
                        
                        {/* --- HEADER --- */}
                        <div className="px-6 py-8 sm:px-10 border-b border-gray-100/50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/30 transition-colors duration-300">
                            <button 
                                onClick={handleBack}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors mb-6 w-fit p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <ArrowLeft size={16} />
                                {language === 'es' ? 'Volver' : 'Back'}
                            </button>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
                                {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {language === 'es' ? 'Última actualización: Agosto de 2026' : 'Last updated: August 2026'}
                            </p>
                        </div>

                        {/* --- CONTENIDO LEGAL --- */}
                        <div className="p-6 sm:p-10 text-gray-700 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-300">
                            
                            <div className="space-y-8">
                                {language === 'es' && (
                                    <>
                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">1. Responsable del Tratamiento</h2>
                                            <p>El responsable del tratamiento de los datos recabados a través de esta plataforma es <strong>Francisco Javier Molina Cuenca</strong>. Puede ejercer sus derechos o resolver cualquier duda relativa a la privacidad escribiendo a <strong>paco@redcheck.es</strong>.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">2. Datos Recopilados y Finalidad</h2>
                                            <p>RedCheck recopila la siguiente información estrictamente necesaria para el funcionamiento del servicio:</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                                <li><strong>Datos de cuenta:</strong> Correo electrónico, nombre de usuario y contraseña (almacenada de forma segura mediante encriptación).</li>
                                                <li><strong>Datos de uso:</strong> Tareas, asignaturas, fechas límite y el estado de finalización de las mismas para alimentar el motor de priorización inteligente (SmartCheck AI).</li>
                                            </ul>
                                            <p className="mt-2">Estos datos se utilizan <strong>única y exclusivamente</strong> para proveer el servicio de agenda interactiva. No se venden, ceden, ni comparten con terceros con fines publicitarios o comerciales.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">3. Tratamiento Automatizado e Inteligencia Artificial</h2>
                                            <p>Para generar las estrategias diarias, RedCheck procesa localmente o en sus propios servidores el texto de las tareas registradas por el usuario. El sistema de Inteligencia Artificial (SmartCheck) evalúa plazos y nombres de las tareas para organizar su urgencia. No se introducen datos personales de terceros en dicho modelo.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">4. Plazo de Conservación</h2>
                                            <p>Los datos personales proporcionados se conservarán mientras se mantenga activa la cuenta del usuario. Una vez que el usuario decida eliminar su cuenta, <strong>todos sus datos y tareas asociadas serán destruidos irreversiblemente</strong> de la base de datos principal.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">5. Derechos del Usuario (RGPD)</h2>
                                            <p>De acuerdo con el Reglamento General de Protección de Datos (RGPD), el usuario tiene derecho a:</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                                <li><strong>Acceso, Rectificación y Limitación:</strong> Puede visualizar y editar su información y tareas desde el propio panel de la aplicación.</li>
                                                <li><strong>Supresión (Derecho al olvido):</strong> RedCheck incorpora una opción directa en la pestaña "Ajustes" que permite al usuario eliminar su cuenta y todo su historial de progreso de manera inmediata y autónoma, sin necesidad de intervención de un administrador.</li>
                                            </ul>
                                        </section>
                                    </>
                                )}

                                {language === 'en' && (
                                    <>
                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">1. Data Controller</h2>
                                        <p>The data controller for the data collected through this platform is <strong>Francisco Javier Molina Cuenca</strong>. You can exercise your rights or resolve any privacy-related doubts by writing to <strong>paco@redcheck.es</strong>.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">2. Data Collected and Purpose</h2>
                                            <p>RedCheck collects the following information strictly necessary for the operation of the service:</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                                <li><strong>Account data:</strong> Email, username, and password (securely stored via encryption).</li>
                                                <li><strong>Usage data:</strong> Tasks, subjects, deadlines, and their completion status to feed the intelligent prioritization engine (SmartCheck AI).</li>
                                            </ul>
                                            <p className="mt-2">This data is used <strong>solely and exclusively</strong> to provide the interactive planner service. It is not sold, transferred, or shared with third parties for advertising or commercial purposes.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">3. Automated Processing and Artificial Intelligence</h2>
                                            <p>To generate daily strategies, RedCheck processes the text of the tasks registered by the user locally or on its own servers. The Artificial Intelligence system (SmartCheck) evaluates task deadlines and names to organize their urgency. No personal data of third parties is introduced into said model.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">4. Retention Period</h2>
                                            <p>The personal data provided will be kept as long as the user's account remains active. Once the user decides to delete their account, <strong>all their data and associated tasks will be irreversibly destroyed</strong> from the main database.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">5. User Rights (GDPR)</h2>
                                            <p>In accordance with the General Data Protection Regulation (GDPR), the user has the right to:</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                                <li><strong>Access, Rectification, and Limitation:</strong> You can view and edit your information and tasks directly from the application's dashboard.</li>
                                                <li><strong>Deletion (Right to be forgotten):</strong> RedCheck incorporates a direct option in the "Settings" tab that allows the user to delete their account and their entire progress history immediately and autonomously, without the need for administrator intervention.</li>
                                            </ul>
                                        </section>
                                    </>
                                )}
                            </div>

                            {/* --- COPYRIGHT DENTRO DE LA TARJETA --- */}
                            <div className="mt-10 pt-6 border-t border-gray-100/50 dark:border-gray-800/50 flex justify-center transition-colors duration-300">
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium">
                                    {t.copyright}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
                
            </div>
        </PageTransition>
    );
};

export default PrivacyPage;