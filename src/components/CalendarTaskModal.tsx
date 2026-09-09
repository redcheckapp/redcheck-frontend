import { useEffect, useState } from "react";
import { X, Trash2, BookOpen, Type, AlignLeft, Clock3, ChevronDown, CalendarPlus, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import type { SubjectWithTasks, TaskRequest, TaskResponse } from "../types";
import { ModalOverlay } from "./ModalOverlay";
import { getSubjectColor } from "../utils/subjectColors";
import { triggerHapticFeedback } from "../utils/feedback";

interface CalendarTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: SubjectWithTasks[];
    mode: "create" | "edit";
    initialDate?: Date;
    defaultSubjectId?: number | null;
    task?: TaskResponse;
    onCreate: (subjectId: number, data: TaskRequest) => Promise<void>;
    onUpdate: (subjectId: number, taskId: number, data: TaskRequest) => Promise<void>;
    onDelete: (subjectId: number, taskId: number) => Promise<void>;
}

// --- Translation dictionary for CalendarTaskModal ---
const translations = {
    es: {
        titleCreate: "Nueva tarea",
        titleEdit: "Editar tarea",
        subtitleCreate: "Se añadirá a tu agenda",
        subtitleEdit: "Ajusta los detalles o reprográmala",
        lblSubject: "Asignatura",
        lblTitle: "Título",
        lblDescription: "Descripción",
        optional: "opcional",
        phTitle: "¿Qué hay que hacer?",
        phDesc: "Añade detalles o notas...",
        lblDeadline: "Fecha y hora",
        noSubjects: "Crea primero una asignatura para poder añadir tareas.",
        btnCancel: "Cancelar",
        btnCreate: "Crear tarea",
        btnSave: "Guardar cambios",
        btnDelete: "Eliminar",
        confirmDelete: "¿Seguro que quieres borrar esta tarea?",
        errSave: "No se pudo guardar la tarea.",
        errDelete: "No se pudo borrar la tarea."
    },
    en: {
        titleCreate: "New task",
        titleEdit: "Edit task",
        subtitleCreate: "This will be added to your agenda",
        subtitleEdit: "Adjust the details or reschedule it",
        lblSubject: "Subject",
        lblTitle: "Title",
        lblDescription: "Description",
        optional: "optional",
        phTitle: "What needs to get done?",
        phDesc: "Add details or notes...",
        lblDeadline: "Date and time",
        noSubjects: "Create a subject first so you can add tasks.",
        btnCancel: "Cancel",
        btnCreate: "Create task",
        btnSave: "Save changes",
        btnDelete: "Delete",
        confirmDelete: "Are you sure you want to delete this task?",
        errSave: "Couldn't save the task.",
        errDelete: "Couldn't delete the task."
    }
};

// datetime-local inputs want "YYYY-MM-DDTHH:mm" in local time — offsetting
// by the timezone offset before slicing is the same trick used to seed the
// inline task-edit form in DashboardPage, kept here so this modal doesn't
// depend on that file.
const toDatetimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export const CalendarTaskModal = ({
    isOpen, onClose, subjects, mode, initialDate, defaultSubjectId, task, onCreate, onUpdate, onDelete
}: CalendarTaskModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [subjectId, setSubjectId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Reset the form whenever a *new* create/edit session starts. `task`,
    // `initialDate` and `defaultSubjectId` are only ever set once per open
    // by AgendaView (in response to a click), so they don't change while
    // the modal stays open — safe to depend on without fighting the user's
    // in-progress edits.
    useEffect(() => {
        if (!isOpen) return;
        if (mode === "edit" && task) {
            setTitle(task.title);
            setDescription(task.description ?? "");
            setDeadline(task.deadline ? toDatetimeLocal(new Date(task.deadline)) : "");
            setSubjectId(task.subjectId);
        } else {
            setTitle("");
            setDescription("");
            setDeadline(initialDate ? toDatetimeLocal(initialDate) : "");
            setSubjectId(defaultSubjectId ?? null);
        }
    }, [isOpen, mode, task, initialDate, defaultSubjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || subjectId === null) return;
        // Fired synchronously, before the `await` below — same gesture-timing
        // constraint as the task-completion haptic in DashboardPage.tsx (see
        // feedback.ts). Reads the setting straight from localStorage rather
        // than threading it down as a prop through AgendaView, matching the
        // lightweight-preference pattern ThemeContext/LanguageContext already
        // use for cookie/localStorage-backed settings.
        if (localStorage.getItem("taskFeedbackEnabled") !== "false") {
            triggerHapticFeedback();
        }
        setSubmitting(true);
        try {
            const data: TaskRequest = { title: title.trim(), description: description.trim() || null, deadline: deadline || null };
            if (mode === "edit" && task) {
                await onUpdate(task.subjectId, task.id, data);
            } else {
                await onCreate(subjectId, data);
            }
            onClose();
        } catch (error) {
            console.error("Error saving calendar task:", error);
            toast.error(t.errSave);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (mode !== "edit" || !task) return;
        if (!window.confirm(t.confirmDelete)) return;
        setSubmitting(true);
        try {
            await onDelete(task.subjectId, task.id);
            onClose();
        } catch (error) {
            console.error("Error deleting calendar task:", error);
            toast.error(t.errDelete);
        } finally {
            setSubmitting(false);
        }
    };

    const subjectName = mode === "edit" ? subjects.find(s => s.id === task?.subjectId)?.name : undefined;
    const accentColor = mode === "edit" && task ? getSubjectColor(task.subjectId) : null;

    // Shared field chrome — icon on the left, generous padding, a soft ring
    // on focus — so every input/select/textarea in this form reads as one
    // consistent system instead of ad hoc per-field styling. `color-scheme`
    // is set explicitly per mode: without it, the browser always renders
    // native control glyphs (the datetime-local field's calendar icon, here)
    // in their light-mode color, which is nearly invisible against this
    // field's dark background in dark mode.
    const fieldClass = "w-full bg-gray-50 dark:bg-gray-800/60 border border-transparent text-gray-800 dark:text-gray-100 rounded-xl pl-10 py-2.5 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-red-300/70 dark:focus:ring-red-500/40 focus:bg-white dark:focus:bg-gray-900 focus:border-red-200 dark:focus:border-red-900/50 transition-all duration-200";

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 transition-colors duration-300">
                        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${accentColor ? `${accentColor.bg} ${accentColor.text}` : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                            {mode === "edit" ? <CalendarClock size={20} /> : <CalendarPlus size={20} />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                                {mode === "edit" ? t.titleEdit : t.titleCreate}
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 transition-colors duration-300">
                                {mode === "edit" ? t.subtitleEdit : t.subtitleCreate}
                            </p>
                        </div>
                        <button onClick={onClose} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                            <X size={20} />
                        </button>
                    </div>

                    {mode === "create" && subjects.length === 0 ? (
                        <p className="p-6 text-sm text-center text-gray-400 dark:text-gray-500">{t.noSubjects}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
                            {mode === "create" ? (
                                <div className="relative">
                                    <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    <select
                                        value={subjectId ?? ""}
                                        onChange={(e) => setSubjectId(Number(e.target.value))}
                                        className={`${fieldClass} appearance-none pr-9 cursor-pointer`}
                                        required
                                    >
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                </div>
                            ) : (
                                <span className={`self-start flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${accentColor ? `${accentColor.bg} ${accentColor.text}` : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${accentColor?.dot ?? "bg-gray-400"}`} />
                                    {subjectName}
                                </span>
                            )}

                            <label className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-0.5">{t.lblTitle}</span>
                                <div className="relative">
                                    <Type size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t.phTitle}
                                        required
                                        autoFocus
                                        className={`${fieldClass} pr-3`}
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                    {t.lblDescription} <span className="font-medium normal-case text-gray-300 dark:text-gray-600">({t.optional})</span>
                                </span>
                                <div className="relative">
                                    <AlignLeft size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t.phDesc}
                                        className={`${fieldClass} pr-3`}
                                    />
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-0.5">{t.lblDeadline}</span>
                                <div className="relative">
                                    <Clock3 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className={`${fieldClass} pr-3`}
                                    />
                                </div>
                            </label>

                            <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                                {mode === "edit" ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={submitting}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={16} /> {t.btnDelete}
                                    </button>
                                ) : <span />}
                                <div className="flex gap-2">
                                    <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 rounded-xl transition-all duration-200">
                                        {t.btnCancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                                    >
                                        {submitting && <Loader2 size={14} className="animate-spin" />}
                                        {mode === "edit" ? t.btnSave : t.btnCreate}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </ModalOverlay>
    );
};
