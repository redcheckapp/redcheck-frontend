import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Shared by every password field in the app (Login, Register,
// ChangePasswordModal, ResetPasswordPage) — the input's own styling is
// identical everywhere it's used, so it's hardcoded here rather than
// exposed as a prop (see redcheck-frontend's CLAUDE.md note on why this
// codebase otherwise avoids a generic shared Input component: forms differ
// too much in structure to make one worthwhile — this is a narrow,
// self-contained widget instead, closer to FontSizeSlider.tsx than a
// generic primitive).
type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const translations = {
    es: { show: "Mostrar contraseña", hide: "Ocultar contraseña" },
    en: { show: "Show password", hide: "Hide password" }
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...inputProps }, ref) => {
        const { language } = useLanguage();
        const t = translations[language as keyof typeof translations];
        const [visible, setVisible] = useState(false);

        return (
            <div className="relative">
                <input
                    {...inputProps}
                    ref={ref}
                    type={visible ? "text" : "password"}
                    className={
                        className ??
                        "w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl pl-4 pr-11 py-3 text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                    }
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? t.hide : t.show}
                    title={visible ? t.hide : t.show}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = "PasswordInput";
