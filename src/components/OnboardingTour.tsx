import { useState } from "react";
import { Check, Sparkles, CalendarDays, Focus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { ModalOverlay } from "./ModalOverlay";

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Translation dictionary for OnboardingTour ---
const translations = {
    es: {
        skip: "Omitir",
        back: "Atrás",
        next: "Siguiente",
        start: "Empezar",
        steps: [
            {
                title: "Bienvenido a RedCheck",
                desc: "Organiza tus tareas por asignaturas y deja que la IA te ayude a priorizar tu día."
            },
            {
                title: "Prioriza con SmartCheck AI",
                desc: "Genera un plan diario que analiza tus tareas pendientes y te dice cuáles atacar primero según su urgencia."
            },
            {
                title: "Vista de calendario",
                desc: "Consulta tus tareas por día, semana o mes, y crea o reprograma tareas directamente desde el calendario."
            },
            {
                title: "Trabaja sin distracciones",
                desc: "Activa el Modo Enfoque para ocultar lo que no necesitas, y pulsa Ctrl/Cmd+K en cualquier momento para buscar o ejecutar acciones al instante."
            },
        ],
    },
    en: {
        skip: "Skip",
        back: "Back",
        next: "Next",
        start: "Get started",
        steps: [
            {
                title: "Welcome to RedCheck",
                desc: "Organize your tasks by subject and let AI help you prioritize your day."
            },
            {
                title: "Prioritize with SmartCheck AI",
                desc: "Generate a daily plan that analyzes your pending tasks and tells you what to tackle first based on urgency."
            },
            {
                title: "Calendar view",
                desc: "Check your tasks by day, week, or month, and create or reschedule tasks directly from the calendar."
            },
            {
                title: "Work distraction-free",
                desc: "Turn on Focus Mode to hide what you don't need, and press Ctrl/Cmd+K anytime to search or run actions instantly."
            },
        ],
    },
};

const STEP_ICONS = [Check, Sparkles, CalendarDays, Focus];

// A short, dismissible product tour shown once to new users (see
// DashboardPage's `rc_onboarding_seen` localStorage flag) — also
// re-openable anytime via the command palette's "Show tour" action. Built
// on ModalOverlay like every other modal here, so it gets focus-trap/
// Escape/backdrop for free.
export const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const [step, setStep] = useState(0);

    const isLastStep = step === t.steps.length - 1;
    const StepIcon = STEP_ICONS[step];

    const handleClose = () => {
        onClose();
        // Reset for next time the tour is reopened (e.g. via the command
        // palette), after the close transition finishes.
        setTimeout(() => setStep(0), 200);
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-5">
                            <StepIcon size={26} strokeWidth={2.25} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                            {t.steps[step].title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                            {t.steps[step].desc}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 pb-6">
                        {t.steps.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === step ? "w-5 bg-red-600 dark:bg-red-500" : "w-1.5 bg-gray-200 dark:bg-gray-700"
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 px-6 pb-6">
                        <button
                            type="button"
                            onClick={step === 0 ? handleClose : () => setStep(s => s - 1)}
                            className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-xl transition-all duration-200"
                        >
                            {step === 0 ? t.skip : t.back}
                        </button>
                        <button
                            type="button"
                            onClick={isLastStep ? handleClose : () => setStep(s => s + 1)}
                            className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl shadow-sm transition-all duration-200"
                        >
                            {isLastStep ? t.start : t.next}
                        </button>
                    </div>
                </div>
            )}
        </ModalOverlay>
    );
};
