import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { getProgressHeatmap } from "../api/progressRecordApi";
import type { ProgressRecord, SubjectWithTasks } from "../types";

type ViewMode = "day" | "week" | "month";

interface AgendaViewProps {
    subjects?: SubjectWithTasks[]; 
}

export const AgendaView = ({ subjects = [] }: AgendaViewProps) => {
    const [view, setView] = useState<ViewMode>("month");
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<Record<string, ProgressRecord>>({});
    const [loadingRecords, setLoadingRecords] = useState(true);

    const todayObj = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); 

    useEffect(() => {
        const fetchHeatmap = async () => {
            setLoadingRecords(true);
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
                setLoadingRecords(false);
            }
        };
        fetchHeatmap();
    }, []);

    const handlePrev = () => {
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() - 1));
    };

    const handleNext = () => {
        if (view === "month") setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        if (view === "week") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 7));
        if (view === "day") setCurrentDate(new Date(currentYear, currentMonth, currentDate.getDate() + 1));
    };

    const currentWeekDays = useMemo(() => {
        const date = new Date(currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(date);
        monday.setDate(diff);
        
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const tasksForCurrentDay = useMemo(() => {
        if (!subjects || subjects.length === 0) return [];
        
        return subjects.flatMap(subject => {
            return subject.tasks
                .filter(task => {
                    if (!task.deadline) return false;
                    const taskDate = new Date(task.deadline);
                    return taskDate.getFullYear() === currentDate.getFullYear() &&
                           taskDate.getMonth() === currentDate.getMonth() &&
                           taskDate.getDate() === currentDate.getDate();
                })
                .map(task => ({ ...task, subjectName: subject.name })); 
        }).sort((a, b) => {
            return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1; 
        });
    }, [subjects, currentDate]);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

    const totalCellsNeeded = firstDayOfMonth + daysInMonth;
    const rowsNeeded = Math.ceil(totalCellsNeeded / 7);
    const totalCells = rowsNeeded * 7;

    const calendarCells = Array.from({ length: totalCells }, (_, i) => {
        const dayNumber = i - firstDayOfMonth + 1;
        return (dayNumber > 0 && dayNumber <= daysInMonth) ? dayNumber : null;
    });

    const weekDaysNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    let headerTitle = "";
    if (view === "month") {
        headerTitle = `${monthNames[currentMonth]} ${currentYear}`;
    } else if (view === "week") {
        const first = currentWeekDays[0];
        const last = currentWeekDays[6];
        if (first.getMonth() === last.getMonth()) {
            headerTitle = `${first.getDate()} - ${last.getDate()} ${monthNames[first.getMonth()]} ${first.getFullYear()}`;
        } else {
            headerTitle = `${first.getDate()} ${monthNames[first.getMonth()].substring(0,3)} - ${last.getDate()} ${monthNames[last.getMonth()].substring(0,3)} ${last.getFullYear()}`;
        }
    } else {
        headerTitle = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentYear}`;
    }

    const getSquareColor = (dateString: string) => {
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "bg-white dark:bg-gray-900"; 
        const ratio = record.completionRate;
        if (ratio === 0) return "bg-red-50 dark:bg-red-950/30";            
        if (ratio < 0.5) return "bg-[#eaf6ed] dark:bg-green-900/20";         
        if (ratio < 0.8) return "bg-[#4ade80] dark:bg-green-600";         
        return "bg-[#16a34a] dark:bg-green-500";                          
    };

    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 p-8 overflow-hidden">
            
            {/* --- HEADER --- */}
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight capitalize min-w-[280px] transition-colors duration-300">
                        {headerTitle}
                    </h1>
                    
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                            Hoy
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <button onClick={() => setView("day")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${view === "day" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Día</button>
                    <button onClick={() => setView("week")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${view === "week" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Semana</button>
                    <button onClick={() => setView("month")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${view === "month" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Mes</button>
                </div>
            </div>

            {/* --- GRID AREA --- */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col relative transition-colors duration-300">
                
                {loadingRecords && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-colors duration-300">
                        <span className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">Cargando historial...</span>
                    </div>
                )}

                {/* --- VIEW: MONTH --- */}
                {view === "month" && (
                    <>
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {weekDaysNames.map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{day.substring(0,3)}</div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 bg-gray-100 dark:bg-gray-800 gap-[1px] transition-colors duration-300" style={{ gridTemplateRows: `repeat(${rowsNeeded}, minmax(0, 1fr))` }}>
                            {calendarCells.map((dayNum, i) => {
                                if (!dayNum) return <div key={i} className="bg-gray-50/30 dark:bg-gray-800/30 p-3 transition-colors duration-300" />;

                                const cellDateObj = new Date(currentYear, currentMonth, dayNum);
                                const isToday = cellDateObj.toDateString() === todayObj.toDateString();
                                const isPast = cellDateObj < todayObj && !isToday;
                                
                                const cellDateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                                
                                let bgColorClass = isPast || isToday ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                    bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                }

                                const record = records[cellDateString];

                                return (
                                    <div key={i} onClick={() => { setCurrentDate(cellDateObj); setView("day"); }} className={`${bgColorClass} p-2 flex flex-col transition-colors hover:brightness-95 dark:hover:brightness-110 cursor-pointer relative group ${isToday ? "z-10" : ""}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm" : bgColorClass.includes("bg-[#4ade80]") || bgColorClass.includes("bg-[#16a34a]") ? "text-white drop-shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                                                {dayNum}
                                            </span>
                                        </div>
                                        {record && record.totalTasks > 0 && (
                                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-1 rounded truncate shadow-sm flex items-center justify-between transition-colors duration-300">
                                                    <span>Tareas</span>
                                                    <span className={record.completionRate === 1 ? "text-green-600 dark:text-green-400" : ""}>{record.completedTasks}/{record.totalTasks}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* --- VIEW: WEEK --- */}
                {view === "week" && (
                    <div className="flex-1 flex flex-col">
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                return (
                                    <div key={i} className={`py-4 flex flex-col items-center justify-center gap-1 border-r border-gray-100 dark:border-gray-800 last:border-0 transition-colors duration-300 ${isToday ? "bg-red-50/50 dark:bg-red-900/20" : ""}`}>
                                        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isToday ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                                            {weekDaysNames[i].substring(0,3)}
                                        </span>
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xl font-black transition-colors duration-300 ${isToday ? "bg-red-600 text-white shadow-sm mt-0.5" : "text-gray-800 dark:text-gray-200"}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex-1 grid grid-cols-7 bg-gray-100 dark:bg-gray-800 gap-[1px] transition-colors duration-300">
                            {currentWeekDays.map((date, i) => {
                                const isToday = date.toDateString() === todayObj.toDateString();
                                const cellDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                
                                let bgColorClass = (date < todayObj || isToday) ? getSquareColor(cellDateString) : "bg-white dark:bg-gray-900";
                                if (isToday && bgColorClass === "bg-white dark:bg-gray-900") {
                                    bgColorClass = "bg-red-50/50 dark:bg-red-900/20";
                                }
                                
                                return (
                                    <div key={i} className={`${bgColorClass} p-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50`}>
                                        <div className="w-full h-full border-2 border-dashed border-gray-200/50 dark:border-gray-700/50 rounded-xl flex items-center justify-center transition-colors duration-300">
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium opacity-0 hover:opacity-100 transition-opacity">Ver tareas</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- VIEW: DAY --- */}
                {view === "day" && (
                    <div className="flex-1 flex overflow-hidden">
                        
                        <div className="w-20 border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 py-6 flex flex-col overflow-y-auto no-scrollbar shrink-0 transition-colors duration-300">
                            {hours.map(hour => (
                                <div key={hour} className="h-20 flex justify-end pr-4 text-xs font-bold text-gray-400 dark:text-gray-500 relative transition-colors duration-300">
                                    <span className="-mt-2">{hour.toString().padStart(2, '0')}:00</span>
                                </div>
                            ))}
                        </div>
                        
                        {/* El rayado de cuaderno adaptado para que en oscuro sea #1f2937 (gray-800) */}
                        <div className="flex-1 relative overflow-y-auto bg-[linear-gradient(to_bottom,#f9fafb_1px,transparent_1px)] dark:bg-[linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:100%_5rem] p-6 transition-colors duration-300">
                            
                            {currentDate.toDateString() === todayObj.toDateString() && (
                                <div 
                                    className="absolute left-0 right-0 border-t-2 border-red-500 z-10 flex items-center pointer-events-none"
                                    style={{ top: `${((todayObj.getHours() - 8) * 5) + (todayObj.getMinutes() / 12)}rem` }}
                                >
                                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 border-2 border-white dark:border-gray-900 transition-colors duration-300"></div>
                                </div>
                            )}

                            <div className="relative z-20 flex flex-col gap-3 max-w-xl ml-4">
                                {tasksForCurrentDay.length === 0 ? (
                                    <div className="mt-10 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-gray-800/50 transition-colors duration-300">
                                        <CheckCircle2 size={32} className="text-gray-300 dark:text-gray-600 mb-2 transition-colors duration-300" />
                                        <h3 className="text-gray-500 dark:text-gray-400 font-bold transition-colors duration-300">¡Día libre!</h3>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">No hay tareas programadas para este día.</p>
                                    </div>
                                ) : (
                                    tasksForCurrentDay.map(task => {
                                        const tDate = new Date(task.deadline);
                                        const hasTime = tDate.getHours() !== 0 || tDate.getMinutes() !== 0;
                                        const timeString = hasTime 
                                            ? tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                            : "Todo el día";

                                        return (
                                            <div 
                                                key={task.id} 
                                                className={`bg-white dark:bg-gray-800 border p-4 rounded-xl shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${task.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-800' : 'border-blue-100 dark:border-blue-900/30'}`}
                                            >
                                                <div className={`mt-1 w-3 h-3 rounded-full border-2 shrink-0 transition-colors duration-300 ${task.completed ? 'border-green-500 bg-green-100 dark:bg-green-900/30' : 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'}`} />
                                                
                                                <div className="flex flex-col flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors duration-300">
                                                            {task.subjectName}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md transition-colors duration-300">
                                                            <Clock size={12} />
                                                            {timeString}
                                                        </div>
                                                    </div>
                                                    
                                                    <h4 className={`text-sm font-bold transition-colors duration-300 ${task.completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {task.title}
                                                    </h4>
                                                    
                                                    {task.description && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 transition-colors duration-300">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};