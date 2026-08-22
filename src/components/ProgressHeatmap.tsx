import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getProgressHeatmap } from "../api/progressRecordApi";
import type { ProgressRecord } from "../types";

export const ProgressHeatmap = () => {
    const [records, setRecords] = useState<Record<string, ProgressRecord>>({});
    const [loading, setLoading] = useState(true);

    const [tooltip, setTooltip] = useState({ 
        show: false, 
        text: "", 
        x: 0, 
        y: 0 
    });

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                const data = await getProgressHeatmap();
                const recordMap: Record<string, ProgressRecord> = {};
                data.forEach(item => {
                    const dateKey = item.date.split("T")[0]; 
                    recordMap[dateKey] = item;
                });
                setRecords(recordMap);
            } catch (error) {
                console.error("Error al cargar el heatmap:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, []);

    const daysToShow = 84; 
    const today = new Date();
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);
    
    const dayOfWeek = startDate.getDay(); 
    const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - offsetToMonday);

    const totalDays = daysToShow + offsetToMonday;
    const dateArray = Array.from({ length: totalDays }).map((_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });

    // We group by weeks to paint the months
    const weeks = [];
    for (let i = 0; i < dateArray.length; i += 7) {
        weeks.push(dateArray.slice(i, i + 7));
    }

    const getSquareColorClass = (dateString: string) => {
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "bg-gray-200 dark:bg-gray-800"; 

        const ratio = record.completionRate;
        if (ratio === 0) return "bg-red-100 dark:bg-red-900/40"; 
        if (ratio < 0.5) return "bg-green-300 dark:bg-green-900/60"; 
        if (ratio < 0.8) return "bg-green-500 dark:bg-green-600"; 
        return "bg-green-700 dark:bg-green-400"; 
    };

    const getTooltipText = (date: Date, dateString: string) => {
        const record = records[dateString];
        const dateFormatted = date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
        if (!record || record.totalTasks === 0) return `Sin tareas el ${dateFormatted}`;
        return `${record.completedTasks}/${record.totalTasks} tareas completadas el ${dateFormatted}`;
    };

    if (loading) return <div className="h-24 w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl mb-6 transition-colors duration-300"></div>;

    return (
        <div className="flex flex-col items-center w-full px-2 relative transition-colors duration-300">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-3 w-full text-left tracking-wide transition-colors duration-300">
                Actividad Diaria
            </p>
            
            <div className="flex gap-2 w-full justify-center overflow-x-visible">
                
                {/* L X V Column */}
                <div className="pt-[18px]">
                    <div className="grid grid-rows-7 gap-1 text-[9px] text-gray-400 dark:text-gray-500 font-medium pr-1 transition-colors duration-300">
                        <div className="h-3 flex items-center leading-none">L</div>
                        <div className="h-3"></div>
                        <div className="h-3 flex items-center leading-none">X</div>
                        <div className="h-3"></div>
                        <div className="h-3 flex items-center leading-none">V</div>
                        <div className="h-3"></div>
                        <div className="h-3"></div>
                    </div>
                </div>

                {/* Wrapper for the Months Header + Grid */}
                <div className="flex flex-col gap-1.5">
                    
                    {/* --- MONTHS HEADER --- */}
                    <div className="flex gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium h-3 transition-colors duration-300">
                        {weeks.map((week, idx) => {
                            const currentMonth = week[0].getMonth();
                            let showMonth = false;
                            
                            if (idx === 0) {
                                showMonth = week[0].getDate() <= 20;
                            } else {
                                const prevMonth = weeks[idx - 1][0].getMonth();
                                showMonth = currentMonth !== prevMonth;
                            }

                            let monthName = "";
                            if (showMonth) {
                                const rawMonth = week[0].toLocaleDateString("es-ES", { month: "short" }).replace('.', '');
                                monthName = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
                            }

                            return (
                                <div key={`month-${idx}`} className="w-3 relative">
                                    {showMonth && (
                                        <span className="absolute bottom-0 left-0 whitespace-nowrap">
                                            {monthName}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* --- HEATMAP GRID --- */}
                    <div className="grid grid-rows-7 grid-flow-col gap-1">
                        {dateArray.map((date, idx) => {
                            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            const isFuture = date > today;
                            const text = isFuture ? "" : getTooltipText(date, dateString);

                            const squareClass = isFuture ? 'bg-transparent opacity-0 cursor-default' : `${getSquareColorClass(dateString)} cursor-pointer hover:scale-125 hover:z-20`;

                            return (
                                <div
                                    key={idx}
                                    className={`w-3 h-3 rounded-sm transition-all duration-200 ease-out ${squareClass}`}
                                    onMouseEnter={(e) => {
                                        if (!isFuture) setTooltip({ show: true, text, x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseMove={(e) => {
                                        if (!isFuture) setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip(prev => ({ ...prev, show: false }));
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FLOATING TOOLTIP ADAPTADO A MÚLTIPLES LÍNEAS */}
            {tooltip.show && createPortal(
                <div 
                    className="fixed z-[9999] px-3 py-2 text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 rounded-lg shadow-xl pointer-events-none max-w-[180px] text-center leading-tight"
                    style={{ 
                        left: tooltip.x, 
                        top: tooltip.y - 12,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    {tooltip.text}
                    <div className="absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>,
                document.body
            )}
        </div>
    );
};