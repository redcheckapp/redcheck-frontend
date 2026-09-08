import { ChevronLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface AuthFloatingNavProps {
    backAriaLabel: string;
    /** External link back button (e.g. Login's link to redcheckapp.com). */
    backHref?: string;
    /** Internal navigation back button — used when `backHref` isn't given. */
    onBack?: () => void;
    /**
     * Layout classes for the mobile in-flow row's own spacing — callers
     * differ here: Login/Register center a card (`w-full max-w-md mb-4`),
     * Terms/Privacy are full-width scrollable documents (`px-4 pt-4`).
     */
    mobileRowClassName?: string;
}

const baseButtonClass = "rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 flex items-center justify-center";
const floatingButtonClass = `${baseButtonClass} hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300`;

// Shared by Login/Register/Terms/Privacy: a mobile in-flow row (back +
// language + theme, so nothing overlaps the card/text on a narrow/short
// viewport) plus the sm-and-up fixed floating versions of the same three
// controls. The back action differs per page — Login links out to
// redcheckapp.com, the other three navigate internally — so it's the one
// thing callers configure via `backHref` (link) or `onBack` (button).
export const AuthFloatingNav = ({ backAriaLabel, backHref, onBack, mobileRowClassName = "w-full max-w-md mb-4" }: AuthFloatingNavProps) => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage();

    const mobileBack = backHref ? (
        <a href={backHref} className={`p-3 ${baseButtonClass}`} aria-label={backAriaLabel}>
            <ChevronLeft size={20} />
        </a>
    ) : (
        <button onClick={onBack} className={`p-3 ${baseButtonClass}`} aria-label={backAriaLabel}>
            <ChevronLeft size={20} />
        </button>
    );

    const floatingBack = backHref ? (
        <a
            href={backHref}
            className={`hidden sm:flex fixed top-4 left-4 z-50 p-3 ${floatingButtonClass}`}
            aria-label={backAriaLabel}
        >
            <ChevronLeft size={20} />
        </a>
    ) : (
        <button
            onClick={onBack}
            className={`hidden sm:flex fixed top-4 left-4 z-50 p-3 ${floatingButtonClass}`}
            aria-label={backAriaLabel}
        >
            <ChevronLeft size={20} />
        </button>
    );

    return (
        <>
            {/* Mobile-only controls row: back + language + theme, in normal
                document flow so they never overlap the card/text the way
                the fixed versions below would on a narrow/short viewport. */}
            <div className={`flex sm:hidden items-center justify-between ${mobileRowClassName}`}>
                {mobileBack}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleLanguage}
                        className={`p-3 ${baseButtonClass} text-lg`}
                        title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                    >
                        {language === 'es' ? '🇬🇧' : '🇪🇸'}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`p-3 ${baseButtonClass}`}
                        title={language === 'es' ? 'Cambiar tema' : 'Toggle theme'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </div>

            {/* FLOATING BACK BUTTON (sm and up only) */}
            {floatingBack}

            {/* FLOATING CONTROLS (LANGUAGE AND THEME) (sm and up only) */}
            <div className="hidden sm:flex fixed bottom-4 left-4 z-50 flex-col gap-3">
                <button
                    onClick={toggleLanguage}
                    className={`p-3 ${floatingButtonClass} text-lg`}
                    title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                >
                    {language === 'es' ? '🇬🇧' : '🇪🇸'}
                </button>

                <button
                    onClick={toggleTheme}
                    className={`p-3 ${floatingButtonClass}`}
                    title={language === 'es' ? 'Cambiar tema' : 'Toggle theme'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </>
    );
};
