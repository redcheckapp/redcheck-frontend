import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import type { SubjectWithTasks, TaskRequest, TaskResponse } from "../types";
import { ModalOverlay } from "./ModalOverlay";

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
        lblSubject: "Asignatura",
        phTitle: "Título",
        phDesc: "Descripción (opcional)",
        lblDeadline: "Fecha y hora",
        noSubjects: "Crea primero una asignatura para poder añadir tareas.",
        btnCancel: "Cancelar",
        btnCreate: "Crear tarea",
        btnSave: "Guardar cambios",
        confirmDelete: "¿Seguro que quieres borrar esta tarea?",
        errSave: "No se pudo guardar la tarea.",
        errDelete: "No se pudo borrar la tarea."
    },
    en: {
        titleCreate: "New task",
        titleEdit: "Edit task",
        lblSubject: "Subject",
        phTitle: "Title",
        phDesc: "Description (optional)",
        lblDeadline: "Date and time",
        noSubjects: "Create a subject first so you can add tasks.",
        btnCancel: "Cancel",
        btnCreate: "Create task",
        btnSave: "Save changes",
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

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors duration-300">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                            {mode === "edit" ? t.titleEdit : t.titleCreate}
                        </h2>
                        <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300">
                            <X size={20} />
                        </button>
                    </div>

                    {mode === "create" && subjects.length === 0 ? (
                        <p className="p-5 text-sm text-center text-gray-400 dark:text-gray-500">{t.noSubjects}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
                            {mode === "create" ? (
                                <select
                                    value={subjectId ?? ""}
                                    onChange={(e) => setSubjectId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 cursor-pointer transition-colors duration-300"
                                    required
                                >
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="self-start bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                                    {t.lblSubject}: {subjectName}
                                </span>
                            )}

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t.phTitle}
                                required
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300"
                            />
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t.phDesc}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300"
                            />
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.lblDeadline}</span>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/50 transition-colors duration-300"
                                />
                            </label>

                            <div className="flex items-center justify-between gap-2 mt-2">
                                {mode === "edit" ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={submitting}
                                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                ) : <span />}
                                <div className="flex gap-2">
                                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300">
                                        {t.btnCancel}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50"
                                    >
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
