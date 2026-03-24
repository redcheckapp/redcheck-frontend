import { CheckSquare, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SubjectWithTasks } from "../types";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[];
    onOpenSettings: () => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen, totalPending, subjects, onOpenSettings }: SidebarProps) => {    const navigate = useNavigate();

    return (
        <div className={`transition-all duration-300 ${sidebarOpen ? "w-72" : "w-20"}
            rounded-2xl bg-gray-50 shadow-md p-4 flex flex-col`}>

            {/* Logo — abre y cierra el sidebar */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-xl font-bold text-red-700 mb-6 text-center flex items-center justify-center gap-2"
            >
                <CheckSquare size={24} />
                {sidebarOpen && <span className="text-black">RedCheck</span>}
            </button>

            {/* Progreso del día */}
            <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16">
                    <svg width="64" height="64">
                        <circle cx="32" cy="32" r="28"
                            stroke="#c3e0ce" strokeWidth="6" fill="#eaf6ed" />
                        <circle cx="32" cy="32" r="28"
                            stroke="#16a34a" strokeWidth="6" fill="none"
                            strokeDasharray="176"
                            strokeDashoffset={176 - (176 * (totalPending === 0 ? 1 : 0))}
                            transform="rotate(-90 32 32)"
                            strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center
                        text-sm font-semibold text-green-700">
                        {totalPending}
                    </div>
                </div>
            </div>

            {/* Lista de asignaturas */}
            {sidebarOpen && (
                <div className="flex flex-col gap-2 flex-1">
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                        Asignaturas
                    </p>
                    {subjects.map(subject => (
                        <div key={subject.id}
                            className="px-3 py-2 rounded-lg hover:bg-green-50
                                cursor-pointer text-gray-700 text-sm font-medium
                                flex justify-between items-center">
                            <span>{subject.name}</span>
                            <span className="text-xs text-gray-400">
                                {subject.tasks.filter(t => !t.completed).length}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Ajustes */}
            <button 
                onClick={onOpenSettings}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm p-2 rounded-lg hover:bg-gray-200"
            >
                <Settings size={18} />
                {sidebarOpen && <span>Ajustes</span>}
            </button>

            {/* Cerrar sesión */}
            <button className="mt-auto flex items-center gap-2 text-gray-400 hover:text-red-500 transition text-sm p-2 rounded-lg hover:bg-red-50"
                onClick={() => {
                    localStorage.removeItem("token"); 
                    navigate("/login");
                }}
            >
                <LogOut size={18} />
                {sidebarOpen && <span>Cerrar sesión</span>}
            </button>
        </div>
    );
};