// Curated hex palette offered when creating/editing an event category —
// matches the hues SUBJECT_COLOR_PALETTE (subjectColors.ts) already uses,
// but stored as raw hex rather than Tailwind classes: a category's color is
// user-chosen data rendered via inline `style`, not something Tailwind's
// build-time class scanner can ever see literally in source.
export const EVENT_CATEGORY_COLOR_PALETTE = [
    "#ef4444", // red-500
    "#3b82f6", // blue-500
    "#f59e0b", // amber-500
    "#10b981", // emerald-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#6366f1", // indigo-500
    "#f97316", // orange-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#64748b", // slate-500
];

// Fallback for an event with no category assigned.
export const DEFAULT_EVENT_COLOR = "#6b7280"; // gray-500
