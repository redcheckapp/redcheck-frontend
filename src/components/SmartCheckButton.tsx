import React from "react";
import { Loader2 } from "lucide-react"; // Importamos el spinner de tu librería
import { useLanguage } from "../context/LanguageContext"; // <-- Importamos el contexto

interface SmartCheckCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  comingSoon?: boolean;
  isLoading?: boolean; // Añadimos la propiedad de carga
}

// --- Diccionario de traducciones para el SmartCheckButton ---
const translations = {
    es: {
        analyzing: "Analizando tareas...",
        comingSoon: "Próximamente"
    },
    en: {
        analyzing: "Analyzing tasks...",
        comingSoon: "Coming soon"
    }
};

export const SmartCheckButton = ({ icon, title, subtitle, onClick, comingSoon, isLoading }: SmartCheckCardProps) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations];

  return (
    <button 
      onClick={comingSoon || isLoading ? undefined : onClick}
      disabled={comingSoon || isLoading}
      className={`w-full flex flex-col items-center justify-center p-4 mb-4 rounded-xl transition-all duration-300 text-center focus:outline-none 
        ${isLoading 
            ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 shadow-inner cursor-wait' 
            : 'bg-zinc-50 dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 hover:bg-zinc-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
        }
        ${comingSoon ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {/* 1. Icono o Spinner */}
      <div className={`flex items-center justify-center w-8 h-8 mb-2 transition-colors duration-300 ${isLoading ? 'text-red-500' : 'text-zinc-700 dark:text-gray-300'}`}>
        {isLoading ? (
            <Loader2 className="w-full h-full animate-spin" />
        ) : (
            icon
        )}
      </div>

      {/* 2. Título (cambia limpiamente cuando carga) */}
      <h3 className="font-semibold text-zinc-900 dark:text-gray-100 text-sm m-0 mb-1 transition-colors duration-300">
        {isLoading ? t.analyzing : title}
      </h3>

      {/* 3. Subtítulo (se oculta al cargar para dar un aspecto más minimalista) */}
      {!isLoading && (
        <p className="text-zinc-500 dark:text-gray-400 text-xs leading-snug m-0 transition-colors duration-300 animate-in fade-in">
          {subtitle}
        </p>
      )}

      {/* 4. Etiqueta Próximamente */}
      {comingSoon && (
        <span className="mt-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-[10px] leading-none font-bold rounded-md transition-colors duration-300">
          {t.comingSoon}
        </span>
      )}
    </button>
  );
};