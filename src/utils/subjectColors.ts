// A stable per-subject color across the whole calendar (Day/Week/Month) and
// the task modal, so the same subject always reads the same color regardless
// of view or current filter/sort order. Keyed by `subjectId % length`, not
// array position, so it stays stable even if the subjects list gets
// reordered, filtered, or a subject is deleted. Full literal class strings
// (not template-built) so Tailwind's build-time scanner picks them all up.
// Pulled out of AgendaView.tsx into its own file — a plain component file
// can't export non-component values without breaking react-refresh.
const SUBJECT_COLOR_PALETTE = [
    { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", hoverText: "group-hover:text-red-600" },
    { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", hoverText: "group-hover:text-blue-600" },
    { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", hoverText: "group-hover:text-amber-600" },
    { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", hoverText: "group-hover:text-emerald-600" },
    { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-900/30", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500", hoverText: "group-hover:text-purple-600" },
    { bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-900/30", text: "text-pink-700 dark:text-pink-400", dot: "bg-pink-500", hoverText: "group-hover:text-pink-600" },
    { bg: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-900/30", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-500", hoverText: "group-hover:text-teal-600" },
    { bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-200 dark:border-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500", hoverText: "group-hover:text-indigo-600" },
];

export const getSubjectColor = (subjectId: number) =>
    SUBJECT_COLOR_PALETTE[subjectId % SUBJECT_COLOR_PALETTE.length];
