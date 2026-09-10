import { Check, Star, Heart, Flame, PartyPopper, Skull, type LucideIcon } from "lucide-react";
import type { CheckboxIcon } from "../context/CheckboxStyleContext";

// Shared by TaskItem.tsx/OverdueTaskRow.tsx's completion checkbox and the
// Settings picker's live previews, same reasoning as checkboxShapeClass.
export const CHECKBOX_ICON_COMPONENTS: Record<CheckboxIcon, LucideIcon> = {
    check: Check,
    star: Star,
    heart: Heart,
    flame: Flame,
    "party-popper": PartyPopper,
    skull: Skull,
};
