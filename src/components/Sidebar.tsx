import { CheckSquare, LogOut, Settings, Bell, BotMessageSquare, Activity, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { SubjectWithTasks } from "../types";
import { ProgressHeatmap } from "./ProgressHeatmap";
import { SmartCheckButton } from "./SmartCheckButton";
// import { dailyAnalysis } from "../api/smartCheckApi"; <-- ESTO LO QUITAMOS

// AÑADIMOS LAS DOS NUEVAS PROPS DE LA IA AQUÍ:
interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[];
    onOpenSettings: () => void;
    onAiPlanClick: () => void;     // <-- Nueva prop
    isAiLoading: boolean;          // <-- Nueva prop
    aiNotificationReady: boolean;  // <-- nuevo (viene de Dashboard)
    onOpenAiModal: () => void;
}

// LAS RECIBIMOS AQUÍ:
export const Sidebar = ({ sidebarOpen, setSidebarOpen, totalPending, subjects, onOpenSettings, onAiPlanClick, isAiLoading, aiNotificationReady, onOpenAiModal }: SidebarProps) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const completedTasks = totalTasks - totalPending; 
    const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    const strokeDashoffset = 226 - (226 * progress);

    return (
        <div className={`relative z-20 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[280px] overflow-visible" : "w-20 overflow-hidden"}
            rounded-2xl bg-gray-50 shadow-md p-5 flex flex-col`}>

            {/* --- CABECERA --- */}
            <div className="flex items-center mb-8 w-[240px] shrink-0">
                <button
                    onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                        setShowNotifications(false);
                    }}
                    className="flex items-center justify-center shrink-0 w-10 h-10 text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    <div className="bg-[#cc2229] w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm flex-shrink-0">
                        <Check size={22} strokeWidth={4} className="text-white" />
                    </div>
                </button>
                
                <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[150px] opacity-100 ml-2" : "w-0 opacity-0 ml-0"}`}>
                    <span className="text-[22px] font-black text-gray-900 tracking-tight leading-none mt-1">
                        REDCHECK
                    </span>
                </div>

                <div className={`relative flex items-center justify-end transition-all duration-300 ease-in-out ${sidebarOpen ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-90 shrink-0" 
                        title="Notificaciones"
                    >
                        <Bell size={20} />
                        {aiNotificationReady && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-gray-50 animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 origin-top-left animate-in fade-in zoom-in-95 duration-200 z-[60]">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                                <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Marcar leídas</span>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {aiNotificationReady ? (
                                    <div 
                                        onClick={() => {
                                            onOpenAiModal();
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 flex flex-col gap-1 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider italic">SmartCheck listo</span>
                                        </div>
                                        <p className="text-sm text-gray-700 font-semibold">¡Tu plan diario ya está disponible!</p>
                                        <p className="text-[11px] text-gray-400">Haz clic para ver tu plan priorizado.</p>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-gray-400">
                                        <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                                        No tienes notificaciones nuevas.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ZONA CENTRAL --- */}
            <div className="flex flex-col items-center w-full mb-auto">

                {/* Progreso del día */}
                <div className={`relative transition-all duration-300 ease-in-out shrink-0 mb-10 ${sidebarOpen ? "w-24 h-24" : "w-10 h-10"}`}>
                    <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="36" stroke="#c3e0ce" strokeWidth="8" fill="#eaf6ed" />
                        <circle cx="48" cy="48" r="36" stroke="#16a34a" strokeWidth="8" fill="none"
                            strokeDasharray="226" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            className="transition-all duration-500 ease-out" 
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-green-700 transition-all duration-300 ease-in-out ${sidebarOpen ? "text-xl tracking-tight" : "text-xs"}`}>
                        {completedTasks}/{totalTasks}
                    </div>
                </div>

                {/* Heatmap (Abierto) */}
                <div className={`transition-all duration-500 ease-in-out flex justify-center overflow-hidden w-full ${sidebarOpen ? "max-h-[200px] opacity-100 delay-75" : "max-h-0 opacity-0"}`}>
                    <div className="w-[240px] shrink-0 pt-1 pb-1">
                        <ProgressHeatmap />
                    </div>
                </div>

                {/* Activity Icon (Cerrado) */}
                <div className={`transition-all duration-300 ease-in-out flex justify-center overflow-hidden w-full ${!sidebarOpen ? "max-h-[50px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"}`}>
                    <div onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl text-gray-400 hover:text-green-600 hover:bg-white hover:shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0">
                        <Activity size={22} strokeWidth={1.5} />
                    </div>
                </div>

                {/* SmartCheck AI */}
                <div className="flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-all duration-300 ease-in-out cursor-pointer group mt-4 mb-2 w-full" title="SmartCheck AI">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center shadow-sm mb-2.5">
                        {/* Usamos Sparkles (o Brain) y el rojo de tu marca */}
                        <Sparkles size={22} strokeWidth={2} className="text-red-600" />
                    </div>
                    <div className={`flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out w-full ${sidebarOpen ? "max-h-[60px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                        <h3 className="text-sm font-bold text-gray-800 tracking-wide">
                            SmartCheck AI
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5 tracking-wide uppercase">
                            Motor de análisis
                        </p>
                    </div>
                </div>

                {/* --- BOTONES DE LA IA --- */}
                <div className={`
                        flex flex-col space-y-3 px-4 overflow-hidden
                        transition-all duration-500 ease-out
                        ${sidebarOpen 
                            ? 'max-h-96 opacity-100 translate-y-0 mt-6' 
                            : 'max-h-0 opacity-0 translate-y-4 mt-0 pointer-events-none'
                        }
                    `}>
  
                {/* CONECTAMOS EL BOTÓN AQUÍ */}
                <SmartCheckButton
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    title="Análisis Diario de Tareas"
                    // Cambiamos el subtítulo si está pensando la IA
                    subtitle={isAiLoading ? "Consultando a SmartCheck..." : "Genera un resumen de tus prioridades para hoy."}
                    // Le asignamos la función que viene del DashboardPage
                    onClick={onAiPlanClick}
                />

                <SmartCheckButton 
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    title="Analizar riesgos"
                    subtitle="Identifica posibles bloqueos o retrasos."
                    onClick={() => console.log("Clic en el análisis de riesgos")}
                />
                </div>
                    
            </div>

            {/* --- PIE DE PÁGINA --- */}
            <div className={`mt-auto flex flex-col gap-1 w-full pt-4 transition-all duration-300 ease-in-out ${sidebarOpen ? "border-t border-gray-200" : "border-transparent"}`}>
                <button onClick={onOpenSettings} className="flex items-center p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors w-full" title="Ajustes">
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Settings size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            Ajustes
                        </span>
                    </div>
                </button>

                <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} className="flex items-center p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full" title="Cerrar sesión">
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