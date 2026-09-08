import { useEffect, useState } from "react";

interface PageTransitionProps {
    children: React.ReactNode;
}

// Plain CSS mount transition — replaces a former framer-motion (~120KB)
// implementation that only ever ran its `enter` animation in practice: the
// `exit` prop it also set requires wrapping in <AnimatePresence> to do
// anything, and nothing in the app does that, so route-change exit
// animations never actually fired. Not worth the dependency for a
// two-property fade + slide-in.
export const PageTransition = ({ children }: PageTransitionProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className={`w-full h-full transition-all duration-[400ms] ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[15px]"
            }`}
        >
            {children}
        </div>
    );
};
