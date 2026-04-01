import { useState, useEffect } from "react";

interface AnimatedVisibilityProps {
    isVisible: boolean;
    children: React.ReactNode;
}

export const AnimatedVisibility = ({ isVisible, children }: AnimatedVisibilityProps) => {
    // We save the previous prop to know if it has changed in this render
    const [prevIsVisible, setPrevIsVisible] = useState(isVisible);
    
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [isClosing, setIsClosing] = useState(false);

    // If the 'isVisible' prop has just changed, we adjust the states directly here.
    if (isVisible !== prevIsVisible) {
        setPrevIsVisible(isVisible);
        
        if (isVisible) {
            setShouldRender(true);
            setIsClosing(false);
        } else {
            setIsClosing(true);
        }
    }

    // useEffect manages the exit "timer" to destroy the HTML
    useEffect(() => {
        if (!isVisible && shouldRender) {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 200); // 200ms = duration of the CSS animation
            
            return () => clearTimeout(timer);
        }
    }, [isVisible, shouldRender]);

    // If it should not be rendered, we return nothing
    if (!shouldRender) return null;

    return (
        <div className={isClosing ? "animate-slide-up" : "animate-slide-down"}>
            {children}
        </div>
    );
};