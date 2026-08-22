import { LogOut, Settings, Bell, Check, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { SubjectStat, SubjectWithTasks } from "../types";
import { SmartCheckButton } from "./SmartCheckButton";
import { SubjectBalance } from "./SubjectBalance";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[];
    onOpenSettings: () => void;
    onAiPlanClick: () => void;
    isAiLoading: boolean;
    aiNotificationReady: boolean;
    onOpenAiModal: () => void;
    subjectStats: SubjectStat[];
    showTrash: boolean;
    onOpenTrash: () => void;
    onGoHome: () => void;
}

export const Sidebar = ({ 
    sidebarOpen, 
    setSidebarOpen, 
    totalPending, 
    subjects, 
    onOpenSettings, 
    onAiPlanClick, 
    isAiLoading, 
    aiNotificationReady, 
    onOpenAiModal, 
    subjectStats,
    showTrash,
    onOpenTrash,
    onGoHome 
}: SidebarProps) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const completedTasks = totalTasks - totalPending; 
    const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    const strokeDashoffset = 226 - (226 * progress);

    return (
        <div className={`relative z-20 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[280px] overflow-visible" : "w-20 overflow-hidden"}
            rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-md p-5 flex flex-col transition-colors duration-500`}>

            {/* --- HEADER --- */}
            <div className="flex items-center mb-8 w-[240px] shrink-0">
                <button
                    onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                        setShowNotifications(false);
                    }}
                    className="flex items-center justify-center shrink-0 w-10 h-10 text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    <div className="bg-[#cc2229] w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm flex-shrink-0">
                        <Check size={22} strokeWidth={4} className="text-white" />
                    </div>
                </button>
                
                {/* Haciendo el logo clicable para volver al Dashboard */}
                <div 
                    onClick={onGoHome}
                    className={`flex items-center overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[150px] opacity-100 ml-2" : "w-0 opacity-0 ml-0"}`}
                    title="Ir al inicio"
                >
                    <span className="text-[22px] font-black text-gray-900 dark:text-white tracking-tight leading-none mt-1">
                        REDCHECK
                    </span>
                </div>

                <div className={`relative flex items-center justify-end transition-all duration-300 ease-in-out ${sidebarOpen ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-90 shrink-0" 
                        title="Notificaciones"
                    >
                        <Bell size={20} />
                        {aiNotificationReady && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-gray-50 dark:border-gray-900 animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute left-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 origin-top-left animate-in fade-in zoom-in-95 duration-200 z-[60]">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Notificaciones</h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Marcar leídas</span>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {aiNotificationReady ? (
                                    <div 
                                        onClick={() => {
                                            onOpenAiModal();
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 hover:bg-zinc-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-zinc-100 dark:border-gray-800 flex flex-col gap-1 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider italic">SmartCheck listo</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">¡Tu plan diario ya está disponible!</p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">Haz clic para ver tu plan priorizado.</p>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                                        <Bell size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        No tienes notificaciones nuevas.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CENTRAL ZONE --- */}
            <div className="flex-1 flex flex-col items-center w-full overflow-y-auto overflow-x-hidden pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                {/* Daily progress */}
                <div className={`relative transition-all duration-300 ease-in-out shrink-0 mb-5 ${sidebarOpen ? "w-24 h-24" : "w-10 h-10"}`}>
                    <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
                        {/* Pista de fondo: ahora es gris oscuro en modo noche para que se vea claramente el raíl */}
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="currentColor" className="text-[#c3e0ce] dark:text-gray-800 fill-[#eaf6ed] dark:fill-gray-900/50 transition-colors duration-500" />
                        {/* Línea de progreso: verde brillante */}
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="none"
                            strokeDasharray="226" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            className="text-[#16a34a] dark:text-green-400 transition-all duration-500 ease-out" 
                        />
                    </svg>
                    {/* Texto interior: ahora es blanco puro en modo noche para máxima legibilidad */}
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-green-700 dark:text-white transition-all duration-300 ease-in-out ${sidebarOpen ? "text-xl tracking-tight" : "text-xs"}`}>
                        {completedTasks}/{totalTasks}
                    </div>
                </div>
    
                <SubjectBalance 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen}
                    stats={subjectStats} 
                />

                {/* SmartCheck AI */}
                <div 
                    onClick={() => setSidebarOpen(true)} 
                    className="flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-all duration-300 ease-in-out cursor-pointer group mt-4 mb-2 w-full select-none" 
                    title="SmartCheck AI"
                >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                        sidebarOpen 
                            ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm" 
                            : "bg-transparent text-gray-400 dark:text-gray-500 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:shadow-sm"
                    }`}>
                        <Sparkles 
                            size={22} 
                            strokeWidth={1.5} 
                            className={`transition-transform duration-300 ${
                                sidebarOpen ? "scale-110" : "group-hover:scale-110"
                            }`} 
                        />
                    </div>
                    
                    <div className={`flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out w-full ${sidebarOpen ? "max-h-[60px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                            SmartCheck AI
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 tracking-wide uppercase">
                            Motor de análisis
                        </p>
                    </div>
                </div>

                {/* --- AI BUTTONS --- */}
                <div className={`
                        flex flex-col space-y-3 px-4 overflow-hidden w-full shrink-0
                        transition-all duration-500 ease-out
                        ${sidebarOpen 
                            ? 'max-h-[800px] opacity-100 translate-y-0 mt-6 pb-4' 
                            : 'max-h-0 opacity-0 translate-y-4 mt-0 pointer-events-none'
                        }
                    `}>
  
                    <SmartCheckButton
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        title="Análisis Diario de Tareas"
                        subtitle={isAiLoading ? "Consultando a SmartCheck..." : "Genera un resumen de tus prioridades para hoy."}
                        onClick={onAiPlanClick}
                        comingSoon={false}
                    />

                    <SmartCheckButton 
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        title="Analizar riesgos"
                        subtitle="Identifica posibles bloqueos o retrasos."
                        onClick={() => console.log("Clic en el análisis de riesgos")}
                        comingSoon={true}
                    />
                </div>
                    
            </div>

            {/* --- FOOTER --- */}
            <div className={`mt-auto flex flex-col gap-1 w-full pt-4 transition-all duration-300 ease-in-out ${sidebarOpen ? "border-t border-gray-200 dark:border-gray-800" : "border-transparent"}`}>
                
                {/* PAPELERA DE RECICLAJE */}
                <button 
                    onClick={onOpenTrash} 
                    className={`flex items-center p-2 rounded-xl transition-colors w-full ${showTrash ? "bg-gray-800 dark:bg-gray-800 text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"}`} 
                    title="Papelera"
                >
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Trash2 size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            Papelera
                        </span>
                    </div>
                </button>

                <button onClick={onOpenSettings} className="flex items-center p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors w-full" title="Ajustes">
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Settings size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            Ajustes
                        </span>
                    </div>
                </button>

                <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} className="flex items-center p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full" title="Cerrar sesión">
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <LogOut size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            Cerrar sesión
                        </span>
                    </div>
                </button>
            </div>
            
        </div>
    );
};