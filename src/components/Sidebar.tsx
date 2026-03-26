import { CheckSquare, LogOut, Settings, Bell, BotMessageSquare, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { SubjectWithTasks } from "../types";
import { ProgressHeatmap } from "./ProgressHeatmap";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[];
    onOpenSettings: () => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen, totalPending, subjects, onOpenSettings }: SidebarProps) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const completedTasks = totalTasks - totalPending; 
    const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    const strokeDashoffset = 226 - (226 * progress);

    return (
        <div className={`relative z-20 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[280px] overflow-visible" : "w-20 overflow-hidden"}
            rounded-2xl bg-gray-50 shadow-md p-5 flex flex-col`}>

            {/* --- CABECERA (Ancho fijo, la persiana lo recorta) --- */}
            <div className="flex items-center mb-8 w-[240px] shrink-0">
                <button
                    onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                        setShowNotifications(false);
                    }}
                    className="flex items-center justify-center shrink-0 w-10 h-10 text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    <CheckSquare size={24} />
                </button>
                
                <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[150px] opacity-100 ml-2" : "w-0 opacity-0 ml-0"}`}>
                    <span className="text-black tracking-tight whitespace-nowrap font-bold text-xl">
                        RedCheck
                    </span>
                </div>

                <div className={`relative flex items-center justify-end transition-all duration-300 ease-in-out ${sidebarOpen ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-90 shrink-0" 
                        title="Notificaciones"
                    >
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-50"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 origin-top-left animate-in fade-in zoom-in-95 duration-200 z-[60]">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                                <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Marcar leídas</span>
                            </div>
                            <div className="p-6 text-center text-sm text-gray-400">
                                <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                                No tienes notificaciones nuevas.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ZONA CENTRAL (Ancho dinámico w-full, se centra solo de forma matemática) --- */}
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
                    {/* El contenedor del icono mantiene 40x40 para no recalcular márgenes */}
                    <div className="bg-white rounded-xl shadow-sm text-gray-700 group-hover:text-purple-600 transition-colors flex items-center justify-center w-10 h-10 shrink-0">
                        <BotMessageSquare size={32} strokeWidth={1.5} className={`transition-all duration-300 ease-in-out transform origin-center ${sidebarOpen ? "scale-100" : "scale-[0.7]"}`} />
                    </div>
                    <div className={`flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out w-full ${sidebarOpen ? "max-h-[60px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                        <h3 className="font-bold text-gray-800 text-sm whitespace-nowrap">SmartCheck AI</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">IA de apoyo para tus tareas</p>
                    </div>
                </div>

            </div>

            {/* --- PIE DE PÁGINA --- */}
            <div className={`mt-auto flex flex-col gap-1 w-full pt-4 transition-all duration-300 ease-in-out ${sidebarOpen ? "border-t border-gray-200" : "border-transparent"}`}>
                <button onClick={onOpenSettings} className="flex items-center p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors w-full" title="Ajustes">
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Settings size={20} />
                    </div>
                    {/* El contenedor se encoge, pero el margen interno (ml-3) se queda quieto, evitando tirones */}
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