import { motion } from "framer-motion";

interface PageTransitionProps {
    children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
    return (
        <motion.div
            // Estado inicial (invisible y un poco más abajo)
            initial={{ opacity: 0, y: 15 }}
            // Estado al entrar (visible y en su sitio)
            animate={{ opacity: 1, y: 0 }}
            // Estado al salir (se desvanece hacia arriba)
            exit={{ opacity: 0, y: -15 }}
            // Duración y suavidad de la curva
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};