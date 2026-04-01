import { motion } from "framer-motion";

interface PageTransitionProps {
    children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
    return (
        <motion.div
            // Initial state (invisible and a bit lower)
            initial={{ opacity: 0, y: 15 }}
            // State when entering (visible and in place)
            animate={{ opacity: 1, y: 0 }}
            // State when exiting (fades upwards)
            exit={{ opacity: 0, y: -15 }}
            // Duration and smoothness of the curve
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};