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
      onClick={onClick}
      // Main container: vertical layout (flex-col), centered, smaller padding (p-4)
      className="w-full flex flex-col items-center justify-center p-4 mb-4 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm hover:bg-zinc-100 hover:shadow-md transition-all duration-200 text-center focus:outline-none"
    >
      {/* 1. Icon */}
      <div className="flex items-center justify-center text-zinc-700 w-8 h-8 mb-2">
        {icon}
      </div>

      {/* 2. Title (Smaller: text-sm) */}
      <h3 className="font-semibold text-zinc-900 text-sm m-0 mb-1">
        {title}
      </h3>

      {/* 3. Subtitle (Even smaller: text-xs, with adjusted line height) */}
      <p className="text-zinc-500 text-xs leading-snug m-0">
        {subtitle}
      </p>

      {/* 4. Comming soon label */}
      {comingSoon && (
        <span className="mt-2 px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] leading-none font-bold rounded-md">
          Próximamente
        </span>
      )}
    </button>
  );
};