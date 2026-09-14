import { createContext, useContext, useEffect, useState } from 'react';
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Kept in sync with index.html's static <meta name="theme-color"> default
// and its anti-flicker script (initial paint, before this module ever
// loads) — see that file's comment for why these two exact values.
const THEME_COLORS: Record<Theme, string> = { light: '#cc2229', dark: '#030712' };

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

        // Follows the theme so the OS status bar/task-switcher chrome
        // (Android) matches the app instead of staying the brand red at all
        // times — see THEME_COLORS above.
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
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