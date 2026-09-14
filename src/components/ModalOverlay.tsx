import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalOverlayProps {
    isOpen: boolean;
    onClose?: () => void;
    backdropClassName?: string;
    // "bottom" (default): docks to the bottom edge on mobile, a native
    // sheet, while staying a centered card from `sm:` up — see the class
    // comment below. "center" opts out and stays centered at every width;
    // CommandPalette is the one user of this — a bottom sheet fights the
    // on-screen keyboard there (the search input is the first thing
    // tapped, and a sheet anchored under a keyboard reads worse than a
    // dialog that just stays where it was).
    position?: "bottom" | "center";
    children: (isVisible: boolean) => ReactNode;
}

const TRANSITION_MS = 200;

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared enter/exit animation for every modal-with-backdrop in the app: the
// dim+blur backdrop and the dialog itself fade/scale in together instead of
// popping in at once, and reverse the same way on close. `children` is a
// render prop so each modal keeps its own dialog markup/sizing and only
// receives `isVisible` to drive its own transition classes.
//
// On mobile the dialog docks to the bottom edge instead of floating
// centered (items-end + no gutter, vs. items-center + p-4 from `sm:` up) —
// a bottom sheet reads as the native pattern on a phone, a centered card as
// the native pattern on desktop. Each modal's own wrapper picks up the
// matching look (rounded-t-* only + slide-up-from-bottom below `sm:`,
// fully rounded + fade/scale from `sm:` up) — see any modal built on this
// for the exact class shape to copy for a new one.
export const ModalOverlay = ({ isOpen, onClose, backdropClassName = "bg-black/40", position = "bottom", children }: ModalOverlayProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);

    // Escape-to-close, shared by every modal that uses this wrapper instead
    // of each one wiring its own listener.
    useEffect(() => {
        if (!isOpen || !onClose) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Focus management, also shared by every modal via this wrapper: move
    // focus into the dialog when it opens, trap Tab/Shift+Tab within it
    // while open, and restore focus to whatever triggered it on close —
    // without this, keyboard and screen-reader users lose their place.
    useEffect(() => {
        if (!isOpen) return;

        triggerElementRef.current = document.activeElement as HTMLElement | null;

        // Wait a frame so the dialog content — rendered by the parent via
        // the `children` render prop — has actually mounted first.
        const raf = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;
            const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            (focusable[0] ?? container).focus();
        });

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== "Tab" || !containerRef.current) return;
            const focusable = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", handleTabKey);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", handleTabKey);
            triggerElementRef.current?.focus?.();
        };
    }, [isOpen]);

    // Render-phase updates: mount / start closing immediately, no need to
    // wait for the effect below for either of these.
    if (isOpen && !shouldRender) {
        setShouldRender(true);
    }
    if (!isOpen && isVisible) {
        setIsVisible(false);
    }

    useEffect(() => {
        if (isOpen) {
            // Wait a frame so the browser paints the "hidden" state first —
            // otherwise there's no starting point for the transition to animate from.
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        const timer = setTimeout(() => setShouldRender(false), TRANSITION_MS);
        return () => clearTimeout(timer);
    }, [isOpen]);

    if (!shouldRender) return null;

    return createPortal(
        <div
            ref={containerRef}
            tabIndex={-1}
            className={`fixed inset-0 z-[100] flex justify-center backdrop-blur-sm transition-opacity duration-200 outline-none ${
                position === "center" ? "items-center p-4" : "items-end sm:items-center p-0 sm:p-4"
            } ${backdropClassName} ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            {children(isVisible)}
        </div>,
        document.body
    );
};
