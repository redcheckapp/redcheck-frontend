import { PieChart } from "lucide-react";
import type { SubjectStat } from "../types";

interface SubjectBalanceProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    stats: SubjectStat[];
}

export const SubjectBalance = ({ sidebarOpen, setSidebarOpen, stats }: SubjectBalanceProps) => {
    
    // If there is no data (for example, new user or loading), we show an elegant empty state
    const isEmpty = !stats || stats.length === 0;

    return (
        <div className="flex flex-col items-center w-full transition-all duration-500 ease-in-out shrink-0 mb-4 mt-2">
            
            {/* --- CLOSED VIEW (Interactive icon) --- */}
            <div className={`transition-all duration-300 ease-in-out flex justify-center overflow-hidden w-full ${!sidebarOpen ? "max-h-[50px] opacity-100" : "max-h-0 opacity-0 hidden"}`}>
                <div 
                    onClick={() => setSidebarOpen(true)} 
                    className="w-10 h-10 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0" 
                    title="Balance de asignaturas"
                >
                    <PieChart size={22} strokeWidth={1.5} />
                </div>
            </div>

            {/* --- OPEN VIEW (Bar chart) --- */}
            <div className={`w-full transition-all duration-500 ease-in-out overflow-hidden flex flex-col ${sidebarOpen ? "max-h-[250px] opacity-100" : "max-h-0 opacity-0"}`}>
                
                <div className="flex items-center justify-between mb-4 px-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Balance de tareas
                    </h3>
                    <PieChart size={14} className="text-gray-300" />
                </div>

                <div className="flex flex-col gap-3 px-5 w-full">
                    {isEmpty ? (
                        <div className="text-center py-4">
                            <span className="text-xs text-gray-400 font-medium italic">Sin datos suficientes</span>
                        </div>
                    ) : (
                        stats.map((item) => (
                            <div key={item.id} className="group cursor-default w-full">
                                <div className="flex justify-between items-center text-[11px] mb-1.5 w-full">
                                    <span className={`font-semibold text-gray-700 truncate mr-2 transition-colors ${item.hoverTextClass}`}>
                                        {item.name}
                                    </span>
                                    <span className="text-gray-500 font-medium shrink-0">{item.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden relative">
                                    <div 
                                        className={`${item.colorClass} h-full rounded-full transition-all duration-1000 ease-out`} 
                                        style={{ width: sidebarOpen ? `${item.percent}%` : "0%" }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};