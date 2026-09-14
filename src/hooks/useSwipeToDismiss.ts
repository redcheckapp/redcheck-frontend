import { useCallback, useRef, type TouchEvent } from "react";

const DISMISS_THRESHOLD_PX = 90;
const SPRING_BACK_MS = 200;
const DISMISS_SLIDE_MS = 200;

// Shared "drag the sheet down to dismiss it" gesture for every mobile
// bottom-sheet modal (see ModalOverlay.tsx's "bottom" position). Unlike
// this codebase's other hand-rolled touch gestures (long-press-to-select on
// a list row, the calendar's swipe-nav) — which stay duplicated per
// component because each needs independent state per row/instance — this
// one is byte-for-byte identical behavior at every one of its ~10 call
// sites, so a small shared hook beats copy-pasting the same handlers into
// each modal.
//
// Deliberately DOM-imperative, not React-state-driven (fixed after a real
// "feels laggy" report): the first version tracked the drag offset in
// useState and passed it down as an inline `style` prop, which meant a
// full component re-render on every touchmove — fine for a small modal,
// visibly janky on a heavier one (Settings, with its many sections),
// since React's render+commit cycle can't reliably keep up with
// touchmove's event rate. This version mutates the sheet's own
// `style.transform` directly through a ref, batched to one write per
// animation frame — the same technique drag libraries like Framer
// Motion/react-spring use — so the sheet tracks the finger every frame
// with zero React render involved. React only re-enters the picture once,
// at the very end, via `onDismiss`.
//
// Scoped to whatever element the returned `handlers` are attached to (in
// practice, just the grabber handle each modal renders at its own top
// edge) rather than the whole sheet body — several of these modals have
// their own internal `overflow-y-auto` content, and starting the drag from
// anywhere in the body would fight that scroll instead of scrolling it.
// The grabber is the one element every bottom sheet has in common, and is
// exactly the drag target native bottom sheets use too. `sheetRef` is
// attached separately, to the sheet's own outer wrapper — the element this
// hook actually animates.
export const useSwipeToDismiss = (onDismiss: () => void) => {
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const currentYRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const pendingYRef = useRef<number | null>(null);

    const flushTransform = useCallback(() => {
        rafRef.current = null;
        const el = sheetRef.current;
        const y = pendingYRef.current;
        if (!el || y === null) return;
        el.style.transition = "none";
        el.style.transform = `translateY(${y}px)`;
    }, []);

    // Coalesces potentially several touchmove events per frame into a
    // single style write, right before the browser's next paint.
    const scheduleTransform = useCallback((y: number) => {
        pendingYRef.current = y;
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(flushTransform);
        }
    }, [flushTransform]);

    // Hands the element back to a CSS transition for its post-drag
    // settle — either springing back to resting position (cancelled) or
    // continuing on past the bottom edge (dismissed), rather than
    // snapping instantly the way the live-drag writes above do.
    const settle = useCallback((y: number, durationMs: number) => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        const el = sheetRef.current;
        if (!el) return;
        el.style.transition = `transform ${durationMs}ms ease-out`;
        el.style.transform = y === 0 ? "" : `translateY(${y}px)`;
    }, []);

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (startYRef.current === null) return;
        const delta = e.touches[0].clientY - startYRef.current;
        // A sheet only dismisses downward — dragging up (or not moving)
        // just cancels back to resting position instead of doing nothing,
        // so it never gets stuck mid-drag if the finger reverses.
        if (delta <= 0) {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                currentYRef.current = 0;
                settle(0, SPRING_BACK_MS);
            }
            return;
        }
        isDraggingRef.current = true;
        currentYRef.current = delta;
        scheduleTransform(delta);
    };

    const onTouchEnd = () => {
        const wasDragging = isDraggingRef.current;
        const finalY = currentYRef.current;
        isDraggingRef.current = false;
        startYRef.current = null;
        currentYRef.current = 0;

        if (wasDragging && finalY > DISMISS_THRESHOLD_PX) {
            // Keeps sliding down off-screen from exactly where the finger
            // left it, instead of snapping to match whatever ModalOverlay's
            // own (React-state-driven, and therefore one render tick
            // behind) exit transition would compute — that mismatch is
            // what used to read as a stutter right at release.
            const el = sheetRef.current;
            settle(finalY + (el?.offsetHeight ?? 600), DISMISS_SLIDE_MS);
            onDismiss();
        } else if (wasDragging) {
            settle(0, SPRING_BACK_MS);
        }
    };

    return { sheetRef, handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd } };
};
