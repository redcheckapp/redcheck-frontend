import { useCallback, useRef, type TouchEvent } from "react";
import { triggerHapticFeedback } from "../utils/feedback";

const ACTION_THRESHOLD_PX = 80;
const MAX_DRAG_PX = 120;
const SPRING_BACK_MS = 200;
const COMMIT_SETTLE_MS = 150;
const DIRECTION_LOCK_PX = 10;

interface UseSwipeActionsOptions {
    // Omit either side to disable that direction entirely (e.g. no
    // "complete" swipe on an already-completed task).
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    // e.g. while the row is in bulk-selection mode — a stray drag
    // shouldn't complete/delete a task someone's trying to select.
    disabled?: boolean;
}

// Shared "swipe a row to reveal a quick action" gesture (swipe right to
// complete a task, left to delete it) — the same native list-row pattern
// Mail/Reminders/Todoist use. Same DOM-imperative, rAF-batched approach as
// useSwipeToDismiss (see that file's comment for the full reasoning: a
// useState-driven version visibly lags behind touchmove's event rate),
// just horizontal instead of vertical, and two-directional with two
// separate reveal panels instead of one.
//
// Scoped to whatever element `handlers` end up on (the row itself, in
// practice) — `touch-action: pan-y` on that same element (set by the
// caller, since it's a Tailwind class not something this hook can apply)
// is what lets native vertical list scrolling keep working alongside this:
// the browser handles vertical panning on its own, this hook only ever
// intervenes once it's seen a clearly horizontal drag.
export const useSwipeActions = ({ onSwipeRight, onSwipeLeft, disabled }: UseSwipeActionsOptions) => {
    const rowRef = useRef<HTMLDivElement | null>(null);
    const leftActionRef = useRef<HTMLDivElement | null>(null);
    const rightActionRef = useRef<HTMLDivElement | null>(null);

    const startXRef = useRef<number | null>(null);
    const startYRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const directionRef = useRef<1 | -1 | 0>(0);
    const currentXRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const pendingXRef = useRef<number | null>(null);

    const flushTransform = useCallback(() => {
        rafRef.current = null;
        const x = pendingXRef.current;
        if (x === null) return;
        const row = rowRef.current;
        if (row) {
            row.style.transition = "none";
            row.style.transform = `translateX(${x}px)`;
        }
        if (leftActionRef.current) leftActionRef.current.style.width = `${Math.max(0, x)}px`;
        if (rightActionRef.current) rightActionRef.current.style.width = `${Math.max(0, -x)}px`;
    }, []);

    const scheduleTransform = useCallback((x: number) => {
        pendingXRef.current = x;
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(flushTransform);
        }
    }, [flushTransform]);

    const settle = useCallback((x: number, durationMs: number) => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        const row = rowRef.current;
        if (row) {
            row.style.transition = `transform ${durationMs}ms ease-out`;
            row.style.transform = x === 0 ? "" : `translateX(${x}px)`;
        }
        const revealWidth = Math.max(0, x);
        const revealWidthOpposite = Math.max(0, -x);
        if (leftActionRef.current) {
            leftActionRef.current.style.transition = `width ${durationMs}ms ease-out`;
            leftActionRef.current.style.width = `${revealWidth}px`;
        }
        if (rightActionRef.current) {
            rightActionRef.current.style.transition = `width ${durationMs}ms ease-out`;
            rightActionRef.current.style.width = `${revealWidthOpposite}px`;
        }
    }, []);

    const hapticTick = () => {
        if (localStorage.getItem("taskFeedbackEnabled") !== "false") triggerHapticFeedback();
    };

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (disabled) return;
        startXRef.current = e.touches[0].clientX;
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = false;
        directionRef.current = 0;
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (disabled || startXRef.current === null || startYRef.current === null) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startXRef.current;
        const deltaY = touch.clientY - startYRef.current;

        if (!isDraggingRef.current) {
            // Require clearly horizontal, deliberate intent — same
            // disambiguation this codebase's other swipe gestures use —
            // so vertical list scrolling never gets hijacked, and commit
            // to whichever direction the finger actually moved so a
            // disabled side (no onSwipeRight/Left) never drags at all.
            if (Math.abs(deltaX) < DIRECTION_LOCK_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
            if (deltaX > 0 && !onSwipeRight) return;
            if (deltaX < 0 && !onSwipeLeft) return;
            isDraggingRef.current = true;
            directionRef.current = deltaX > 0 ? 1 : -1;
        }

        const clamped = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, deltaX));
        // Locked to the direction committed to above — if the finger
        // reverses past the resting point, this clamps to exactly 0
        // rather than letting the reveal flip to the opposite action.
        const constrained = directionRef.current === 1 ? Math.max(0, clamped) : Math.min(0, clamped);
        currentXRef.current = constrained;
        scheduleTransform(constrained);
    };

    const onTouchEnd = () => {
        const wasDragging = isDraggingRef.current;
        const finalX = currentXRef.current;
        isDraggingRef.current = false;
        startXRef.current = null;
        startYRef.current = null;
        currentXRef.current = 0;
        directionRef.current = 0;

        if (!wasDragging) return;

        if (finalX > ACTION_THRESHOLD_PX && onSwipeRight) {
            hapticTick();
            onSwipeRight();
            settle(0, SPRING_BACK_MS);
        } else if (finalX < -ACTION_THRESHOLD_PX && onSwipeLeft) {
            hapticTick();
            // Keeps sliding left off-screen from exactly where the finger
            // left it — the row is about to be removed from the list
            // entirely (isDeleting's own collapse animation takes over
            // right after), so there's nothing to spring back to.
            const row = rowRef.current;
            settle(-((row?.offsetWidth ?? 400) + 40), COMMIT_SETTLE_MS);
            onSwipeLeft();
        } else {
            settle(0, SPRING_BACK_MS);
        }
    };

    return {
        rowRef,
        leftActionRef,
        rightActionRef,
        handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
    };
};
