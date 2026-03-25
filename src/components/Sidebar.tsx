import { CheckSquare, LogOut, Settings, Bell, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SubjectWithTasks } from "../types";
import { ProgressHeatmap } from "./ProgressHeatmap";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[]; // Lo mantenemos para calcular el totalTasks del círculo
    onOpenSettings: () => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen, totalPending, subjects, onOpenSettings }: SidebarProps) => {
    const navigate = useNavigate();

    // Cálculo para el círculo de progreso
    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const progress = totalTasks === 0 ? 0 : (totalTasks - totalPending) / totalTasks;
    
    // Si el radio es 36, el perímetro (2 * PI * r) es ~226
    const strokeDashoffset = 226 - (226 * progress);

    return (
        <div className={`transition-all duration-300 ${sidebarOpen ? "w-[280px]" : "w-20"}
            rounded-2xl bg-gray-50 shadow-md p-5 flex flex-col overflow-hidden`}>

            {/* Cabecera: Logo + Notificaciones */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-xl font-bold text-red-700 flex items-center gap-2"
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                    <CheckSquare size={24} className="shrink-0" />
                    {sidebarOpen && <span className="text-black tracking-tight">RedCheck</span>}
                </button>

                {sidebarOpen && (
                    <button className="relative p-1 text-gray-400 hover:text-gray-700 transition" title="Notificaciones">
                        <Bell size={20} />
                        {/* Puntito rojo de notificación (simulado) */}
                        <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                )}
            </div>

            {/* Progreso del día (Círculo más grande) */}
            <div className="flex justify-center mb-10">
                <div className="relative w-24 h-24">
                    <svg width="96" height="96" className="transform -rotate-90">
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
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-700">
                        {totalPending}
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
            <div className="mt-auto flex flex-col gap-1 border-t border-gray-200 pt-4">
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