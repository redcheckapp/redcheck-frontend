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
        // 1. Highest priority: shared cookie
        const cookieTheme = getSharedCookie('rc_theme');
        if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme;

        // 2. Medium priority: LocalStorage (for backwards compatibility)
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

        // 3. Lowest priority: system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Apply the class for Tailwind CSS
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        // Persist to both mechanisms simultaneously
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

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its provider by design
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};