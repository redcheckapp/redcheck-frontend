import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getProgressHeatmap } from "../api/progressRecordApi";
import type { ProgressRecord } from "../types";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context

// --- Translation dictionary for the Heatmap ---
const translations = {
    es: {
        dailyActivity: "Actividad Diaria",
        day1: "L", // Monday
        day3: "X", // Wednesday
        day5: "V", // Friday
        noTasks: "Sin tareas el",
        tasksCompleted: "tareas completadas el"
    },
    en: {
        dailyActivity: "Daily Activity",
        day1: "M", // Monday
        day3: "W", // Wednesday
        day5: "F", // Friday
        noTasks: "No tasks on",
        tasksCompleted: "tasks completed on"
    }
};

export const ProgressHeatmap = () => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const locale = language === 'es' ? 'es-ES' : 'en-US'; // Locale used by the date formatter

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
                console.error("Error loading the heatmap:", error);
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
    const weeks: Date[][] = [];
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
        // Format the date using the dynamic locale (es-ES or en-US)
        const dateFormatted = date.toLocaleDateString(locale, { month: "short", day: "numeric" });
        
        if (!record || record.totalTasks === 0) return `${t.noTasks} ${dateFormatted}`;
        return `${record.completedTasks}/${record.totalTasks} ${t.tasksCompleted} ${dateFormatted}`;
    };

    if (loading) return <div className="h-24 w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl mb-6 transition-colors duration-300"></div>;

    return (
        <div className="flex flex-col items-center w-full px-2 relative transition-colors duration-300">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-3 w-full text-left tracking-wide transition-colors duration-300">
                {t.dailyActivity}
            </p>
            
            <div className="flex gap-2 w-full justify-center overflow-x-visible">
                
                {/* Days of the week (L X V / M W F) */}
                <div className="pt-[18px]">
                    <div className="grid grid-rows-7 gap-1 text-[9px] text-gray-500 dark:text-gray-500 font-medium pr-1 transition-colors duration-300">
                        <div className="h-3 flex items-center leading-none">{t.day1}</div>
                        <div className="h-3"></div>
                        <div className="h-3 flex items-center leading-none">{t.day3}</div>
                        <div className="h-3"></div>
                        <div className="h-3 flex items-center leading-none">{t.day5}</div>
                        <div className="h-3"></div>
                        <div className="h-3"></div>
                    </div>
                </div>

                {/* Wrapper for the Months Header + Grid */}
                <div className="flex flex-col gap-1.5">
                    
                    {/* --- MONTHS HEADER --- */}
                    <div className="flex gap-1 text-[10px] text-gray-500 dark:text-gray-500 font-medium h-3 transition-colors duration-300">
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
                                // Apply the locale to get the month name in English or Spanish
                                const rawMonth = week[0].toLocaleDateString(locale, { month: "short" }).replace('.', '');
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

            {/* FLOATING TOOLTIP ADAPTED FOR MULTIPLE LINES */}
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