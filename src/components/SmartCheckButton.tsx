import React from "react";
import { Loader2 } from "lucide-react"; // We import the spinner from the library
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context

interface SmartCheckCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  comingSoon?: boolean;
  isLoading?: boolean; // We add the loading property
  // Distinct from comingSoon — this isn't "not built yet", it's "not
  // available right now" (e.g. no pending tasks to analyze). Swaps the
  // subtitle for disabledMessage instead of a "coming soon" badge.
  disabled?: boolean;
  disabledMessage?: string;
}

// --- Translation dictionary for the SmartCheckButton ---
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

export const SmartCheckButton = ({ icon, title, subtitle, onClick, comingSoon, isLoading, disabled, disabledMessage }: SmartCheckCardProps) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations];

  return (
    <button
      onClick={comingSoon || isLoading || disabled ? undefined : onClick}
      disabled={comingSoon || isLoading || disabled}
      title={disabled ? disabledMessage : undefined}
      className={`w-full flex flex-col items-center justify-center p-4 mb-4 rounded-xl transition-all duration-300 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:focus-visible:ring-red-500
        ${isLoading
            ? 'bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 shadow-inner cursor-wait'
            : 'bg-zinc-50 dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 hover:bg-zinc-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
        }
        ${comingSoon || disabled ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {/* 1. Icon or Spinner */}
      <div className={`flex items-center justify-center w-8 h-8 mb-2 transition-colors duration-300 ${isLoading ? 'text-red-500' : 'text-zinc-700 dark:text-gray-300'}`}>
        {isLoading ? (
            <Loader2 className="w-full h-full animate-spin" />
        ) : (
            icon
        )}
      </div>

      {/* 2. Title (switches cleanly while loading) */}
      <h3 className="font-semibold text-zinc-900 dark:text-gray-100 text-sm m-0 mb-1 transition-colors duration-300">
        {isLoading ? t.analyzing : title}
      </h3>

      {/* 3. Subtitle (hidden while loading for a more minimal look) —
          swapped for disabledMessage when disabled, e.g. "no pending
          tasks to analyze", so the reason is visible without needing to
          hover for the title tooltip. */}
      {!isLoading && (
        <p className="text-zinc-500 dark:text-gray-400 text-xs leading-snug m-0 transition-colors duration-300 animate-in fade-in">
          {disabled && disabledMessage ? disabledMessage : subtitle}
        </p>
      )}

      {/* 4. "Coming soon" badge */}
      {comingSoon && (
        <span className="mt-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-[10px] leading-none font-bold rounded-md transition-colors duration-300">
          {t.comingSoon}
        </span>
      )}
    </button>
  );
};