import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { AuthFloatingNav } from "../components/AuthFloatingNav";
import { useLanguage } from "../context/LanguageContext";

// We add the copyright to the dictionary
const translations = {
    es: {
        copyright: "© 2026 RedCheck. Desarrollado por Francisco Javier Molina Cuenca. Todos los derechos reservados."
    },
    en: {
        copyright: "© 2026 RedCheck. Developed by Francisco Javier Molina Cuenca. All rights reserved."
    }
};

const TermsPage = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

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
            <div className="relative min-h-screen flex flex-col overflow-y-auto">

                <AuthFloatingNav onBack={handleBack} backAriaLabel={language === 'es' ? 'Volver' : 'Back'} mobileRowClassName="px-4 pt-4" />

                <div className="flex-1 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
                    {/* GLASS-EFFECT CONTAINER */}
                    <div className="relative z-10 max-w-3xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden transition-colors duration-500 mb-8">

                        {/* --- HEADER --- */}
                        <div className="px-6 py-8 sm:px-10 border-b border-gray-100/50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/30 transition-colors duration-300">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
                                {language === 'es' ? 'Aviso Legal y Términos de Servicio' : 'Legal Notice and Terms of Service'}
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {language === 'es' ? 'Última actualización: Agosto de 2026' : 'Last updated: August 2026'}
                            </p>
                        </div>

                        {/* --- LEGAL CONTENT --- */}
                        <div className="p-6 sm:p-10 text-gray-700 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-300">
                            
                            <div className="space-y-8">
                                {language === 'es' && (
                                    <>
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
                                    </>
                                )}

                                {language === 'en' && (
                                    <>
                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">1. Legal Information</h2>
                                            <p>In compliance with the information duty contained in Article 10 of Law 34/2002, of July 11, on Information Society Services and Electronic Commerce (LSSICE), we inform you that the <strong>RedCheck</strong> web application is operated and managed by its owner. You can contact the person responsible for the service via email: <strong>paco@redcheck.es</strong>.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">2. Terms of Use</h2>
                                            <p>Access to and use of RedCheck grants the status of User, who fully and unreservedly accepts these Terms of Service. The User agrees to use the application in a diligent, correct, and lawful manner, refraining from using it for fraudulent purposes or to store information that violates current legislation.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">3. Intellectual and Industrial Property</h2>
                                            <p>All intellectual property rights regarding the design, source code, logos, and functionalities of RedCheck (including the integration of the "SmartCheck AI" system) belong to its creator. Unauthorized reproduction, distribution, or modification of these elements is expressly prohibited.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">4. Disclaimer of Warranties and Liability</h2>
                                            <p>RedCheck is provided "as is" (<em>as is</em>), without warranties of any kind. Since it is a personal project under constant development, the owner does not guarantee the uninterrupted availability of the platform and is not responsible for any potential loss of tasks, data, or settings. The user uses the platform at their own risk.</p>
                                        </section>

                                        <section>
                                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">5. Modifications</h2>
                                            <p>The owner reserves the right to make modifications deemed appropriate in the application without prior notice, being able to change, delete, or add both the contents and services provided through it, as well as the way they are presented.</p>
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

export default TermsPage;