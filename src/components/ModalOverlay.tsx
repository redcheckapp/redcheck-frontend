import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalOverlayProps {
    isOpen: boolean;
    backdropClassName?: string;
    children: (isVisible: boolean) => ReactNode;
}

const TRANSITION_MS = 200;

// Shared enter/exit animation for every modal-with-backdrop in the app: the
// dim+blur backdrop and the dialog itself fade/scale in together instead of
// popping in at once, and reverse the same way on close. `children` is a
// render prop so each modal keeps its own dialog markup/sizing and only
// receives `isVisible` to drive its own transition classes.
export const ModalOverlay = ({ isOpen, backdropClassName = "bg-black/40", children }: ModalOverlayProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

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
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 ${backdropClassName} ${
                isVisible ? "opacity-100" : "opacity-0"
            }`}
        >
            {children(isVisible)}
        </div>,
        document.body
    );
};
