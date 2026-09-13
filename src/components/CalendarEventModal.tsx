import { useEffect, useState } from "react";
import { X, Trash2, Type, AlignLeft, Clock3, ChevronDown, CalendarPlus, CalendarClock, Loader2, Plus, Repeat, Ban, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import type { CalendarEventRequest, CalendarEventResponse, EventCategoryResponse, RecurringCalendarEventRequest } from "../types";
import { ModalOverlay } from "./ModalOverlay";
import { ToggleSwitch } from "./ToggleSwitch";
import { createEventCategory, updateEventCategory, deleteEventCategory } from "../api/eventCategoryApi";
import { EVENT_CATEGORY_COLOR_PALETTE, DEFAULT_EVENT_COLOR } from "../utils/eventCategoryColors";

interface CalendarEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: EventCategoryResponse[];
    onCategoriesChanged: () => void;
    mode: "create" | "edit";
    initialDate?: Date;
    // Only set when creating from Day view's press-and-drag gesture — every
    // other create entry point (the "+" chooser) only ever knows a single
    // clicked date/hour.
    initialEndDate?: Date;
    event?: CalendarEventResponse;
    onCreate: (data: CalendarEventRequest) => Promise<void>;
    onCreateRecurring: (data: RecurringCalendarEventRequest) => Promise<void>;
    onUpdate: (eventId: number, data: CalendarEventRequest) => Promise<void>;
    onDelete: (eventId: number) => Promise<void>;
}

// --- Translation dictionary for CalendarEventModal ---
const translations = {
    es: {
        titleCreate: "Nuevo evento",
        titleEdit: "Editar evento",
        subtitleCreate: "Se añadirá a tu calendario",
        subtitleEdit: "Ajusta los detalles de este evento",
        lblTitle: "Título",
        lblDescription: "Descripción",
        optional: "opcional",
        lblAllDay: "Todo el día",
        lblStart: "Inicio",
        lblEnd: "Fin",
        lblCategory: "Categoría",
        noCategory: "Sin categoría",
        newCategory: "Nueva categoría",
        editCategory: "Editar categoría",
        deleteCategory: "Eliminar categoría",
        phCategoryName: "Nombre de la categoría",
        btnCreateCategory: "Crear",
        btnSaveCategory: "Guardar",
        confirmDeleteCategoryTitle: "¿Borrar categoría?",
        confirmDeleteCategory: "Los eventos con esta categoría se quedarán sin categoría. Esta acción no se puede deshacer.",
        errCategorySave: "No se pudo guardar la categoría.",
        errCategoryDelete: "No se pudo borrar la categoría.",
        lblRepeats: "Se repite",
        lblFrequency: "Frecuencia",
        freqDaily: "Cada día",
        freqWeekly: "Cada semana",
        freqBiweekly: "Cada 2 semanas",
        freqMonthly: "Cada mes",
        freqYearly: "Cada año",
        lblRecurEndDate: "Hasta",
        partOfRecurring: "Parte de un evento recurrente",
        recurringCreated: "Evento recurrente creado. La primera aparición se generará mañana.",
        close: "Cerrar",
        btnCancel: "Cancelar",
        btnCreate: "Crear evento",
        btnSave: "Guardar cambios",
        btnDelete: "Eliminar",
        confirmDeleteTitle: "¿Borrar evento?",
        confirmDelete: "¿Seguro que quieres borrar este evento?",
        errSave: "No se pudo guardar el evento.",
        errDelete: "No se pudo borrar el evento."
    },
    en: {
        titleCreate: "New event",
        titleEdit: "Edit event",
        subtitleCreate: "This will be added to your calendar",
        subtitleEdit: "Adjust this event's details",
        lblTitle: "Title",
        lblDescription: "Description",
        optional: "optional",
        lblAllDay: "All day",
        lblStart: "Start",
        lblEnd: "End",
        lblCategory: "Category",
        noCategory: "No category",
        newCategory: "New category",
        editCategory: "Edit category",
        deleteCategory: "Delete category",
        phCategoryName: "Category name",
        btnCreateCategory: "Create",
        btnSaveCategory: "Save",
        confirmDeleteCategoryTitle: "Delete category?",
        confirmDeleteCategory: "Events with this category will keep no category. This can't be undone.",
        errCategorySave: "Couldn't save the category.",
        errCategoryDelete: "Couldn't delete the category.",
        lblRepeats: "Repeats",
        lblFrequency: "Frequency",
        freqDaily: "Every day",
        freqWeekly: "Every week",
        freqBiweekly: "Every 2 weeks",
        freqMonthly: "Every month",
        freqYearly: "Every year",
        lblRecurEndDate: "Until",
        partOfRecurring: "Part of a recurring event",
        recurringCreated: "Recurring event created. The first occurrence will be generated tomorrow.",
        close: "Close",
        btnCancel: "Cancel",
        btnCreate: "Create event",
        btnSave: "Save changes",
        btnDelete: "Delete",
        confirmDeleteTitle: "Delete event?",
        confirmDelete: "Are you sure you want to delete this event?",
        errSave: "Couldn't save the event.",
        errDelete: "Couldn't delete the event."
    }
};

const toDatetimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const toDateInput = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

export const CalendarEventModal = ({
    isOpen, onClose, categories, onCategoriesChanged, mode, initialDate, initialEndDate, event, onCreate, onCreateRecurring, onUpdate, onDelete
}: CalendarEventModalProps) => {
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];
    const confirm = useConfirm();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [startValue, setStartValue] = useState("");
    const [endValue, setEndValue] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [repeats, setRepeats] = useState(false);
    const [frequency, setFrequency] = useState("WEEKLY");
    const [recurEndDate, setRecurEndDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showCategoryCreator, setShowCategoryCreator] = useState(false);
    // Non-null while the inline panel is editing an existing category
    // rather than creating a new one — same form/state, just a different
    // submit target (updateEventCategory vs createEventCategory).
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState(EVENT_CATEGORY_COLOR_PALETTE[0]);
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Reset the form whenever a *new* create/edit session starts — same
    // reasoning as CalendarTaskModal: `event`/`initialDate` only change
    // between opens, not while the modal is open, so they're safe deps here.
    useEffect(() => {
        if (!isOpen) return;
        if (mode === "edit" && event) {
            setTitle(event.title);
            setDescription(event.description ?? "");
            setAllDay(event.allDay);
            setStartValue(event.allDay ? toDateInput(new Date(event.startDateTime)) : toDatetimeLocal(new Date(event.startDateTime)));
            setEndValue(event.allDay ? toDateInput(new Date(event.endDateTime)) : toDatetimeLocal(new Date(event.endDateTime)));
            setCategoryId(event.categoryId);
        } else {
            const base = initialDate ?? new Date();
            setTitle("");
            setDescription("");
            setAllDay(false);
            setStartValue(toDatetimeLocal(base));
            setEndValue(initialEndDate ? toDatetimeLocal(initialEndDate) : "");
            setCategoryId(null);
        }
        setRepeats(false);
        setFrequency("WEEKLY");
        setRecurEndDate("");
        setShowCategoryCreator(false);
        setEditingCategoryId(null);
        setNewCategoryName("");
    }, [isOpen, mode, event, initialDate, initialEndDate]);

    // Converts the start/end fields between "YYYY-MM-DDTHH:mm" (timed) and
    // "YYYY-MM-DD" (all-day) shapes when the toggle flips, so whatever the
    // user already picked survives the switch instead of being cleared.
    const handleToggleAllDay = (checked: boolean) => {
        setAllDay(checked);
        if (checked) {
            setStartValue(v => v ? v.slice(0, 10) : toDateInput(new Date()));
            setEndValue(v => v ? v.slice(0, 10) : "");
        } else {
            setStartValue(v => v ? toDatetimeLocal(new Date(`${v}T00:00`)) : toDatetimeLocal(new Date()));
            setEndValue(v => v ? toDatetimeLocal(new Date(`${v}T23:59`)) : "");
        }
    };

    // Opens the inline panel fresh, for a brand-new category — toggles it
    // closed instead if it was already open in this same "create" mode
    // (the "+" swatch's original behavior); switching away from an
    // in-progress edit always re-opens it in create mode rather than
    // closing, so the pencil icon and the "+" button never fight over the
    // same panel state.
    const handleOpenCreateCategory = () => {
        if (showCategoryCreator && editingCategoryId === null) {
            setShowCategoryCreator(false);
            return;
        }
        setEditingCategoryId(null);
        setNewCategoryName("");
        setNewCategoryColor(EVENT_CATEGORY_COLOR_PALETTE[0]);
        setShowCategoryCreator(true);
    };

    const handleStartEditCategory = (category: EventCategoryResponse, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategoryId(category.id);
        setNewCategoryName(category.name);
        setNewCategoryColor(category.color);
        setShowCategoryCreator(true);
    };

    const handleCloseCategoryEditor = () => {
        setShowCategoryCreator(false);
        setEditingCategoryId(null);
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) return;
        setCreatingCategory(true);
        try {
            if (editingCategoryId !== null) {
                await updateEventCategory(editingCategoryId, { name: newCategoryName.trim(), color: newCategoryColor });
            } else {
                const created = await createEventCategory({ name: newCategoryName.trim(), color: newCategoryColor });
                setCategoryId(created.id);
            }
            onCategoriesChanged();
            handleCloseCategoryEditor();
            setNewCategoryName("");
        } catch (error) {
            console.error("Error saving event category:", error);
            toast.error(t.errCategorySave);
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleDeleteCategory = async (category: EventCategoryResponse, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!(await confirm({ title: t.confirmDeleteCategoryTitle, message: t.confirmDeleteCategory }))) return;
        try {
            await deleteEventCategory(category.id);
            if (categoryId === category.id) setCategoryId(null);
            if (editingCategoryId === category.id) handleCloseCategoryEditor();
            onCategoriesChanged();
        } catch (error) {
            console.error("Error deleting event category:", error);
            toast.error(t.errCategoryDelete);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !startValue) return;
        setSubmitting(true);
        try {
            const start = allDay ? `${startValue}T00:00:00` : startValue;
            const end = endValue ? (allDay ? `${endValue}T00:00:00` : endValue) : null;

            if (mode === "edit" && event) {
                await onUpdate(event.id, {
                    title: title.trim(), description: description.trim() || null,
                    startDateTime: start, endDateTime: end, allDay, categoryId
                });
            } else if (repeats) {
                const startDateObj = new Date(start);
                const endDateObj = end ? new Date(end) : startDateObj;
                const durationMinutes = allDay ? null : Math.max(0, Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60000));
                const time = allDay ? null : `${String(startDateObj.getHours()).padStart(2, "0")}:${String(startDateObj.getMinutes()).padStart(2, "0")}:00`;
                await onCreateRecurring({
                    title: title.trim(), description: description.trim() || null,
                    allDay, time, durationMinutes, frequency, endDate: recurEndDate || null, categoryId
                });
                toast.success(t.recurringCreated);
            } else {
                await onCreate({
                    title: title.trim(), description: description.trim() || null,
                    startDateTime: start, endDateTime: end, allDay, categoryId
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving calendar event:", error);
            toast.error(t.errSave);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (mode !== "edit" || !event) return;
        if (!(await confirm({ title: t.confirmDeleteTitle, message: t.confirmDelete }))) return;
        setSubmitting(true);
        try {
            await onDelete(event.id);
            onClose();
        } catch (error) {
            console.error("Error deleting calendar event:", error);
            toast.error(t.errDelete);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCategory = categoryId !== null ? categories.find(c => c.id === categoryId) : undefined;
    const accentColor = selectedCategory?.color ?? null;

    const fieldClass = "w-full bg-gray-50 dark:bg-gray-800/60 border border-transparent text-gray-800 dark:text-gray-100 rounded-xl pl-10 py-2.5 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-500 [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-red-300/70 dark:focus:ring-red-500/40 focus:bg-white dark:focus:bg-gray-900 focus:border-red-200 dark:focus:border-red-900/50 transition-all duration-200";
    const fieldClassNoIcon = "w-full bg-gray-50 dark:bg-gray-800/60 border border-transparent text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-500 [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-red-300/70 dark:focus:ring-red-500/40 focus:bg-white dark:focus:bg-gray-900 focus:border-red-200 dark:focus:border-red-900/50 transition-all duration-200";

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            {(isVisible) => (
                <div className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-transparent dark:border-gray-800 transition-all duration-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                    <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 transition-colors duration-300">
                        <div
                            className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor ?? DEFAULT_EVENT_COLOR}1a`, color: accentColor ?? DEFAULT_EVENT_COLOR }}
                        >
                            {mode === "edit" ? <CalendarClock size={20} /> : <CalendarPlus size={20} />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight transition-colors duration-300">
                                {mode === "edit" ? t.titleEdit : t.titleCreate}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">
                                {mode === "edit" ? t.subtitleEdit : t.subtitleCreate}
                            </p>
                        </div>
                        <button onClick={onClose} aria-label={t.close} title={t.close} className="shrink-0 p-2 -mr-1 -mt-1 text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 rounded-xl transition-all duration-200">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">{t.lblTitle}</span>
                            <div className="relative">
                                <Type size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    autoFocus
                                    className={`${fieldClass} pr-3`}
                                />
                            </div>
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                {t.lblDescription} <span className="font-medium normal-case text-gray-300 dark:text-gray-600">({t.optional})</span>
                            </span>
                            <div className="relative">
                                <AlignLeft size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={`${fieldClass} pr-3`}
                                />
                            </div>
                        </label>

                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.lblAllDay}</span>
                            <ToggleSwitch enabled={allDay} onToggle={() => handleToggleAllDay(!allDay)} title={t.lblAllDay} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">{t.lblStart}</span>
                                <div className="relative">
                                    <Clock3 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type={allDay ? "date" : "datetime-local"}
                                        value={startValue}
                                        onChange={(e) => setStartValue(e.target.value)}
                                        required
                                        className={`${fieldClass} pr-3`}
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                    {t.lblEnd} <span className="font-medium normal-case text-gray-300 dark:text-gray-600">({t.optional})</span>
                                </span>
                                <div className="relative">
                                    <Clock3 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        type={allDay ? "date" : "datetime-local"}
                                        value={endValue}
                                        onChange={(e) => setEndValue(e.target.value)}
                                        min={startValue}
                                        className={`${fieldClass} pr-3`}
                                    />
                                </div>
                            </label>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                {t.lblCategory} <span className="font-medium normal-case text-gray-300 dark:text-gray-600">({t.optional})</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCategoryId(null)}
                                    title={t.noCategory}
                                    aria-label={t.noCategory}
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-all ${categoryId === null ? "border-gray-400 dark:border-gray-500 scale-110" : "border-transparent hover:scale-105"}`}
                                >
                                    <Ban size={12} className="text-gray-400 dark:text-gray-500" />
                                </button>
                                {categories.map(category => (
                                    <div key={category.id} className="relative group/cat">
                                        <button
                                            type="button"
                                            onClick={() => setCategoryId(category.id)}
                                            title={category.name}
                                            aria-label={category.name}
                                            style={{ backgroundColor: category.color }}
                                            className={`w-7 h-7 rounded-full border-2 transition-all ${categoryId === category.id ? "border-gray-700 dark:border-gray-200 scale-110" : "border-transparent hover:scale-105"} ${editingCategoryId === category.id ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900" : ""}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => handleStartEditCategory(category, e)}
                                            title={t.editCategory}
                                            aria-label={t.editCategory}
                                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 items-center justify-center hidden group-hover/cat:flex transition-all"
                                        >
                                            <Pencil size={8} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteCategory(category, e)}
                                            title={t.deleteCategory}
                                            aria-label={t.deleteCategory}
                                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 items-center justify-center hidden group-hover/cat:flex transition-all"
                                        >
                                            <X size={9} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleOpenCreateCategory}
                                    title={t.newCategory}
                                    aria-label={t.newCategory}
                                    className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${showCategoryCreator && editingCategoryId === null ? "border-red-400 text-red-500" : "border-gray-300 dark:border-gray-600 text-gray-400 hover:border-gray-400"}`}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            {showCategoryCreator && (
                                <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 mt-1">
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                        {editingCategoryId !== null ? t.editCategory : t.newCategory}
                                    </span>
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        aria-label={t.phCategoryName}
                                        maxLength={50}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-300/70 dark:focus:ring-red-500/40"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {EVENT_CATEGORY_COLOR_PALETTE.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewCategoryColor(color)}
                                                style={{ backgroundColor: color }}
                                                aria-label={color}
                                                className={`w-6 h-6 rounded-full border-2 transition-all ${newCategoryColor === color ? "border-gray-700 dark:border-gray-200 scale-110" : "border-transparent hover:scale-105"}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={handleCloseCategoryEditor} className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                                            {t.btnCancel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveCategory}
                                            disabled={creatingCategory || !newCategoryName.trim()}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gray-800 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-white rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {creatingCategory && <Loader2 size={12} className="animate-spin" />}
                                            {editingCategoryId !== null ? t.btnSaveCategory : t.btnCreateCategory}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {mode === "edit" && event?.recurringEventId ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 rounded-xl">
                                <Repeat size={14} /> {t.partOfRecurring}
                            </div>
                        ) : mode === "create" && (
                            <div className="flex flex-col gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                        <Repeat size={14} /> {t.lblRepeats}
                                    </span>
                                    <ToggleSwitch enabled={repeats} onToggle={() => setRepeats(r => !r)} title={t.lblRepeats} />
                                </div>
                                {repeats && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">{t.lblFrequency}</span>
                                            <div className="relative">
                                                <select
                                                    value={frequency}
                                                    onChange={(e) => setFrequency(e.target.value)}
                                                    className={`${fieldClassNoIcon} appearance-none pr-9 cursor-pointer`}
                                                >
                                                    <option value="DAILY">{t.freqDaily}</option>
                                                    <option value="WEEKLY">{t.freqWeekly}</option>
                                                    <option value="BIWEEKLY">{t.freqBiweekly}</option>
                                                    <option value="MONTHLY">{t.freqMonthly}</option>
                                                    <option value="YEARLY">{t.freqYearly}</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                            </div>
                                        </label>
                                        <label className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-0.5">
                                                {t.lblRecurEndDate} <span className="font-medium normal-case text-gray-300 dark:text-gray-600">({t.optional})</span>
                                            </span>
                                            <input
                                                type="date"
                                                value={recurEndDate}
                                                onChange={(e) => setRecurEndDate(e.target.value)}
                                                min={toDateInput(new Date())}
                                                className={fieldClassNoIcon}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

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
                </div>
            )}
        </ModalOverlay>
    );
};
