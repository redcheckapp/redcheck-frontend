import { useState, useEffect } from "react";

interface AnimatedVisibilityProps {
    isVisible: boolean;
    children: React.ReactNode;
}

export const AnimatedVisibility = ({ isVisible, children }: AnimatedVisibilityProps) => {
    // Guardamos la prop anterior para saber si ha cambiado en este render
    const [prevIsVisible, setPrevIsVisible] = useState(isVisible);
    
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [isClosing, setIsClosing] = useState(false);

    // PATRÓN RECOMENDADO POR REACT: Derivar estado durante el renderizado.
    // Si la prop 'isVisible' acaba de cambiar, ajustamos los estados directamente aquí.
    if (isVisible !== prevIsVisible) {
        setPrevIsVisible(isVisible);
        
        if (isVisible) {
            setShouldRender(true);
            setIsClosing(false);
        } else {
            setIsClosing(true);
        }
    }

    // El useEffect AHORA solo tiene una responsabilidad: 
    // gestionar el "temporizador" de salida para destruir el HTML.
    useEffect(() => {
        if (!isVisible && shouldRender) {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 200); // 200ms = lo que dura la animación CSS
            
            return () => clearTimeout(timer);
        }
    }, [isVisible, shouldRender]);

    // Si no debe renderizarse, devolvemos nada
    if (!shouldRender) return null;

    return (
        <div className={isClosing ? "animate-slide-up" : "animate-slide-down"}>
            {children}
        </div>
    );
};