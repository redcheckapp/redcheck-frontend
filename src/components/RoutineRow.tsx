import { Pencil, Power, PowerOff, Trash2, Clock, CalendarX2, CalendarClock, Flame } from "lucide-react";
import type { RecurringTaskResponse } from "../types";
import { formatFrequencyLabel, type FrequencyLabels } from "../utils/recurrenceUtils";

export interface RoutineRowLabels extends FrequencyLabels {
    noDesc: string;
    ttEdit: string;
    ttPause: string;
    ttResume: string;
    ttDelete: string;
    lblUntil: string;
    lblNext: string;
    lblPaused: string;
    ttStreak: string;
    ttCompletionRate: string;
}

interface SubjectChip {
    name: string;
    dotClass: string; // e.g. "bg-red-500" from getSubjectColor(subjectId).dot
}

interface RoutineRowProps {
    task: RecurringTaskResponse;
    labels: RoutineRowLabels;
    onEdit: () => void;
    onToggleActive: () => void;
    onDelete: () => void;
    subjectChip?: SubjectChip; // shown only in the global routines view
    showCompletionRate?: boolean; // fuller stats — reserved for the global view, keeps the per-subject list lighter
}

// The view-mode row for one routine — shared by RecurringTasksModal
// (per-subject) and RoutinesView (global, across every subject) so both
// read a routine identically. Editing itself is owned by the caller
// (onEdit just signals intent); see RecurrenceFieldset for the shared
// editing controls both callers build their edit form around.
export const RoutineRow = ({ task, labels, onEdit, onToggleActive, onDelete, subjectChip, showCompletionRate = false }: RoutineRowProps) => {
    const hasMetaRow = task.time || task.endDate || task.nextOccurrence || !task.active || task.currentStreak > 0 || (showCompletionRate && task.totalGenerated > 0);

    return (
        <div className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-300 ${task.active ? 'border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-800 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-75'}`}>
            <div className="flex-1 min-w-0 pr-3">
                <p className={`text-sm font-semibold truncate transition-colors duration-300 ${task.active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>{task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 flex items-center gap-1.5 transition-colors duration-300">
                    {subjectChip && (
                        <span className="flex items-center gap-1 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${subjectChip.dotClass}`} />
                            <span className="font-semibold text-gray-600 dark:text-gray-300">{subjectChip.name}</span>
                        </span>
                    )}
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors duration-300 shrink-0">
                        {formatFrequencyLabel(task.frequency, labels)}
                    </span>
                    <span className="truncate">{task.description || labels.noDesc}</span>
                </p>
                {hasMetaRow && (
                    <p className="flex items-center gap-2.5 flex-wrap mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 transition-colors duration-300">
                        {task.currentStreak > 0 && (
                            <span title={labels.ttStreak} className="flex items-center gap-1 text-orange-500 dark:text-orange-400 font-bold">
                                <Flame size={11} />{task.currentStreak}
                            </span>
                        )}
                        {showCompletionRate && task.totalGenerated > 0 && (
                            <span title={labels.ttCompletionRate}>{Math.round(task.completionRate * 100)}%</span>
                        )}
                        {task.time && (
                            <span className="flex items-center gap-1">
                                <Clock size={11} />{task.time.slice(0, 5)}
                            </span>
                        )}
                        {task.endDate && (
                            <span className="flex items-center gap-1">
                                <CalendarX2 size={11} />{labels.lblUntil} {new Date(`${task.endDate}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                            </span>
                        )}
                        {task.active ? (
                            task.nextOccurrence && (
                                <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold">
                                    <CalendarClock size={11} />{labels.lblNext} {new Date(task.nextOccurrence).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                                </span>
                            )
                        ) : (
                            <span className="italic">{labels.lblPaused}</span>
                        )}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={onEdit}
                    className="p-2 text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 rounded-lg transition-all duration-200"
                    title={labels.ttEdit}
                >
                    <Pencil size={18} />
                </button>
                <button
                    onClick={onToggleActive}
                    className={`p-2 rounded-lg active:scale-90 transition-all duration-200 ${task.active ? 'text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title={task.active ? labels.ttPause : labels.ttResume}
                >
                    {task.active ? <Power size={18} /> : <PowerOff size={18} />}
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-red-400 dark:text-red-500/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 rounded-lg transition-all duration-200"
                    title={labels.ttDelete}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};
