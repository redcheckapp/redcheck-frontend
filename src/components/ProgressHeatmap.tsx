import { useEffect, useState } from "react";
import { getProgressHeatmap } from "../api/progressRecordApi";
import type { ProgressRecord } from "../types";

export const ProgressHeatmap = () => {
    const [records, setRecords] = useState<Record<string, ProgressRecord>>({});
    const [loading, setLoading] = useState(true);

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

    const days = 84;
    const today = new Date();
    const dateArray = Array.from({ length: days }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (days - 1) + i);
        return d;
    });

    const weeks = [];
    for (let i = 0; i < dateArray.length; i += 7) {
        weeks.push(dateArray.slice(i, i + 7));
    }

    // Devolvemos el color HEX directamente, infalible ante Tailwind
    const getSquareColor = (dateString: string) => {
        const record = records[dateString];
        if (!record || record.totalTasks === 0) return "#e5e7eb"; // Gris base

        const ratio = record.completionRate;
        
        if (ratio === 0) return "#dcfce7"; // Verde muy clarito
        if (ratio < 0.5) return "#86efac"; // Verde claro
        if (ratio < 0.8) return "#22c55e"; // Verde medio
        return "#15803d";                  // Verde oscuro
    };

    const getTooltipText = (date: Date, dateString: string) => {
        const record = records[dateString];
        const dateFormatted = date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
        if (!record || record.totalTasks === 0) return `Sin tareas el ${dateFormatted}`;
        return `${record.completedTasks}/${record.totalTasks} tareas completadas el ${dateFormatted}`;
    };

    if (loading) return <div className="h-24 w-full animate-pulse bg-gray-200 rounded-xl mb-6"></div>;

    return (
        <div className="flex flex-col items-center w-full px-2">
            <p className="text-[11px] text-gray-500 font-medium mb-3 w-full text-left tracking-wide">
                Actividad Diaria
            </p>
            
            <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                
                {/* ETIQUETAS (L, X, V) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', color: '#9ca3af', fontWeight: 500, paddingRight: '4px' }}>
                    <div style={{ height: '12px' }}></div>
                    <div style={{ height: '12px', display: 'flex', alignItems: 'center' }}>L</div>
                    <div style={{ height: '12px' }}></div>
                    <div style={{ height: '12px', display: 'flex', alignItems: 'center' }}>X</div>
                    <div style={{ height: '12px' }}></div>
                    <div style={{ height: '12px', display: 'flex', alignItems: 'center' }}>V</div>
                    <div style={{ height: '12px' }}></div>
                </div>

                {/* COLUMNAS DEL HEATMAP */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {week.map((date, dayIdx) => {
                                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                
                                return (
                                    <div
                                        key={dayIdx}
                                        title={getTooltipText(date, dateString)}
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: getSquareColor(dateString),
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s ease'
                                        }}
                                        // Pequeño efecto hover manual
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};