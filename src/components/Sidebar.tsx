import { CheckSquare, LogOut, Settings, Bell, Bot } from "lucide-react";
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

    // Cálculo para el círculo de progreso
    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const completedTasks = totalTasks - totalPending; // <--- Nueva variable calculada
    const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    
    // Si el radio es 36, el perímetro es ~226
    const strokeDashoffset = 226 - (226 * progress);

    return (
        <div className={`relative z-20 transition-all duration-300 ${sidebarOpen ? "w-[280px]" : "w-20"}
            rounded-2xl bg-gray-50 shadow-md p-5 flex flex-col`}>

            {/* Cabecera: Logo + Notificaciones */}
            <div className={`flex items-center mb-8 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
                <button
                    onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                        setShowNotifications(false);
                    }}
                    className="text-xl font-bold text-red-700 flex items-center gap-2"
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    <CheckSquare size={24} className="shrink-0" />
                    {sidebarOpen && <span className="text-black tracking-tight">RedCheck</span>}
                </button>

                {sidebarOpen && (
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-90" 
                            title="Notificaciones"
                        >
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-gray-50"></span>
                        </button>

                        {/* PANEL DE NOTIFICACIONES */}
                        {showNotifications && (
                            <div className="absolute left-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 origin-top-left animate-in fade-in zoom-in-95 duration-200 z-50">
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
                )}
            </div>

            {/* Progreso del día */}
            <div className="flex justify-center mb-10">
                <div className={`relative transition-all duration-300 ${sidebarOpen ? "w-24 h-24" : "w-10 h-10"}`}>
                    <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="36"
                            stroke="#c3e0ce" strokeWidth="8" fill="#eaf6ed" />
                        <circle cx="48" cy="48" r="36"
                            stroke="#16a34a" strokeWidth="8" fill="none"
                            strokeDasharray="226"
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out" 
                        />
                    </svg>
                    {/* AQUI SE MUESTRA LA FRACCIÓN. Ajuste de texto para que quepa bien cerrado */}
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-green-700 transition-all duration-300 ${sidebarOpen ? "text-xl tracking-tight" : "text-xs"}`}>
                        {completedTasks}/{totalTasks}
                    </div>
                </div>
            </div>

            {/* Heatmap de Actividad Diaria */}
            {sidebarOpen && (
                <div className="mb-auto">
                    <ProgressHeatmap />
                </div>
            )}

            {/* Sección SmartCheck AI */}
            {sidebarOpen && (
                <div className="flex flex-col items-center text-center px-2 py-6 mt-4 mb-4 opacity-80 hover:opacity-100 transition-opacity cursor-pointer group">
                    <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 text-gray-700 group-hover:text-purple-600 transition-colors">
                        <Bot size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">**SmartCheck AI**</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">IA de apoyo para tus tareas</p>
                </div>
            )}

            {/* Contenedor inferior agrupado */}
            <div className={`mt-auto flex flex-col gap-1 pt-4 transition-all duration-300 ${sidebarOpen ? "border-t border-gray-200" : "border-transparent"}`}>
                <button 
                    onClick={onOpenSettings}
                    className={`flex items-center gap-3 text-gray-500 hover:text-gray-800 transition text-sm p-2 rounded-xl hover:bg-gray-200 
                        ${!sidebarOpen ? "justify-center" : ""}`}
                    title="Ajustes"
                >
                    <Settings size={18} className="shrink-0" />
                    {sidebarOpen && <span className="font-medium">Ajustes</span>}
                </button>

                <button className={`flex items-center gap-3 text-gray-400 hover:text-red-600 transition text-sm p-2 rounded-xl hover:bg-red-50 
                    ${!sidebarOpen ? "justify-center" : ""}`}
                    onClick={() => {
                        localStorage.removeItem("token"); 
                        navigate("/login");
                    }}
                    title="Cerrar sesión"
                >
                    <LogOut size={18} className="shrink-0" />
                    {sidebarOpen && <span className="font-medium">Cerrar sesión</span>}
                </button>
            </div>
            
        </div>
    );
};