interface SmartCheckCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export const SmartCheckButton = ({ icon, title, subtitle, onClick }: SmartCheckCardProps) => {
  return (
    <button 
      onClick={onClick}
      // Contenedor principal: layout vertical (flex-col), centrado, padding más pequeño (p-4)
      className="w-full flex flex-col items-center justify-center p-4 mb-4 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm hover:bg-zinc-100 hover:shadow-md transition-all duration-200 text-center focus:outline-none"
    >
      {/* 1. Icono */}
      <div className="flex items-center justify-center text-zinc-700 w-8 h-8 mb-2">
        {icon}
      </div>

      {/* 2. Título (Más pequeño: text-sm) */}
      <h3 className="font-semibold text-zinc-900 text-sm m-0 mb-1">
        {title}
      </h3>

      {/* 3. Subtítulo (Aún más pequeño: text-xs, con altura de línea ajustada) */}
      <p className="text-zinc-500 text-xs leading-snug m-0">
        {subtitle}
      </p>
    </button>
  );
};