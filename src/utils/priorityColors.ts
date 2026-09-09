import type { TaskPriority } from "../types";

// Deliberately a separate palette from subjectColors.ts's per-subject
// colors (see that file) — priority and subject are two different visual
// dimensions on the same task chip/badge, so they need their own,
// non-overlapping set of colors to stay readable side by side. Full literal
// class strings (not template-built) so Tailwind's build-time scanner picks
// them all up. Neutral (gray) for LOW rather than a "positive" color like
// green, since green is already used elsewhere for completion state
// (heatmap, confetti) and would read as "done" rather than "low priority".
const PRIORITY_COLOR_MAP: Record<TaskPriority, { bg: string; border: string; text: string; dot: string; ring: string }> = {
    LOW: {
        bg: "bg-gray-100 dark:bg-gray-800/60",
        border: "border-gray-300 dark:border-gray-700",
        text: "text-gray-600 dark:text-gray-400",
        dot: "bg-gray-400",
        ring: "ring-gray-300 dark:ring-gray-700",
    },
    MEDIUM: {
        bg: "bg-sky-100 dark:bg-sky-900/30",
        border: "border-sky-300 dark:border-sky-800",
        text: "text-sky-700 dark:text-sky-400",
        dot: "bg-sky-500",
        ring: "ring-sky-300 dark:ring-sky-800",
    },
    HIGH: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-300 dark:border-orange-800",
        text: "text-orange-700 dark:text-orange-400",
        dot: "bg-orange-500",
        ring: "ring-orange-300 dark:ring-orange-800",
    },
};

export const getPriorityColor = (priority: TaskPriority) => PRIORITY_COLOR_MAP[priority];

// Order used wherever priorities are listed (selectors) or sorted by —
// highest first, matching how "sort by priority" should read.
export const PRIORITY_ORDER: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

// Stable sort (HIGH first) — used by DashboardPage's "sort by priority"
// toggle. Copies rather than mutating, and only compares priority, so tasks
// sharing a priority keep whatever relative order they already had (e.g.
// deadline order).
export const sortTasksByPriority = <T extends { priority: TaskPriority }>(tasks: T[]): T[] =>
    [...tasks].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
