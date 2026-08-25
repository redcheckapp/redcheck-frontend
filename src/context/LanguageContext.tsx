import React, { createContext, useContext, useEffect, useState } from "react";

type LanguageContextType = {
    language: string;
    toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string>("es");

    useEffect(() => {
        // Cargar el idioma guardado o usar español por defecto
        const savedLang = localStorage.getItem("language");
        if (savedLang) {
            setLanguage(savedLang);
        } else {
            // Opcional: Detectar idioma del navegador
            const browserLang = navigator.language.startsWith("en") ? "en" : "es";
            setLanguage(browserLang);
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage((prevLang) => {
            const newLang = prevLang === "es" ? "en" : "es";
            localStorage.setItem("language", newLang);
            return newLang;
        });
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
        throw new Error("useLanguage debe usarse dentro de un LanguageProvider");
    }
    return context;
};