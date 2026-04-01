import { useEffect, useState } from "react";
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

    const getSquareColor = (dateString: string) => {
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "#e5e7eb"; 

        const ratio = record.completionRate;
        if (ratio === 0) return "#fee2e2"; 
        if (ratio < 0.5) return "#86efac"; 
        if (ratio < 0.8) return "#22c55e"; 
        return "#15803d";                  
    };

    const getTooltipText = (date: Date, dateString: string) => {
        const record = records[dateString];
        const dateFormatted = date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
        if (!record || record.totalTasks === 0) return `Sin tareas el ${dateFormatted}`;
        return `${record.completedTasks}/${record.totalTasks} tareas completadas el ${dateFormatted}`;
    };

    if (loading) return <div className="h-24 w-full animate-pulse bg-gray-200 rounded-xl mb-6"></div>;

    return (
        <div className="flex flex-col items-center w-full px-2 relative">
            <p className="text-[11px] text-gray-500 font-medium mb-3 w-full text-left tracking-wide">
                Actividad Diaria
            </p>
            
            <div className="flex gap-2 w-full justify-center overflow-x-visible">
                
                {/* L X V Column - Pushed down 18px to perfectly align with the squares below the month header */}
                <div className="pt-[18px]">
                    <div className="grid grid-rows-7 gap-1 text-[9px] text-gray-400 font-medium pr-1">
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
                    <div className="flex gap-1 text-[10px] text-gray-400 font-medium h-3">
                        {weeks.map((week, idx) => {
                            const currentMonth = week[0].getMonth();
                            let showMonth = false;
                            
                            if (idx === 0) {
                                // In the first column, we show the month only if it's not about to end
                                showMonth = week[0].getDate() <= 20;
                            } else {
                                // We show the month if it has changed compared to the previous week
                                const prevMonth = weeks[idx - 1][0].getMonth();
                                showMonth = currentMonth !== prevMonth;
                            }

                            // We format it to look nice ("Jan", "Feb", etc.) without dots
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

                            return (
                                <div
                                    key={idx}
                                    className={`w-3 h-3 rounded-sm ${isFuture ? 'opacity-0 cursor-default' : 'cursor-pointer hover:scale-125 transition-transform duration-200 ease-out hover:z-20'}`}
                                    style={{
                                        backgroundColor: isFuture ? 'transparent' : getSquareColor(dateString),
                                    }}
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

            {/* FLOATING TOOLTIP */}
            {tooltip.show && (
                <div 
                    className="fixed z-[100] px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-150 animate-in fade-in"
                    style={{ left: tooltip.x, top: tooltip.y - 12 }}
                >
                    {tooltip.text}
                    <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
            )}
        </div>
    );
};