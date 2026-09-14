import { useRef, useState, type CSSProperties, type TouchEvent } from "react";

const DISMISS_THRESHOLD_PX = 90;

// Shared "drag the sheet down to dismiss it" gesture for every mobile
// bottom-sheet modal (see ModalOverlay.tsx's "bottom" position). Unlike
// this codebase's other hand-rolled touch gestures (long-press-to-select on
// a list row, the calendar's swipe-nav) — which stay duplicated per
// component because each needs independent state per row/instance — this
// one is byte-for-byte identical behavior at every one of its ~10 call
// sites, so a small shared hook beats copy-pasting the same handlers into
// each modal.
//
// Deliberately scoped to whatever element the returned `handlers` are
// attached to (in practice, just the grabber handle each modal renders at
// its own top edge) rather than the whole sheet body — several of these
// modals have their own internal `overflow-y-auto` content, and starting
// the drag from anywhere in the body would fight that scroll instead of
// scrolling it. The grabber is the one element every bottom sheet has in
// common, and is exactly the drag target native bottom sheets use too.
export const useSwipeToDismiss = (onDismiss: () => void) => {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef<number | null>(null);

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        startYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (startYRef.current === null) return;
        const delta = e.touches[0].clientY - startYRef.current;
        // A sheet only dismisses downward — dragging up (or not moving)
        // just cancels back to resting position instead of doing nothing,
        // so it never gets stuck mid-drag if the finger reverses.
        if (delta <= 0) {
            if (isDragging) {
                setIsDragging(false);
                setDragY(0);
            }
            return;
        }
        setIsDragging(true);
        setDragY(delta);
    };

    const onTouchEnd = () => {
        if (isDragging && dragY > DISMISS_THRESHOLD_PX) onDismiss();
        setIsDragging(false);
        setDragY(0);
        startYRef.current = null;
    };

    // Spread onto the sheet's own outer wrapper style — translateY tracks
    // the finger 1:1 while dragging (transitionDuration: 0ms, same pattern
    // Sidebar.tsx's drawer drag uses), and is absent the rest of the time
    // so the modal's own enter/exit transition classes take over instead.
    const style: CSSProperties | undefined = isDragging
        ? { transform: `translateY(${dragY}px)`, transitionDuration: "0ms" }
        : undefined;

    return { style, handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd } };
};
