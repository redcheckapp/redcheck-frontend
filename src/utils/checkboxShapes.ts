import type { CheckboxStyle } from "../context/CheckboxStyleContext";

// Shared by TaskItem.tsx/OverdueTaskRow.tsx's completion checkbox — the
// only rounding difference between the three styles, so it isn't
// duplicated per file. Selection-mode checkboxes (task multi-select,
// subject multi-select) deliberately stay `rounded-full` regardless of
// this setting — "selected" is its own established blue-circle visual
// language (see CLAUDE.md), unrelated to how a user likes their
// completion checkbox to look.
export const checkboxShapeClass = (style: CheckboxStyle): string => {
    switch (style) {
        case "circle":
            return "rounded-full";
        case "soft":
            return "rounded-lg";
        case "legacy":
        default:
            return "rounded-none";
    }
};
