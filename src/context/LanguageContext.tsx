import React, { createContext, useContext, useEffect, useState } from "react";
import { getSharedCookie, setSharedCookie } from '../utils/cookies';

type Language = "es" | "en";

type LanguageContextType = {
    language: Language;
    toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        // 1. Highest priority: shared cookie
        const cookieLang = getSharedCookie('rc_lang');
        if (cookieLang === 'es' || cookieLang === 'en') return cookieLang as Language;

        // 2. Medium priority: LocalStorage (for backwards compatibility)
        const savedLang = localStorage.getItem('language');
        if (savedLang === 'es' || savedLang === 'en') return savedLang as Language;

        // 3. Lowest priority: browser language
        if (typeof navigator !== 'undefined' && navigator.language.startsWith('en')) {
            return 'en';
        }
        
        return 'es';
    });

    useEffect(() => {
        // Persist to both mechanisms simultaneously
        localStorage.setItem('language', language);
        setSharedCookie('rc_lang', language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage((prevLang) => (prevLang === "es" ? "en" : "es"));
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};