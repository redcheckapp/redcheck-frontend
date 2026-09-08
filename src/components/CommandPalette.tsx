import { useState, useMemo } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { ModalOverlay } from "./ModalOverlay";

export interface CommandAction {
    id: string;
    label: string;
    icon: LucideIcon;
    onSelect: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    actions: CommandAction[];
    subjects: SubjectWithTasks[];
    onSelectTask: (subjectId: number, taskId: number) => void;
    placeholder: string;
    tasksGroupLabel: string;
    actionsGroupLabel: string;
    emptyLabel: string;
}

const MAX_TASK_RESULTS = 6;

// Built on ModalOverlay so it gets Escape-to-close, focus trap, and
// focus-into-the-first-element (the search input, here) for free — see
// CLAUDE.md's note on ModalOverlay for why that matters.
export const CommandPalette = ({
    isOpen,
    onClose,
    actions,
    subjects,
    onSelectTask,
    placeholder,
    tasksGroupLabel,
    actionsGroupLabel,
    emptyLabel,
}: CommandPaletteProps) => {
    const [query, setQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // Reset on every open rather than in an effect keyed on `isOpen` alone,
    // so re-opening always starts from a clean slate.
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setQuery("");
            setHighlightedIndex(0);
        }
    }

    const filteredActions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return actions;
        return actions.filter(a => a.label.toLowerCase().includes(q));
    }, [actions, query]);

    const taskResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const results: { subjectId: number; subjectName: string; taskId: number; title: string }[] = [];
        for (const subject of subjects) {
            if (subject.archived) continue;
            for (const task of subject.tasks) {
                if (task.title.toLowerCase().includes(q)) {
                    results.push({ subjectId: subject.id, subjectName: subject.name, taskId: task.id, title: task.title });
                    if (results.length >= MAX_TASK_RESULTS) return results;
                }
            }
        }
        return results;
    }, [subjects, query]);

    // One flat list backs keyboard navigation regardless of which visual
    // group (tasks vs. actions) an item belongs to.
    const flatItems = useMemo(() => [
        ...taskResults.map(r => ({ type: "task" as const, ...r })),
        ...filteredActions.map(a => ({ type: "action" as const, ...a })),
    ], [taskResults, filteredActions]);

    // Derived (not stored) — clamps whenever the list shrinks (e.g. typing
    // narrows the results) without needing an effect + extra setState.
    const clampedIndex = flatItems.length === 0 ? 0 : Math.min(highlightedIndex, flatItems.length - 1);

    const runItem = (index: number) => {
        const item = flatItems[index];
        if (!item) return;
        if (item.type === "task") {
            onSelectTask(item.subjectId, item.taskId);
        } else {
            item.onSelect();
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(i => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            runItem(clampedIndex);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose} backdropClassName="bg-black/40">
            {(isVisible) => (
                <div
                    className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                    onKeyDown={handleKeyDown}
                >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <Search size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(0); }}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto py-2">
                        {flatItems.length === 0 && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">{emptyLabel}</p>
                        )}

                        {taskResults.length > 0 && (
                            <div className="px-2 pb-1">
                                <p className="px-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{tasksGroupLabel}</p>
                                {taskResults.map((task, i) => (
                                    <button
                                        key={`task-${task.subjectId}-${task.taskId}`}
                                        onClick={() => runItem(i)}
                                        onMouseEnter={() => setHighlightedIndex(i)}
                                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                            clampedIndex === i
                                                ? "bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-gray-100"
                                                : "text-gray-700 dark:text-gray-200"
                                        }`}
                                    >
                                        <span className="truncate">{task.title}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{task.subjectName}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {filteredActions.length > 0 && (
                            <div className="px-2 pb-1">
                                <p className="px-2 pb-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{actionsGroupLabel}</p>
                                {filteredActions.map((action, i) => {
                                    const flatIndex = taskResults.length + i;
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => runItem(flatIndex)}
                                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                                clampedIndex === flatIndex
                                                    ? "bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-gray-100"
                                                    : "text-gray-700 dark:text-gray-200"
                                            }`}
                                        >
                                            <Icon size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
                        <CornerDownLeft size={12} />
                        <span>Enter</span>
                        <span className="mx-1">·</span>
                        <span>↑↓</span>
                        <span className="mx-1">·</span>
                        <span>Esc</span>
                    </div>
                </div>
            )}
        </ModalOverlay>
    );
};
