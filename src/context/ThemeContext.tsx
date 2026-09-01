import { createContext, useContext, useEffect, useState } from 'react';
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // 1. Prioridad máxima: Cookie compartida
        const cookieTheme = getSharedCookie('rc_theme');
        if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme;
        
        // 2. Prioridad media: LocalStorage (por retrocompatibilidad)
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
        
        // 3. Prioridad baja: Preferencia del sistema
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Aplicar la clase para Tailwind CSS
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        // Persistir en ambos mecanismos simultáneamente
        localStorage.setItem('theme', theme);
        setSharedCookie('rc_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme debe usarse dentro de un ThemeProvider');
    }
    return context;
};