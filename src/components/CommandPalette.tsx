import { useState, useMemo, useRef, useEffect } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SubjectWithTasks } from "../types";
import { ModalOverlay } from "./ModalOverlay";
import { getSubjectColor } from "../utils/subjectColors";

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
    onSelectSubject: (subjectId: number) => void;
    placeholder: string;
    subjectsGroupLabel: string;
    tasksGroupLabel: string;
    actionsGroupLabel: string;
    emptyLabel: string;
    taskCountOneLabel: string;
    taskCountManyLabel: string;
    moreTasksLabel: string;
}

const MAX_TASK_RESULTS = 6;
const MAX_SUBJECT_RESULTS = 4;
const TASK_PREVIEW_PER_SUBJECT = 3;

// Built on ModalOverlay so it gets Escape-to-close, focus trap, and
// focus-into-the-first-element (the search input, here) for free — see
// CLAUDE.md's note on ModalOverlay for why that matters.
export const CommandPalette = ({
    isOpen,
    onClose,
    actions,
    subjects,
    onSelectTask,
    onSelectSubject,
    placeholder,
    subjectsGroupLabel,
    tasksGroupLabel,
    actionsGroupLabel,
    emptyLabel,
    taskCountOneLabel,
    taskCountManyLabel,
    moreTasksLabel,
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

    // Matches by subject NAME (not task title, see taskResults below) — a
    // subject match carries its own pending/completed-today tasks (the same
    // subset already available on `subjects`, no extra fetch) so the result
    // can preview them inline rather than just naming the subject.
    const subjectResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        const results: { subjectId: number; name: string; previewTasks: SubjectWithTasks["tasks"]; totalTasks: number }[] = [];
        for (const subject of subjects) {
            if (subject.archived) continue;
            if (subject.name.toLowerCase().includes(q)) {
                results.push({
                    subjectId: subject.id,
                    name: subject.name,
                    previewTasks: subject.tasks.slice(0, TASK_PREVIEW_PER_SUBJECT),
                    totalTasks: subject.tasks.length,
                });
                if (results.length >= MAX_SUBJECT_RESULTS) return results;
            }
        }
        return results;
    }, [subjects, query]);

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
    // group (subjects, tasks, or actions) an item belongs to. Subjects lead
    // since typing a subject name is a broader, more deliberate match than
    // an incidental task-title substring hit.
    const flatItems = useMemo(() => [
        ...subjectResults.map(r => ({ type: "subject" as const, ...r })),
        ...taskResults.map(r => ({ type: "task" as const, ...r })),
        ...filteredActions.map(a => ({ type: "action" as const, ...a })),
    ], [subjectResults, taskResults, filteredActions]);

    // Derived (not stored) — clamps whenever the list shrinks (e.g. typing
    // narrows the results) without needing an effect + extra setState.
    const clampedIndex = flatItems.length === 0 ? 0 : Math.min(highlightedIndex, flatItems.length - 1);

    // A single highlight bar that slides/fades between rows (measured via
    // offsetTop/offsetHeight against the scrollable results container)
    // instead of each row toggling its own background — same "one moving
    // indicator, not N per-item toggles" shape as the calendar's Day/Week/
    // Month sliding pill. Positioned by writing directly to the bar's own
    // style from a ref, not via setState — this only ever needs to push a
    // measured DOM value onto another DOM node (an "update an external
    // system" effect, not state synchronization), so there's no re-render
    // to trigger and nothing for the set-state-in-effect lint rule to flag.
    // Subject rows are taller (multi-line preview) than task/action rows,
    // but that's fine — the bar is sized off the actual ref'd element's
    // offsetHeight, not a fixed row height.
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const highlightBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = itemRefs.current[clampedIndex];
        const bar = highlightBarRef.current;
        if (!bar) return;
        if (el) {
            bar.style.top = `${el.offsetTop}px`;
            bar.style.height = `${el.offsetHeight}px`;
            bar.style.opacity = "1";
        } else {
            bar.style.opacity = "0";
        }
    }, [clampedIndex, query, subjectResults.length, taskResults.length, filteredActions.length]);

    const runItem = (index: number) => {
        const item = flatItems[index];
        if (!item) return;
        if (item.type === "subject") {
            onSelectSubject(item.subjectId);
        } else if (item.type === "task") {
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
                        <Search size={18} className="text-gray-500 dark:text-gray-500 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(0); }}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 text-sm outline-none placeholder:text-gray-500 dark:placeholder:text-gray-500"
                        />
                    </div>

                    {/* Tall enough to fit MAX_TASK_RESULTS (6) task rows +
                        the full actions list without scrolling in the
                        common case — min() keeps a viewport-relative fallback
                        so it still fits on short mobile screens. */}
                    <div className="relative max-h-[min(28rem,70vh)] overflow-y-auto py-2">
                        <div
                            ref={highlightBarRef}
                            className="absolute left-2 right-2 rounded-lg bg-red-50 dark:bg-red-900/20 opacity-0 transition-all duration-150 ease-out pointer-events-none"
                        />

                        {flatItems.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">{emptyLabel}</p>
                        )}

                        {subjectResults.length > 0 && (
                            <div className="px-2 pb-1">
                                <p className="px-2 pb-1 text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">{subjectsGroupLabel}</p>
                                {subjectResults.map((subject, i) => {
                                    const subjectColor = getSubjectColor(subject.subjectId);
                                    const extra = subject.totalTasks - subject.previewTasks.length;
                                    return (
                                        <button
                                            key={`subject-${subject.subjectId}`}
                                            ref={(el) => { itemRefs.current[i] = el; }}
                                            onClick={() => runItem(i)}
                                            onMouseEnter={() => setHighlightedIndex(i)}
                                            className={`relative w-full flex flex-col gap-1 px-3 py-2 rounded-lg text-left transition-colors ${
                                                clampedIndex === i
                                                    ? "text-gray-900 dark:text-gray-100"
                                                    : "text-gray-700 dark:text-gray-200"
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${subjectColor.dot}`} />
                                                <span className="text-sm font-semibold truncate flex-1">{subject.name}</span>
                                                {subject.totalTasks > 0 && (
                                                    <span className="text-[11px] text-gray-500 dark:text-gray-500 shrink-0">
                                                        {subject.totalTasks === 1 ? taskCountOneLabel : `${subject.totalTasks} ${taskCountManyLabel}`}
                                                    </span>
                                                )}
                                            </span>
                                            {subject.previewTasks.length > 0 && (
                                                <span className="pl-3.5 flex flex-col gap-0.5">
                                                    {subject.previewTasks.map(task => (
                                                        <span key={task.id} className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                                            · {task.title}
                                                        </span>
                                                    ))}
                                                    {extra > 0 && (
                                                        <span className="text-xs text-gray-400 dark:text-gray-600">+{extra} {moreTasksLabel}</span>
                                                    )}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {taskResults.length > 0 && (
                            <div className="px-2 pb-1">
                                <p className="px-2 pb-1 text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">{tasksGroupLabel}</p>
                                {taskResults.map((task, i) => {
                                    const flatIndex = subjectResults.length + i;
                                    return (
                                        <button
                                            key={`task-${task.subjectId}-${task.taskId}`}
                                            ref={(el) => { itemRefs.current[flatIndex] = el; }}
                                            onClick={() => runItem(flatIndex)}
                                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                            className={`relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                                clampedIndex === flatIndex
                                                    ? "text-gray-900 dark:text-gray-100"
                                                    : "text-gray-700 dark:text-gray-200"
                                            }`}
                                        >
                                            <span className="truncate">{task.title}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">{task.subjectName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {filteredActions.length > 0 && (
                            <div className="px-2 pb-1">
                                <p className="px-2 pb-1 text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">{actionsGroupLabel}</p>
                                {filteredActions.map((action, i) => {
                                    const flatIndex = subjectResults.length + taskResults.length + i;
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            ref={(el) => { itemRefs.current[flatIndex] = el; }}
                                            onClick={() => runItem(flatIndex)}
                                            onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                            className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                                clampedIndex === flatIndex
                                                    ? "text-gray-900 dark:text-gray-100"
                                                    : "text-gray-700 dark:text-gray-200"
                                            }`}
                                        >
                                            <Icon size={16} className="text-gray-500 dark:text-gray-500 shrink-0" />
                                            {action.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-500">
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
