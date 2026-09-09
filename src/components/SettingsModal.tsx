import { X, Trash2, Moon, Sun, MessageSquarePlus, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAccessibility, type ColorblindMode } from "../context/AccessibilityContext";
import { ModalOverlay } from "./ModalOverlay";
import { FontSizeSlider } from "./FontSizeSlider";
import { triggerHapticFeedback } from "../utils/feedback";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleDeleteAccount: () => void;
    userEmail: string;
    remindersEnabled: boolean;
    onToggleReminders: () => void;
    taskFeedbackEnabled: boolean;
    onToggleTaskFeedback: () => void;
    showTasksInCalendar: boolean;
    onToggleShowTasksInCalendar: () => void;
    onOpenFeedback: () => void;
}

// --- Translation dictionary for SettingsModal ---
const translations = {
    es: {
        title: "Ajustes",
        close: "Cerrar",
        appearance: "Apariencia",
        darkMode: "Modo Oscuro",
        themeDesc: "Ajustar el tema visual",
        ttTheme: "Cambiar tema",
        language: "Idioma",
        langDesc: "Cambiar el idioma de la aplicación",
        ttLanguage: "Cambiar idioma",
        reminders: "Recordatorios de tareas",
        remindersDesc: "Avisa cuando una tarea esté por vencer (solo con la app abierta)",
        ttReminders: "Activar/desactivar recordatorios",
        taskFeedback: "Vibración",
        taskFeedbackDesc: "Una vibración sutil al completar una tarea (solo móvil)",
        ttTaskFeedback: "Activar/desactivar vibración",
        testHaptic: "Probar vibración",
        testHapticAccepted: "El navegador ha aceptado la vibración. Si no la has notado, puede que tu móvil no tenga motor de vibración activo para el navegador, o que la duración sea demasiado corta para notarla.",
        testHapticRejected: "Tu navegador ha rechazado la vibración (no soportada en este dispositivo/navegador).",
        accessibility: "Accesibilidad",
        colorblindFilter: "Filtro para daltonismo",
        colorblindFilterDesc: "Ajusta los colores de la app para distinguirlos mejor",
        cbNone: "Ninguno",
        cbProtanopia: "Protanopia",
        cbDeuteranopia: "Deuteranopia",
        cbTritanopia: "Tritanopia",
        fontSize: "Tamaño de letra",
        fontSmall: "Pequeña",
        fontSmallMedium: "Pequeña-normal",
        fontMedium: "Normal",
        fontMediumLarge: "Normal-grande",
        fontLarge: "Grande",
        showTasksInCalendar: "Tareas en el calendario",
        showTasksInCalendarDesc: "Muestra tus tareas dentro de la vista de calendario",
        ttShowTasksInCalendar: "Activar/desactivar tareas en el calendario",
        support: "Soporte",
        sendFeedback: "¿Tienes feedback?",
        sendFeedbackDesc: "Cuéntanoslo — bugs, ideas, o lo que sea",
        dangerZone: "Zona de peligro",
        demoWarning: "Por motivos de seguridad, la eliminación de cuenta está desactivada en el entorno de demostración.",
        btnDeleteDemo: "Borrar cuenta (Deshabilitado)",
        deleteWarning: "Esta acción es irreversible. Se borrarán todos tus datos y tareas.",
        btnDelete: "Borrar cuenta"
    },
    en: {
        title: "Settings",
        close: "Close",
        appearance: "Appearance",
        darkMode: "Dark Mode",
        themeDesc: "Adjust visual theme",
        ttTheme: "Toggle theme",
        language: "Language",
        langDesc: "Change application language",
        ttLanguage: "Change language",
        reminders: "Task reminders",
        remindersDesc: "Get notified when a task is about to be due (app must be open)",
        ttReminders: "Turn reminders on/off",
        taskFeedback: "Haptic feedback",
        taskFeedbackDesc: "A gentle vibration when you complete a task (mobile only)",
        ttTaskFeedback: "Turn haptic feedback on/off",
        testHaptic: "Test vibration",
        testHapticAccepted: "The browser accepted the vibration request. If you didn't feel anything, your phone's vibration motor might not respond to browser requests, or the duration may be too short to notice.",
        testHapticRejected: "Your browser rejected the vibration request (not supported on this device/browser).",
        accessibility: "Accessibility",
        colorblindFilter: "Colorblind filter",
        colorblindFilterDesc: "Adjusts the app's colors to make them easier to tell apart",
        cbNone: "None",
        cbProtanopia: "Protanopia",
        cbDeuteranopia: "Deuteranopia",
        cbTritanopia: "Tritanopia",
        fontSize: "Font size",
        fontSmall: "Small",
        fontSmallMedium: "Small-medium",
        fontMedium: "Normal",
        fontMediumLarge: "Medium-large",
        fontLarge: "Large",
        showTasksInCalendar: "Tasks in calendar",
        showTasksInCalendarDesc: "Show your tasks inside the calendar view",
        ttShowTasksInCalendar: "Turn tasks in calendar on/off",
        support: "Support",
        sendFeedback: "Got feedback?",
        sendFeedbackDesc: "Tell us — bugs, ideas, anything",
        dangerZone: "Danger Zone",
        demoWarning: "For security reasons, account deletion is disabled in the demo environment.",
        btnDeleteDemo: "Delete account (Disabled)",
        deleteWarning: "This action is irreversible. All your data and tasks will be deleted.",
        btnDelete: "Delete account"
    }
};

// A classic sliding-knob switch for true on/off settings (reminders, haptic
// feedback) — the language and theme toggles above stay as icon buttons
// since those pick between two distinct states/icons rather than a plain
// boolean, which is what a switch specifically communicates.
const ToggleSwitch = ({ enabled, onToggle, title }: { enabled: boolean; onToggle: () => void; title: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        title={title}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200 ${enabled ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
        <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
    </button>
);

const COLORBLIND_OPTIONS: { value: ColorblindMode; labelKey: "cbNone" | "cbProtanopia" | "cbDeuteranopia" | "cbTritanopia" }[] = [
    { value: "none", labelKey: "cbNone" },
    { value: "protanopia", labelKey: "cbProtanopia" },
    { value: "deuteranopia", labelKey: "cbDeuteranopia" },
    { value: "tritanopia", labelKey: "cbTritanopia" },
];

// Shared by both chip groups below — same "chip button" language
// FeedbackModal's category picker already established, reused here rather
// than introducing a different selection control.
const chipClass = (selected: boolean) =>
    `px-3 py-2 rounded-xl border text-sm font-medium text-center transition-all active:scale-95 ${
        selected
            ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
            : "bg-gray-50 dark:bg-gray-800/60 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

export const SettingsModal = ({ isOpen, onClose, handleDeleteAccount, userEmail, remindersEnabled, onToggleReminders, taskFeedbackEnabled, onToggleTaskFeedback, showTasksInCalendar, onToggleShowTasksInCalendar, onOpenFeedback }: SettingsModalProps) => {
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage } = useLanguage(); // We extract the language and the toggle function
    const { colorblindMode, setColorblindMode, fontSize, setFontSize } = useAccessibility();
    const t = translations[language as keyof typeof translations];

    // Diagnostic for "it's not vibrating" reports: a long, deliberate,
    // directly-clicked vibration plus the browser's own accepted/rejected
    // verdict (navigator.vibrate's return value) — separates "the browser
    // refused the request" from "it ran but the pulse was too short/the
    // device's motor didn't respond," which look identical from the app's
    // side but need different fixes (one is a bug here, the other isn't).
    const handleTestVibration = () => {
        const accepted = triggerHapticFeedback(200);
        if (accepted) {
            toast.success(t.testHapticAccepted, { duration: 6000 });
        } else {
            toast.error(t.testHapticRejected, { duration: 6000 });
        }
    };

    // ModalOverlay renders into document.body so it covers the entire window (including the Sidebar)
    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
            <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden transition-all duration-200 border border-transparent dark:border-gray-800 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.title}</h2>
                    <button onClick={onClose} aria-label={t.close} title={t.close} className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                    
                    {/* Section 1: Appearance & Language */}
                    <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.appearance}</h3>
                        
                        {/* Language selector (New) */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.language}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {t.langDesc}
                                </p>
                            </div>
                            <button 
                                onClick={toggleLanguage}
                                className="p-2 w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-lg hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
                                title={t.ttLanguage}
                            >
                                {/* Show the flag for the current language */}
                                {language === 'es' ? '🇪🇸' : '🇬🇧'}
                            </button>
                        </div>

                        {/* Dark mode toggle (Original) */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.darkMode}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {t.themeDesc}
                                </p>
                            </div>
                            <button 
                                onClick={toggleTheme}
                                className="p-2 w-[38px] h-[38px] flex items-center justify-center rounded-lg transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
                                title={t.ttTheme}
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>

                        {/* Task reminders toggle — client-side only, no
                            backend push involved (see CLAUDE.md). */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.reminders}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {t.remindersDesc}
                                </p>
                            </div>
                            <ToggleSwitch enabled={remindersEnabled} onToggle={onToggleReminders} title={t.ttReminders} />
                        </div>

                        {/* Haptic feedback on task completion — opt-out,
                            defaults on. See src/utils/feedback.ts. */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.taskFeedback}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {t.taskFeedbackDesc}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleTestVibration}
                                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline mt-1"
                                >
                                    {t.testHaptic}
                                </button>
                            </div>
                            <ToggleSwitch enabled={taskFeedbackEnabled} onToggle={onToggleTaskFeedback} title={t.ttTaskFeedback} />
                        </div>

                        {/* Show/hide task chips inside the calendar view —
                            opt-out, defaults on. Doesn't touch the calendar's
                            own navigation or the heatmap coloring toggle
                            (getSquareColor, a separate feature), only
                            whether task content itself renders — a day with
                            hidden tasks still supports creating/rescheduling
                            one via the calendar's own "+" affordances. */}
                        <div className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t.showTasksInCalendar}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    {t.showTasksInCalendarDesc}
                                </p>
                            </div>
                            <ToggleSwitch enabled={showTasksInCalendar} onToggle={onToggleShowTasksInCalendar} title={t.ttShowTasksInCalendar} />
                        </div>
                    </div>

                    {/* Section 2: Accessibility — colorblind filter defaults
                        to "none" and font size to "medium" (no override at
                        all, see AccessibilityContext.tsx/index.css), so a
                        fresh install looks and reads exactly as before this
                        section existed. */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.accessibility}</h3>

                        <div className="flex flex-col gap-2">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.colorblindFilter}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{t.colorblindFilterDesc}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {COLORBLIND_OPTIONS.map(({ value, labelKey }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setColorblindMode(value)}
                                        aria-pressed={colorblindMode === value}
                                        className={chipClass(colorblindMode === value)}
                                    >
                                        {t[labelKey]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.fontSize}</p>
                            <FontSizeSlider
                                value={fontSize}
                                onChange={setFontSize}
                                ariaLabel={t.fontSize}
                                valueLabels={{
                                    small: t.fontSmall,
                                    "small-medium": t.fontSmallMedium,
                                    medium: t.fontMedium,
                                    "medium-large": t.fontMediumLarge,
                                    large: t.fontLarge,
                                }}
                            />
                        </div>
                    </div>

                    {/* Section 3: Support — a single discreet row, not a
                        prominent CTA, opening FeedbackModal (DashboardPage
                        closes this modal and opens that one, rather than
                        stacking two ModalOverlays). */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.support}</h3>
                        <button
                            type="button"
                            onClick={onOpenFeedback}
                            className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-500 dark:text-red-400">
                                    <MessageSquarePlus size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.sendFeedback}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{t.sendFeedbackDesc}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        </button>
                    </div>

                    {/* Section 4: Danger Zone */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                        <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider">{t.dangerZone}</h3>
                        
                        {userEmail === 'demo-es@redcheck.com' || userEmail === 'demo-en@redcheck.com' ? (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t.demoWarning}
                                </p>
                                <button 
                                    disabled
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed font-medium text-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                    {t.btnDeleteDemo}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t.deleteWarning}</p>
                                <button 
                                    onClick={handleDeleteAccount}
                                    className="flex justify-center items-center gap-2 w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition font-medium text-sm"
                                >
                                    <Trash2 size={16} />
                                    {t.btnDelete}
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>
            )}
        </ModalOverlay>
    );
};