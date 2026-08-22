import React from "react";

interface SmartCheckCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  comingSoon?: boolean;
}

export const SmartCheckButton = ({ icon, title, subtitle, onClick, comingSoon }: SmartCheckCardProps) => {
  return (
    <button 
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      // Main container: vertical layout (flex-col), centered, smaller padding (p-4)
      className="w-full flex flex-col items-center justify-center p-4 mb-4 bg-zinc-50 dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-zinc-100 dark:hover:bg-gray-700 hover:shadow-md transition-colors duration-300 text-center focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {/* 1. Icon */}
      <div className="flex items-center justify-center text-zinc-700 dark:text-gray-300 w-8 h-8 mb-2 transition-colors duration-300">
        {icon}
      </div>

      {/* 2. Title (Smaller: text-sm) */}
      <h3 className="font-semibold text-zinc-900 dark:text-gray-100 text-sm m-0 mb-1 transition-colors duration-300">
        {title}
      </h3>

      {/* 3. Subtitle (Even smaller: text-xs, with adjusted line height) */}
      <p className="text-zinc-500 dark:text-gray-400 text-xs leading-snug m-0 transition-colors duration-300">
        {subtitle}
      </p>

      {/* 4. Comming soon label */}
      {comingSoon && (
        <span className="mt-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-[10px] leading-none font-bold rounded-md transition-colors duration-300">
          Próximamente
        </span>
      )}
    </button>
  );
};