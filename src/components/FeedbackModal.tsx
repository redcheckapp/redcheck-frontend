import { useState } from "react";
import { X, Bug, Lightbulb, Heart, MoreHorizontal, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { ModalOverlay } from "./ModalOverlay";
import { postFeedback } from "../api/feedbackApi";
import type { FeedbackCategory } from "../types";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Translation dictionary for FeedbackModal ---
const translations = {
    es: {
        title: "Enviar feedback",
        subtitle: "Cuéntanos qué tal va, nos ayuda a mejorar RedCheck",
        close: "Cerrar",
        catBug: "Bug",
        catSuggestion: "Sugerencia",
        catPraise: "Opinión",
        catOther: "Otro",
        lblMessage: "Mensaje",
        phMessage: "Cuéntanos con el mayor detalle posible...",
        btnCancel: "Cancelar",
        btnSend: "Enviar",
        errRequired: "Escribe un mensaje antes de enviar.",
        errSend: "No se pudo enviar el feedback. Inténtalo de nuevo.",
        successSend: "¡Gracias! Hemos recibido tu feedback."
    },
    en: {
        title: "Send feedback",
        subtitle: "Tell us how it's going, it helps us improve RedCheck",
        close: "Close",
        catBug: "Bug",
        catSuggestion: "Suggestion",
        catPraise: "Feedback",
        catOther: "Other",
        lblMessage: "Message",
        phMessage: "Tell us with as much detail as you can...",
        btnCancel: "Cancel",
        btnSend: "Send",
        errRequired: "Write a message before sending.",
        errSend: "Couldn't send your feedback. Please try again.",
        successSend: "Thanks! We've received your feedback."
    }
};

const MESSAGE_MAX_LENGTH = 2000;

// Each category gets its own accent (not the app's red, not subjectColors/
// priorityColors — this is a separate, one-off 4-way palette scoped to this
// modal alone) so the chips read as genuinely different choices rather than
// four identically-styled buttons with different labels.
const CATEGORIES: { value: FeedbackCategory; icon: typeof Bug; labelKey: "catBug" | "catSuggestion" | "catPraise" | "catOther"; selectedClass: string }[] = [
    { value: "BUG", icon: Bug, labelKey: "catBug", selectedClass: "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400" },
    { value: "SUGGESTION", icon: Lightbulb, labelKey: "catSuggestion", selectedClass: "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400" },
    { value: "PRAISE", icon: Heart, labelKey: "catPraise", selectedClass: "bg-pink-50 dark:bg-pink-900/30 border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-400" },
    { value: "OTHER", icon: MoreHorizontal, labelKey: "catOther", selectedClass: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" },
];

export const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [category, setCategory] = useState<FeedbackCategory>("SUGGESTION");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        if (submitting) return;
        onClose();
        // Reset after the close animation has room to run, same pattern as
        // the dashboard's inline task forms (setTimeout after closing)
        // rather than resetting instantly, which would flash empty content
        // mid-close.
        setTimeout(() => {
            setCategory("SUGGESTION");
            setMessage("");
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error(t.errRequired);
            return;
        }
        setSubmitting(true);
        try {
            await postFeedback({ category, message: message.trim() });
            toast.success(t.successSend);
            handleClose();
        } catch (error) {
            console.error("Error sending feedback:", error);
            toast.error(t.errSend);
        } finally {
            setSubmitting(false);
        }
    };

    const fieldClass = "w-full bg-gray-50 dark:bg-gray-800/60 border border-transparent text-gray-800 dark:text-gray-100 rounded-xl p-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-300/70 dark:focus:ring-red-500/40 focus:bg-white dark:focus:bg-gray-900 focus:border-red-200 dark:focus:border-red-900/50 transition-all duration-200 resize-none";

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 transition-colors duration-300">
                        <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            <MessageSquarePlus size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                                {t.title}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">
                                {t.subtitle}
                            </p>
                        </div>
                        <button onClick={handleClose} aria-label={t.close} title={t.close} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(({ value, icon: Icon, labelKey, selectedClass }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setCategory(value)}
                                    aria-pressed={category === value}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-95 ${
                                        category === value
                                            ? selectedClass
                                            : "bg-gray-50 dark:bg-gray-800/60 border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    <Icon size={16} className="shrink-0" />
                                    {t[labelKey]}
                                </button>
                            ))}
                        </div>

                        <label className="flex flex-col gap-1.5">
                            <span className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                {t.lblMessage}
                                <span className="normal-case font-medium text-gray-300 dark:text-gray-600">{message.length}/{MESSAGE_MAX_LENGTH}</span>
                            </span>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                                placeholder={t.phMessage}
                                rows={5}
                                autoFocus
                                required
                                className={fieldClass}
                            />
                        </label>

                        <div className="flex items-center justify-end gap-2 mt-2 pt-1">
                            <button type="button" onClick={handleClose} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-xl transition-all duration-200">
                                {t.btnCancel}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />}
                                {t.btnSend}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </ModalOverlay>
    );
};
