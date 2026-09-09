import { Sidebar } from "../components/Sidebar";
import { SubjectSection } from "../components/SubjectSection";
import { OverdueSection } from "../components/OverdueSection";
import { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from "react";
import { Check, Coffee, Plus, Focus, LayoutGrid, Menu, Calendar, ListChecks, BarChart3, Eye, X, Search, Sparkles, CheckSquare, Trash2, Settings, Moon, Sun, Languages, Archive, HelpCircle, ArrowUpDown, MessageSquarePlus } from "lucide-react";
import { ArchivedSubjectsPopover } from "../components/ArchivedSubjectsPopover";
import type { CommandAction } from "../components/CommandPalette";
import { ProgressHeatmap } from "../components/ProgressHeatmap";
import { archiveSubject, deleteSubject, getSubjectsWithTasks, postSubject, restoreSubject, updateSubject } from "../api/subjectApi";
import { addNewTask, deleteTask, restoreTask, toggleTask, updateTask } from "../api/taskApi";
import { sortTasksByPriority } from "../utils/priorityColors";
import type { SmartCheckAiData, SubjectWithTasks, TaskPriority, TaskRequest } from "../types";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsername } from "../api/userApi";
import { addRecurringTask } from "../api/recurringTaskApi";
import { dailyAnalysis, pollForAnalysis } from "../api/smartCheckApi";
import { PageTransition } from "../components/PageTransition";
import { AgendaView } from "../components/AgendaView";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { Confetti } from "../components/Confetti";
import { WelcomeIllustration } from "../components/illustrations/WelcomeIllustration";
import { triggerHapticFeedback } from "../utils/feedback";
import { getSubjectColor } from "../utils/subjectColors";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context
import { useConfirm } from "../context/ConfirmContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-hot-toast";

// These are only needed after a deliberate user action (open settings, run
// SmartCheck, open the trash), so they're split out of the main dashboard chunk.
const SettingsModal = lazy(() => import("../components/SettingsModal").then(m => ({ default: m.SettingsModal })));
const SmartCheckModal = lazy(() => import("../components/SmartCheckModal"));
const TrashView = lazy(() => import("../components/TrashView").then(m => ({ default: m.TrashView })));
const CommandPalette = lazy(() => import("../components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const OnboardingTour = lazy(() => import("../components/OnboardingTour").then(m => ({ default: m.OnboardingTour })));
const FeedbackModal = lazy(() => import("../components/FeedbackModal").then(m => ({ default: m.FeedbackModal })));

// --- Translation dictionary for the Dashboard ---
const translations = {
    es: {
        alertAiAnalyzing: "🧠 SmartCheck está analizando tus tareas...",
        alertAiReady: "¡Tu plan de hoy ya está listo!",
        alertAiTimeout: "SmartCheck tardó demasiado en responder. Inténtalo de nuevo.",
        alertAiError: "Error al obtener el análisis.",
        alertRecurringCreated: "Tarea recurrente creada. Aparecerá según su periodicidad a partir de mañana.",
        errCreateTask: "Error al crear la tarea",
        errGeneric: "Error",
        errTrash: "No se pudo enviar la asignatura a la papelera.",
        errArchive: "No se pudo cambiar el estado de la asignatura.",
        confirmDeleteAccountTitle: "¿Borrar cuenta?",
        confirmDeleteAccount: "¿Estás seguro de que quieres borrar tu cuenta permanentemente? Esta acción no se puede deshacer.",
        errDeleteAccount: "Hubo un problema al intentar borrar la cuenta. Inténtalo de nuevo.",
        errLoadData: "Error al cargar los datos",
        errCreateSubject: "No se pudo crear la asignatura. Inténtalo de nuevo.",
        greetingMorning: "Buenos días,",
        greetingAfternoon: "Buenas tardes,",
        greetingNight: "Buenas noches,",
        noPendingTasks: "¡No tienes tareas pendientes hoy!",
        hideAgendaTitle: "Ocultar agenda (Modo Foco)",
        showAgendaTitle: "Mostrar agenda",
        focusMode: "Modo Foco",
        viewCalendar: "Ver Calendario",
        addNewSubject: "Añadir nueva asignatura",
        newSubjectTitle: "Nueva asignatura",
        newSubjectDesc: "Añade una nueva materia para organizar tus tareas.",
        formName: "Nombre",
        formDesc: "Descripción",
        formOptional: "(opcional)",
        btnCancel: "Cancelar",
        btnSaveSubject: "Guardar asignatura",
        perfTitle: "Tu rendimiento",
        perfSubtitle: "Historial de constancia",
        focusActiveTitle: "Modo Foco Activo",
        focusActiveDesc: "El calendario principal está oculto. Concéntrate en completar tus tareas de hoy para mantener tu racha de progreso en verde.",
        dismissFocusTip: "Cerrar aviso",
        loadingSpace: "Cargando tu espacio...",
        openMenu: "Abrir menú",
        tabAgenda: "Agenda",
        tabTasks: "Tareas",
        tabPerformance: "Progreso",
        viewLastPlan: "Ver plan de hoy",
        searchPlaceholder: "Buscar tareas o asignaturas...",
        searchNoResults: "No hay tareas ni asignaturas que coincidan con",
        searchClear: "Borrar búsqueda",
        remindersUnsupported: "Tu navegador no admite notificaciones.",
        remindersDenied: "Debes permitir las notificaciones en el navegador para activar los recordatorios.",
        remindersEnabledToast: "Recordatorios activados. Te avisaremos cuando una tarea esté por vencer.",
        reminderDueIn: "vence en",
        reminderMinutes: "min",
        welcomeTitle: "¡Bienvenido a RedCheck!",
        welcomeDesc: "Organiza tus tareas por asignaturas. Crea la primera para empezar y deja que SmartCheck AI te ayude a priorizar tu día.",
        selectTasks: "Seleccionar",
        sortByPriority: "Prioridad",
        ttSortByPriority: "Ordenar tareas por prioridad",
        archivedTrigger: "archivada",
        archivedTriggerPlural: "archivadas",
        cancelSelection: "Cancelar",
        tasksSelectedOne: "1 tarea seleccionada",
        tasksSelectedMany: "tareas seleccionadas",
        bulkComplete: "Completar",
        bulkDelete: "Eliminar",
        confirmBulkDeleteTitle: "¿Borrar tareas seleccionadas?",
        confirmBulkDelete: "¿Seguro que quieres eliminar las tareas seleccionadas?",
        bulkCompletedToast: "Tareas completadas.",
        bulkDeletedToast: "Tareas eliminadas.",
        taskDeletedToast: "Tarea eliminada.",
        subjectDeletedToast: "Asignatura eliminada.",
        undoBtn: "Deshacer",
        palettePlaceholder: "Buscar asignaturas, tareas o escribe un comando...",
        paletteSubjectsGroup: "Asignaturas",
        paletteTasksGroup: "Tareas",
        paletteActionsGroup: "Comandos",
        paletteEmpty: "Sin resultados.",
        paletteTaskCountOne: "1 tarea",
        paletteTaskCountMany: "tareas",
        paletteMoreTasks: "más",
        actionToggleThemeDark: "Cambiar a modo oscuro",
        actionToggleThemeLight: "Cambiar a modo claro",
        actionToggleLanguage: "Cambiar idioma",
        actionOpenSettings: "Abrir ajustes",
        actionOpenTrash: "Abrir papelera",
        actionCloseTrash: "Cerrar papelera",
        actionGeneratePlan: "Generar plan de SmartCheck",
        actionViewPlan: "Ver plan de hoy",
        actionAddSubject: "Añadir nueva asignatura",
        actionShowAgenda: "Mostrar agenda",
        actionFocusMode: "Activar Modo Foco",
        actionShowTour: "Ver el tour de bienvenida",
        actionSendFeedback: "Enviar feedback"
    },
    en: {
        alertAiAnalyzing: "🧠 SmartCheck is analyzing your tasks...",
        alertAiReady: "Your plan for today is ready!",
        alertAiTimeout: "SmartCheck took too long to respond. Please try again.",
        alertAiError: "Error fetching analysis.",
        alertRecurringCreated: "Recurring task created. It will appear according to its periodicity starting tomorrow.",
        errCreateTask: "Error creating task",
        errGeneric: "Error",
        errTrash: "Could not send the subject to the trash.",
        errArchive: "Could not change the subject's status.",
        confirmDeleteAccountTitle: "Delete account?",
        confirmDeleteAccount: "Are you sure you want to permanently delete your account? This action cannot be undone.",
        errDeleteAccount: "There was a problem trying to delete the account. Please try again.",
        errLoadData: "Error loading data",
        errCreateSubject: "Could not create the subject. Please try again.",
        greetingMorning: "Good morning,",
        greetingAfternoon: "Good afternoon,",
        greetingNight: "Good evening,",
        noPendingTasks: "You have no pending tasks today!",
        hideAgendaTitle: "Hide agenda (Focus Mode)",
        showAgendaTitle: "Show agenda",
        focusMode: "Focus Mode",
        viewCalendar: "View Calendar",
        addNewSubject: "Add new subject",
        newSubjectTitle: "New subject",
        newSubjectDesc: "Add a new subject to organize your tasks.",
        formName: "Name",
        formDesc: "Description",
        formOptional: "(optional)",
        btnCancel: "Cancel",
        btnSaveSubject: "Save subject",
        perfTitle: "Your performance",
        perfSubtitle: "Consistency history",
        focusActiveTitle: "Focus Mode Active",
        focusActiveDesc: "The main calendar is hidden. Focus on completing your tasks today to keep your progress streak green.",
        dismissFocusTip: "Dismiss tip",
        loadingSpace: "Loading your space...",
        openMenu: "Open menu",
        tabAgenda: "Agenda",
        tabTasks: "Tasks",
        tabPerformance: "Progress",
        viewLastPlan: "View today's plan",
        searchPlaceholder: "Search tasks or subjects...",
        searchNoResults: "No tasks or subjects match",
        searchClear: "Clear search",
        remindersUnsupported: "Your browser doesn't support notifications.",
        remindersDenied: "You need to allow notifications in your browser to turn on reminders.",
        remindersEnabledToast: "Reminders on. We'll let you know when a task is about to be due.",
        reminderDueIn: "due in",
        reminderMinutes: "min",
        welcomeTitle: "Welcome to RedCheck!",
        welcomeDesc: "Organize your tasks by subject. Create your first one to get started and let SmartCheck AI help prioritize your day.",
        selectTasks: "Select",
        sortByPriority: "Priority",
        ttSortByPriority: "Sort tasks by priority",
        archivedTrigger: "archived",
        archivedTriggerPlural: "archived",
        cancelSelection: "Cancel",
        tasksSelectedOne: "1 task selected",
        tasksSelectedMany: "tasks selected",
        bulkComplete: "Complete",
        bulkDelete: "Delete",
        confirmBulkDeleteTitle: "Delete selected tasks?",
        confirmBulkDelete: "Are you sure you want to delete the selected tasks?",
        bulkCompletedToast: "Tasks completed.",
        bulkDeletedToast: "Tasks deleted.",
        taskDeletedToast: "Task deleted.",
        subjectDeletedToast: "Subject deleted.",
        undoBtn: "Undo",
        palettePlaceholder: "Search subjects, tasks, or type a command...",
        paletteSubjectsGroup: "Subjects",
        paletteTasksGroup: "Tasks",
        paletteActionsGroup: "Commands",
        paletteEmpty: "No results.",
        paletteTaskCountOne: "1 task",
        paletteTaskCountMany: "tasks",
        paletteMoreTasks: "more",
        actionToggleThemeDark: "Switch to dark mode",
        actionToggleThemeLight: "Switch to light mode",
        actionToggleLanguage: "Switch language",
        actionOpenSettings: "Open settings",
        actionOpenTrash: "Open trash",
        actionCloseTrash: "Close trash",
        actionGeneratePlan: "Generate SmartCheck plan",
        actionViewPlan: "View today's plan",
        actionAddSubject: "Add new subject",
        actionShowAgenda: "Show agenda",
        actionFocusMode: "Turn on Focus Mode",
        actionShowTour: "Show welcome tour",
        actionSendFeedback: "Send feedback"
    }
};

type MobileView = "tasks" | "agenda" | "performance";
const MOBILE_TAB_ORDER: MobileView[] = ["tasks", "agenda", "performance"];

// Only used to label the Ctrl/Cmd+K search hint — doesn't need to be
// reactive, so it's read once at module scope instead of in a component.
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

const DashboardPage = () => {
    const navigate = useNavigate();
    const { language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const t = translations[language as keyof typeof translations];
    const confirm = useConfirm();

    const [subjects, setSubjects] = useState<SubjectWithTasks[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [mobileView, setMobileView] = useState<MobileView>("tasks");
    const [openFormSubjectId, setOpenFormSubjectId] = useState<number | null>(null);
    const [openFormSubjectIdTaskId, setOpenFormSubjectIdTaskId] = useState<{subjectId: number; taskId: number} | null>(null);
    const [openFormUpdateSubject, setOpenFormUpdateSubject] = useState<number | null>(null);
    const [openFormNewSubject, setOpenFormNewSubject] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const [showCalendar, setShowCalendar] = useState(true);
    const [showTrash, setShowTrash] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Command palette (Ctrl/Cmd+K) — a superset of the inline search above:
    // same task/subject matching, plus jump-to-action commands.
    const [paletteOpen, setPaletteOpen] = useState(false);

    // One-time product tour for new users — shown automatically on first
    // load (see the initial-data effect below), replayable anytime via the
    // command palette's "Show tour" action.
    const [showOnboarding, setShowOnboarding] = useState(false);
    const handleCloseOnboarding = () => {
        localStorage.setItem("rc_onboarding_seen", "true");
        setShowOnboarding(false);
    };

    // Closes Settings before opening Feedback rather than stacking two
    // ModalOverlays — used by both the SettingsModal row and the command
    // palette action below.
    const handleOpenFeedback = () => {
        setIsSettingsOpen(false);
        setShowFeedbackModal(true);
    };

    const handleOpenTaskEditor = (subjectId: number, taskId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        const task = subject?.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Clears any search filter left over from a previous palette search
        // (e.g. a subject search from earlier in the session) that might
        // not match this task's subject — otherwise the edit form opens via
        // state but the task stays hidden behind the stale filter, since
        // filteredSubjects/displaySubjects would exclude it.
        setSearchQuery("");
        setOpenFormSubjectIdTaskId({ subjectId, taskId });

        let formattedDate = "";
        if (task.deadline) {
            const d = new Date(task.deadline);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            formattedDate = d.toISOString().slice(0, 16);
        }
        setUpdatedTask({
            title: task.title,
            description: task.description || "",
            deadline: formattedDate,
            priority: task.priority
        });
    };

    // Selecting a subject result in the command palette reuses the existing
    // dashboard search/filter (rather than a dedicated subject-detail view,
    // which doesn't exist here) — it surfaces that subject with all its
    // tasks the same way typing its name into the search bar would.
    const handleSelectSubjectFromPalette = (subjectId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return;
        setSearchQuery(subject.name);
    };

    // Bulk task actions — selection is a set of "subjectId:taskId" keys
    // rather than per-subject state, since a selection can span subjects.
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedTaskKeys, setSelectedTaskKeys] = useState<Set<string>>(new Set());
    const [archivedPopoverOpen, setArchivedPopoverOpen] = useState(false);

    const taskKey = (subjectId: number, taskId: number) => `${subjectId}:${taskId}`;

    const handleToggleSelectTask = (subjectId: number, taskId: number) => {
        const key = taskKey(subjectId, taskId);
        setSelectedTaskKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedTaskKeys(new Set());
    };

    // Mobile-only entry point into selection mode (gallery-style long-press
    // on a task, wired up in TaskItem) — replaces the "Select" button there,
    // which is hidden below the sm: breakpoint. Enters selection mode with
    // the long-pressed task already selected, same as the photo-gallery
    // pattern it's modeled on.
    const handleLongPressSelectTask = (subjectId: number, taskId: number) => {
        setSelectionMode(true);
        setSelectedTaskKeys(new Set([taskKey(subjectId, taskId)]));
    };

    const handleBulkComplete = async () => {
        // Fired synchronously, before the awaited calls below — see
        // handleToggleTask for why this can't happen after an await.
        if (taskFeedbackEnabled) {
            triggerHapticFeedback();
        }
        const keys = Array.from(selectedTaskKeys);
        try {
            await Promise.all(keys.map(key => {
                const [subjectIdStr, taskIdStr] = key.split(":");
                return toggleTask(Number(subjectIdStr), Number(taskIdStr), true);
            }));
            toast.success(t.bulkCompletedToast);
            exitSelectionMode();
            await refreshData();
        } catch (err) {
            console.error("Error completing selected tasks:", err);
            toast.error(t.errGeneric);
        }
    };

    const handleBulkDelete = async () => {
        if (!(await confirm({ title: t.confirmBulkDeleteTitle, message: t.confirmBulkDelete }))) return;
        const keys = Array.from(selectedTaskKeys);
        try {
            await Promise.all(keys.map(key => {
                const [subjectIdStr, taskIdStr] = key.split(":");
                return deleteTask(Number(subjectIdStr), Number(taskIdStr));
            }));
            showUndoToast(t.bulkDeletedToast, async () => {
                try {
                    await Promise.all(keys.map(key => {
                        const [subjectIdStr, taskIdStr] = key.split(":");
                        return restoreTask(Number(subjectIdStr), Number(taskIdStr));
                    }));
                    await refreshData();
                } catch {
                    toast.error(t.errGeneric);
                }
            });
            exitSelectionMode();
            await refreshData();
        } catch (err) {
            console.error("Error deleting selected tasks:", err);
            toast.error(t.errGeneric);
        }
    };

    // Client-side task reminders — no backend/service worker involved, so
    // this only fires while RedCheck is open (tab or installed PWA), not
    // when the browser/app is closed. See CLAUDE.md for the tradeoff.
    const [remindersEnabled, setRemindersEnabled] = useState(
        () => localStorage.getItem("remindersEnabled") === "true"
    );
    const remindedTaskIdsRef = useRef<Set<number>>(new Set());

    const handleToggleReminders = async () => {
        if (remindersEnabled) {
            setRemindersEnabled(false);
            localStorage.setItem("remindersEnabled", "false");
            return;
        }
        if (typeof Notification === "undefined") {
            toast.error(t.remindersUnsupported);
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setRemindersEnabled(true);
            localStorage.setItem("remindersEnabled", "true");
            toast.success(t.remindersEnabledToast);
        } else {
            toast.error(t.remindersDenied);
        }
    };

    // Sound + haptic feedback on task completion — opt-out (defaults on)
    // rather than opt-in, since it's a subtle, feature-detected touch.
    const [taskFeedbackEnabled, setTaskFeedbackEnabled] = useState(
        () => localStorage.getItem("taskFeedbackEnabled") !== "false"
    );
    const handleToggleTaskFeedback = () => {
        const next = !taskFeedbackEnabled;
        setTaskFeedbackEnabled(next);
        localStorage.setItem("taskFeedbackEnabled", String(next));
    };

    // Desktop-only dismissible tip inside the Focus Mode performance panel.
    // Persisted in sessionStorage (not plain state) so it stays dismissed
    // across refreshes/navigation within the same session, but reappears
    // the next time the user logs in (Sidebar's logout clears the flag).
    const [focusTipDismissed, setFocusTipDismissed] = useState(
        () => sessionStorage.getItem("focusTipDismissed") === "true"
    );
    const handleDismissFocusTip = () => {
        sessionStorage.setItem("focusTipDismissed", "true");
        setFocusTipDismissed(true);
    };

    const [deletingSubjects, setDeletingSubjects] = useState<number[]>([]);
    const [addingSubjects, setAddingSubjects] = useState<number[]>([]);
    const [addingTasks, setAddingTasks] = useState<number[]>([]);
    const [deletingTasks, setDeletingTasks] = useState<number[]>([]);
    // Tracks the pending optimistic-removal setTimeout for each in-flight
    // soft-delete (see handleDeleteTask/handleDeleteSubject), so an Undo
    // click can cancel it before it fires — otherwise a fast undo could
    // race the timeout and get the just-restored item filtered right back
    // out of local state.
    const taskDeleteTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const subjectDeleteTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const [username, setUsername] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [updatedSubject, setUpdatedSubject] = useState({ name: "", description: "" });
    const [newTask, setNewTask] = useState<{ title: string; description: string; deadline: string; recurrence: string; priority: TaskPriority }>({ title: "", description: "", deadline: "", recurrence: "NONE", priority: "MEDIUM" });
    const [updatedTask, setUpdatedTask] = useState<{ title: string; description: string; deadline: string; priority: TaskPriority }>({ title: "", description: "", deadline: "", priority: "MEDIUM" });
    const [newSubject, setNewSubject] = useState({ name: "", description: "" });
    const [sortByPriority, setSortByPriority] = useState(false);

    // Functional-updater form (not `{ ...newTask, ... }` reading the outer
    // closure directly) so these can be useCallback'd with an empty
    // dependency array — a stable reference regardless of how often
    // newTask/updatedTask/updatedSubject themselves change, which matters
    // once they're passed into a React.memo'd child (SubjectSection/
    // OverdueSection): a callback that changes identity on every keystroke
    // would defeat the memoization.
    const handleChangeTask = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewTask(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);
    const handleChangeUpdateTask = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUpdatedTask(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);
    const handleChangeUpdateSubject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdatedSubject(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);
    const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => { setNewSubject({ ...newSubject, [e.target.name]: e.target.value}); }

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPlanData, setAiPlanData] = useState<SmartCheckAiData | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiNotificationReady, setAiNotificationReady] = useState(false);
    
    const handleGenerateAiPlan = async () => {
        setIsAiLoading(true);
        const toastId = toast.loading(t.alertAiAnalyzing);
        try {
            await dailyAnalysis(language);
        } catch (error) {
            console.warn("dailyAnalysis() threw an error, but we continue polling:", error);
        }

        pollForAnalysis()
            .then((analysis) => {
                setAiPlanData(analysis);
                setAiNotificationReady(true);
                toast.success(t.alertAiReady, { id: toastId });
            })
            .catch((err) => {
                if (err?.message === "TIMEOUT") {
                    toast.error(t.alertAiTimeout, { id: toastId });
                } else {
                    console.error("Error during polling:", err);
                    toast.error(t.alertAiError, { id: toastId });
                }
            })
            .finally(() => {
                setIsAiLoading(false);
            });
    };

    const handleOpenAiModal = () => {
        if (aiPlanData) {
            setIsAiModalOpen(true);
            setAiNotificationReady(false);
        }
    };

    const handleSubmitTask = useCallback(async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null);
        try {
            if (newTask.recurrence === "NONE") {
                const response = await addNewTask(subjectId, {
                    title: newTask.title,
                    description: newTask.description,
                    deadline: newTask.deadline,
                    priority: newTask.priority
                });

                setAddingTasks(prev => [...prev, response.id]);
                setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: [...subject.tasks, response] }));
                setOpenFormSubjectId(null);

                setTimeout(() => {
                    setNewTask({title: "", description: "", deadline: "", recurrence: "NONE", priority: "MEDIUM"});
                }, 500);

                setTimeout(() => {
                    setAddingTasks(prev => prev.filter(id => id !== response.id));
                }, 50);

            } else {
                await addRecurringTask(subjectId, {
                    title: newTask.title,
                    description: newTask.description,
                    periodicidad: newTask.recurrence
                });
                toast.success(t.alertRecurringCreated);

                setOpenFormSubjectId(null);
                setTimeout(() => {
                    setNewTask({title: "", description: "", deadline: "", recurrence: "NONE", priority: "MEDIUM"});
                }, 500);
            }
        } catch {
            setError(t.errCreateTask);
        }
    }, [newTask, t.alertRecurringCreated, t.errCreateTask]);

    const handleUpdateTask = useCallback(async (e: React.FormEvent, subjectId: number, taskId: number) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await updateTask(subjectId, taskId, updatedTask);
            setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : response) }));
            setOpenFormSubjectIdTaskId(null);
            setUpdatedTask({title: "", description: "", deadline: "", priority: "MEDIUM"});
        } catch { setError(t.errGeneric); }
    }, [updatedTask, t.errGeneric]);

    // Stable identity (no external deps) — referenced from several
    // useCallback-memoized handlers below (undo-delete flows), so it needs
    // to stay the same function across renders rather than being recreated.
    const refreshData = useCallback(async () => {
        try {
            const subjectsWithTasks = await getSubjectsWithTasks();
            setSubjects(subjectsWithTasks);
        } catch (err) {
            console.error("Error refreshing the dashboard:", err);
        }
    }, []);

    // Every delete in this app is a soft-delete (goes to Trash, see
    // TrashView) — so a quick "Undo" toast right after the action is a much
    // faster recovery path than navigating to Trash and restoring it there.
    // Built on toast.custom rather than the Toaster's built-in styling since
    // it needs its own dedicated action button; the toastObj param is
    // deliberately not named `t` to avoid shadowing the translations dict.
    const showUndoToast = useCallback((message: string, onUndo: () => void) => {
        toast.custom((toastObj) => (
            <div
                className={`flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-2xl pl-4 pr-1.5 py-1.5 transition-opacity duration-200 ${toastObj.visible ? "opacity-100" : "opacity-0"}`}
            >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-1">{message}</span>
                <button
                    onClick={() => {
                        onUndo();
                        toast.dismiss(toastObj.id);
                    }}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 rounded-xl transition-all duration-150"
                >
                    {t.undoBtn}
                </button>
            </div>
        ), { duration: 5000 });
    }, [t.undoBtn]);

    const handleDeleteTask = useCallback(async (subjectId: number, taskId: number) => {
        setError(null);
        try {
            setDeletingTasks(prev => [...prev, taskId]);
            await deleteTask(subjectId, taskId);
            const timeoutId = setTimeout(() => {
                setSubjects(current => current.map(subject =>
                    subject.id !== subjectId
                        ? subject
                        : { ...subject, tasks: subject.tasks.filter(task => task.id !== taskId) }
                ));
                setDeletingTasks(prev => prev.filter(id => id !== taskId));
                taskDeleteTimeoutsRef.current.delete(taskId);
            }, 400);
            taskDeleteTimeoutsRef.current.set(taskId, timeoutId);

            showUndoToast(t.taskDeletedToast, async () => {
                clearTimeout(taskDeleteTimeoutsRef.current.get(taskId));
                taskDeleteTimeoutsRef.current.delete(taskId);
                setDeletingTasks(prev => prev.filter(id => id !== taskId));
                try {
                    await restoreTask(subjectId, taskId);
                    await refreshData();
                } catch {
                    toast.error(t.errGeneric);
                }
            });
        } catch(err) {
            console.error("Error deleting the task:", err);
            setDeletingTasks(prev => prev.filter(id => id !== taskId));
        }
    }, [showUndoToast, t.taskDeletedToast, t.errGeneric, refreshData]);

    // Task create/edit/delete triggered from AgendaView (calendar), kept
    // separate from the inline-form handlers above since the calendar has
    // its own self-contained modal (CalendarTaskModal) rather than the
    // per-subject inline form state (newTask/updatedTask) — it needs to
    // work standalone even when the Tasks panel isn't on screen (mobile's
    // Agenda tab). Both paths converge on the same `subjects` state.
    const handleCalendarCreateTask = useCallback(async (subjectId: number, data: TaskRequest) => {
        const response = await addNewTask(subjectId, data);
        setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: [...subject.tasks, response] }));
    }, []);

    const handleCalendarUpdateTask = useCallback(async (subjectId: number, taskId: number, data: TaskRequest) => {
        const response = await updateTask(subjectId, taskId, data);
        setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : response) }));
    }, []);

    const handleCalendarDeleteTask = useCallback(async (subjectId: number, taskId: number) => {
        await deleteTask(subjectId, taskId);
        setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.filter(task => task.id !== taskId) }));
        showUndoToast(t.taskDeletedToast, async () => {
            try {
                await restoreTask(subjectId, taskId);
                await refreshData();
            } catch {
                toast.error(t.errGeneric);
            }
        });
    }, [showUndoToast, t.taskDeletedToast, t.errGeneric, refreshData]);

    const handleDeleteSubject = useCallback(async (subjectId: number) => {
        setError(null);
        try {
            setDeletingSubjects(prev => [...prev, subjectId]);
            await deleteSubject(subjectId);
            const timeoutId = setTimeout(() => {
                setSubjects(current => current.filter(subject => subject.id !== subjectId));
                setDeletingSubjects(prev => prev.filter(id => id !== subjectId));
                subjectDeleteTimeoutsRef.current.delete(subjectId);
            }, 400);
            subjectDeleteTimeoutsRef.current.set(subjectId, timeoutId);

            showUndoToast(t.subjectDeletedToast, async () => {
                clearTimeout(subjectDeleteTimeoutsRef.current.get(subjectId));
                subjectDeleteTimeoutsRef.current.delete(subjectId);
                setDeletingSubjects(prev => prev.filter(id => id !== subjectId));
                try {
                    await restoreSubject(subjectId);
                    await refreshData();
                } catch {
                    toast.error(t.errGeneric);
                }
            });
        } catch(err) {
            console.error("Error sending to trash:", err);
            setError(t.errTrash);
            setDeletingSubjects(prev => prev.filter(id => id !== subjectId));
        }
    }, [t.errTrash, t.subjectDeletedToast, t.errGeneric, showUndoToast, refreshData]);

    const handleUpdateSubject = useCallback(async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await updateSubject(subjectId, updatedSubject);
            setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, ...response, tasks: subject.tasks }));
            setOpenFormUpdateSubject(null);
            setUpdatedSubject({ name: "", description: "" });
        } catch { setError(t.errGeneric); }
    }, [updatedSubject, t.errGeneric]);

    const handleArchiveSubject = useCallback(async (subjectId: number) => {
        try {
            const subject = subjects.find(s => s.id === subjectId);
            const isCurrentlyArchived = subject?.archived || false;
            const response = await archiveSubject(subjectId, !isCurrentlyArchived);
            setSubjects(prev => prev.map(s =>
                s.id !== subjectId ? s : { ...s, ...response, tasks: s.tasks }
            ));
        } catch (err) {
            console.error("Error archiving/unarchiving:", err);
            toast.error(t.errArchive);
        }
    }, [subjects, t.errArchive]);

    const handleDeleteAccount = async () => {
        if (await confirm({ title: t.confirmDeleteAccountTitle, message: t.confirmDeleteAccount })) {
            try {
                await deleteUser();
                localStorage.removeItem("token");
                navigate("/login");
            } catch {
                toast.error(t.errDeleteAccount);
            }
        }
    };

    // Updated to use the translated greetings
    const getGreeting = (username: string): string => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return `${t.greetingMorning} ${username}`;
        if (hour >= 12 && hour < 21) return `${t.greetingAfternoon} ${username}`;
        return `${t.greetingNight} ${username}`;
    };

    // Updated to adapt the date to the current language
    const today = new Date().toLocaleDateString(language === 'es' ? "es-ES" : "en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const profile = await getUsername();
                setUsername(profile.username);
                setUserEmail(profile.email);
                await refreshData();
                if (localStorage.getItem("rc_onboarding_seen") !== "true") {
                    setShowOnboarding(true);
                }
            } catch {
                setError(t.errLoadData);
            } finally {
                setLoading(false); 
            }
        };
    
        fetchInitialData();
        // Intentionally run once on mount only — including `t` would refetch
        // the whole dashboard every time the user toggles the UI language.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Polls pending tasks for ones about to become due and fires an in-app
    // toast + browser Notification for each (once per task, tracked in
    // remindedTaskIdsRef so it doesn't repeat every tick). Runs against the
    // full `subjects`, not the search-filtered list, since reminders
    // shouldn't depend on what's currently being searched for.
    useEffect(() => {
        if (!remindersEnabled) return;

        const REMINDER_WINDOW_MS = 30 * 60 * 1000;

        const checkDeadlines = () => {
            const now = Date.now();
            subjects.forEach(subject => {
                subject.tasks.forEach(task => {
                    if (task.completed || task.overdue || !task.deadline) return;
                    const msUntilDue = new Date(task.deadline).getTime() - now;
                    if (msUntilDue <= 0 || msUntilDue > REMINDER_WINDOW_MS) return;
                    if (remindedTaskIdsRef.current.has(task.id)) return;

                    remindedTaskIdsRef.current.add(task.id);
                    const minutesLeft = Math.max(1, Math.round(msUntilDue / 60000));
                    const message = `${task.title} — ${t.reminderDueIn} ${minutesLeft} ${t.reminderMinutes}`;

                    toast(message, { icon: "⏰" });
                    // `remindersEnabled` only ever becomes true right after
                    // requestPermission() resolved "granted" (see
                    // handleToggleReminders), so that's trusted here rather
                    // than re-reading the static Notification.permission —
                    // that getter can lag behind the resolved permission
                    // (observed in headless/CDP-driven browsers, and not
                    // worth the fragility even elsewhere). The try/catch is
                    // the real safety net, e.g. if permission was revoked
                    // at the OS level after the fact.
                    if (typeof Notification !== "undefined") {
                        try {
                            new Notification("RedCheck", { body: message, icon: "/icons/icon-192.png" });
                        } catch (err) {
                            console.warn("Could not show a browser notification:", err);
                        }
                    }
                });
            });
        };

        checkDeadlines();
        const interval = setInterval(checkDeadlines, 60 * 1000);
        return () => clearInterval(interval);
    }, [remindersEnabled, subjects, t]);

    // Client-side search across subject names and task titles — cheap
    // enough not to need debouncing at this data scale. A subject whose
    // own name matches keeps all its tasks; otherwise only its matching
    // tasks are kept, and the subject is dropped entirely if none match.
    // Both the main task list and OverdueSection read from this, so
    // filtering stays in one place instead of being duplicated per view.
    const filteredSubjects = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return subjects;

        return subjects.reduce<SubjectWithTasks[]>((acc, subject) => {
            if (subject.name.toLowerCase().includes(query)) {
                acc.push(subject);
                return acc;
            }
            const matchingTasks = subject.tasks.filter(task => task.title.toLowerCase().includes(query));
            if (matchingTasks.length > 0) {
                acc.push({ ...subject, tasks: matchingTasks });
            }
            return acc;
        }, []);
    }, [subjects, searchQuery]);

    // "Sort by priority" toggle (HIGH first, see priorityColors.ts) applied
    // on top of the search filter above — read by both the Tasks panel and
    // OverdueSection, same as filteredSubjects itself, so the two stay
    // consistent with each other.
    const displaySubjects = useMemo(() => {
        if (!sortByPriority) return filteredSubjects;
        return filteredSubjects.map(subject => ({ ...subject, tasks: sortTasksByPriority(subject.tasks) }));
    }, [filteredSubjects, sortByPriority]);

    // Feeds the archived-subjects popover trigger in the bulk-actions row —
    // computed from the unfiltered `subjects` (not filteredSubjects) since
    // archived subjects aren't part of the search-filtered active list to
    // begin with.
    const archivedSubjects = useMemo(() => subjects.filter(s => s.archived), [subjects]);

    // Global keyboard shortcuts: Ctrl/Cmd+K opens the command palette (a
    // superset of the inline search — see CommandPalette.tsx), Escape backs
    // out of whatever's open — mobile drawer, trash view, an inline form —
    // one layer at a time, or clears the search as a last resort. Modals
    // built on ModalOverlay (Settings/SmartCheck/recurring routines/command
    // palette) handle their own Escape, so this skips its cascade while one
    // of the page-level ones is open, to avoid a single keypress closing
    // two things at once.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen(true);
                return;
            }

            if (e.key !== "Escape") return;
            if (isSettingsOpen || isAiModalOpen || paletteOpen || showFeedbackModal) return;

            if (mobileSidebarOpen) {
                setMobileSidebarOpen(false);
            } else if (showTrash) {
                setShowTrash(false);
            } else if (openFormNewSubject) {
                setOpenFormNewSubject(false);
            } else if (openFormSubjectId !== null) {
                setOpenFormSubjectId(null);
            } else if (openFormUpdateSubject !== null) {
                setOpenFormUpdateSubject(null);
            } else if (openFormSubjectIdTaskId !== null) {
                setOpenFormSubjectIdTaskId(null);
            } else if (selectionMode) {
                exitSelectionMode();
            } else if (searchQuery) {
                setSearchQuery("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        isSettingsOpen,
        isAiModalOpen,
        paletteOpen,
        showFeedbackModal,
        mobileSidebarOpen,
        showTrash,
        openFormNewSubject,
        openFormSubjectId,
        openFormUpdateSubject,
        openFormSubjectIdTaskId,
        selectionMode,
        searchQuery
    ]);

    const subjectStats = useMemo(() => {
        const totalPendingTasks = subjects.reduce((acc, curr) => {
            const pendingInSubject = curr.tasks?.filter(t => !t.completed).length || 0;
            return acc + pendingInSubject;
        }, 0);

        if (totalPendingTasks === 0) return []; 

        const rawStats = subjects.map(subject => {
            const pendingInSubject = subject.tasks?.filter(t => !t.completed).length || 0;
            return {
                id: subject.id,
                name: subject.name,
                percent: Math.round((pendingInSubject / totalPendingTasks) * 100)
            };
        });

        const top3Stats = rawStats
            .filter(stat => stat.percent > 0)
            .sort((a, b) => b.percent - a.percent)
            .slice(0, 3);

        return top3Stats.map((stat) => {
            const color = getSubjectColor(stat.id);
            return {
                ...stat,
                colorClass: color.dot,
                hoverTextClass: color.hoverText
            };
        });

    }, [subjects]);

    const handleToggleTask = useCallback(async (subjectId: number, taskId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        const task = subject?.tasks.find(t => t.id === taskId);
        if (!task) return;
        const willBeCompleted = !task.completed;
        // Fired synchronously, before the `await` below — the Vibration
        // API needs an active user gesture, and that gesture context
        // doesn't survive crossing an await on mobile (see feedback.ts).
        if (willBeCompleted && taskFeedbackEnabled) {
            triggerHapticFeedback();
        }
        try {
            await toggleTask(subjectId, taskId, willBeCompleted);
            setSubjects(prev => prev.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : { ...task, completed: willBeCompleted }) }));
        } catch { console.error("Error updating the task"); }
    }, [subjects, taskFeedbackEnabled]);

    const handleSubmitSubject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); 
        setError(null); 
        try {
            const response = await postSubject(newSubject);
            const newlyCreatedSubject = { ...response, tasks: [] };
            
            setAddingSubjects(prev => [...prev, newlyCreatedSubject.id]);
            setSubjects([...subjects, newlyCreatedSubject]);
            setOpenFormNewSubject(false);
            
            setTimeout(() => {
                setNewSubject({ name: "", description: "" });
            }, 500); 
            
            setTimeout(() => {
                setAddingSubjects(prev => prev.filter(id => id !== newlyCreatedSubject.id));
            }, 50);
            
        } catch(err) { 
            console.error("Error creating subject:", err);
            setError(t.errCreateSubject); 
        } 
    };

    const totalPending = useMemo(
        () => subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed).length, 0),
        [subjects]
    );
    const totalPendingOverdue = useMemo(
        () => subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed && t.overdue).length, 0),
        [subjects]
    );

    // Fires a confetti burst the moment totalPending drops to 0 — but only
    // when that's an actual transition from >0 (i.e. the user just cleared
    // their last task), never on a fresh load that's already empty. The ref
    // starting at null (not 0) is what makes that distinction possible.
    const prevTotalPendingRef = useRef<number | null>(null);
    const [celebrationTrigger, setCelebrationTrigger] = useState(0);
    useEffect(() => {
        if (prevTotalPendingRef.current !== null && prevTotalPendingRef.current > 0 && totalPending === 0) {
            setCelebrationTrigger(c => c + 1);
        }
        prevTotalPendingRef.current = totalPending;
    }, [totalPending]);

    // Command palette actions — contextual (label/icon depend on current
    // state, e.g. Trash open/closed, Focus Mode on/off).
    // Plain array, not memoized: two of its entries close over
    // handleGenerateAiPlan/handleOpenAiModal, which are recreated every
    // render anyway, so a useMemo here would recompute every render
    // regardless — not worth the false promise of caching.
    const paletteActions: CommandAction[] = [
        {
            id: "toggle-theme",
            label: theme === "light" ? t.actionToggleThemeDark : t.actionToggleThemeLight,
            icon: theme === "light" ? Moon : Sun,
            onSelect: toggleTheme,
        },
        {
            id: "toggle-language",
            label: t.actionToggleLanguage,
            icon: Languages,
            onSelect: toggleLanguage,
        },
        {
            id: "open-settings",
            label: t.actionOpenSettings,
            icon: Settings,
            onSelect: () => setIsSettingsOpen(true),
        },
        {
            id: "toggle-trash",
            label: showTrash ? t.actionCloseTrash : t.actionOpenTrash,
            icon: Trash2,
            onSelect: () => {
                if (showTrash) {
                    setShowTrash(false);
                    refreshData();
                } else {
                    setShowTrash(true);
                }
            },
        },
        ...(!isAiLoading ? [{
            id: "generate-plan",
            label: t.actionGeneratePlan,
            icon: Sparkles,
            onSelect: handleGenerateAiPlan,
        }] : []),
        ...(aiPlanData ? [{
            id: "view-plan",
            label: t.actionViewPlan,
            icon: Eye,
            onSelect: handleOpenAiModal,
        }] : []),
        {
            id: "add-subject",
            label: t.actionAddSubject,
            icon: Plus,
            onSelect: () => setOpenFormNewSubject(true),
        },
        {
            id: "toggle-focus-mode",
            label: showCalendar ? t.actionFocusMode : t.actionShowAgenda,
            icon: showCalendar ? Focus : LayoutGrid,
            onSelect: () => setShowCalendar(!showCalendar),
        },
        {
            id: "show-tour",
            label: t.actionShowTour,
            icon: HelpCircle,
            onSelect: () => setShowOnboarding(true),
        },
        {
            id: "send-feedback",
            label: t.actionSendFeedback,
            icon: MessageSquarePlus,
            onSelect: () => setShowFeedbackModal(true),
        },
    ];

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) return <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500"><p className="text-red-500 font-semibold">{error}</p></div>;

    return (
        <PageTransition>
            <Confetti trigger={celebrationTrigger} />
            <div className="flex flex-col sm:flex-row h-dvh bg-[#e3e7e2] dark:bg-gray-950 transition-colors duration-500 p-2 sm:p-4 overflow-hidden">

                <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    mobileOpen={mobileSidebarOpen}
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                    totalPending={totalPending}
                    subjects={subjects}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onAiPlanClick={handleGenerateAiPlan}
                    isAiLoading={isAiLoading}
                    aiNotificationReady={aiNotificationReady}
                    hasAiPlan={aiPlanData !== null}
                    onOpenAiModal={handleOpenAiModal}
                    subjectStats={subjectStats}
                    showTrash={showTrash}
                    onOpenTrash={() => {
                        if (showTrash) {
                            setShowTrash(false);
                            refreshData();
                        } else {
                            setShowTrash(true);
                        }
                    }}
                    onGoHome={() => setShowTrash(false)}
                    onMarkNotificationsRead={() => setAiNotificationReady(false)}
                />

                {/* --- MOBILE TOP BAR (hamburger + logo) --- */}
                <div className="sm:hidden flex items-center justify-between shrink-0 mb-2 px-1 py-1">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-md text-gray-600 dark:text-gray-300"
                        title={t.openMenu}
                    >
                        <Menu size={20} />
                    </button>
                    <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        REDCHECK
                    </span>
                    {aiPlanData ? (
                        <button
                            onClick={handleOpenAiModal}
                            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-md text-red-600 dark:text-red-400"
                            title={t.viewLastPlan}
                        >
                            <Eye size={20} />
                            {aiNotificationReady && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-white dark:border-gray-900 animate-pulse"></span>
                            )}
                        </button>
                    ) : (
                        <div className="w-10 h-10" />
                    )}
                </div>

                {/* overflow-x-auto is the safety net for the same tablet-width
                    squeeze the lg:min-w change above addresses — the outer
                    app shell (h-dvh ... overflow-hidden) would otherwise
                    silently clip BLOCK 2/3 out of reach entirely (not just
                    visually crowd them) at any width where the row's
                    combined min-content width still exceeds the viewport,
                    since none of these three columns has a min-width low
                    enough to always avoid that. A scrollbar appearing on a
                    cramped tablet width is a far better failure mode than
                    silently losing access to the tasks panel. */}
                <div key={showTrash ? 'view-trash' : 'view-dashboard'} className="flex-1 flex h-full min-h-0 overflow-x-auto animate-soft-fade">

                    {showTrash ? (
                        <div className="flex-1 sm:ml-4">
                            <Suspense fallback={null}>
                                <TrashView
                                    onClose={() => {
                                        setShowTrash(false);
                                        refreshData();
                                    }}
                                />
                            </Suspense>
                        </div>
                    ) : (
                        <>
                            {/* --- BLOCK 1: AGENDA (LEFT) --- */}
                            {/* lg:min-w-[600px] here matches the <main> below —
                                without a matching min-width, this flex item's
                                own box stays pinned at exactly 55% even when
                                that's narrower than its min-width child needs,
                                and the child silently overflows past this
                                box's right edge (no overflow-hidden here) and
                                under BLOCK 2 (see the compact-root-font-size
                                overflow this exact pairing caused before).
                                Gated to `lg` (1024px) rather than `sm` (640px)
                                — at tablet widths (~640-1024px) Sidebar(280px)
                                + a 700px-or-more floor left BLOCK 2 almost no
                                room at all, which the `sm` version still let
                                happen. Below `lg`, the column just uses its
                                55% share with no hard floor and the calendar
                                renders more compactly — its own cells already
                                scale down at the `sm` breakpoint, so this
                                isn't a cliff, just less spacious. */}
                            <div className={`${mobileView === "agenda" ? "flex" : "hidden"} sm:flex
                                w-full h-full sm:h-auto sm:transition-all sm:duration-500 sm:ease-in-out flex-col overflow-hidden shrink-0 ${
                                showCalendar ? "sm:w-[55%] lg:min-w-[600px] sm:opacity-100 sm:ml-4" : "sm:w-0 sm:min-w-0 sm:opacity-0 sm:ml-0"
                            }`}>
                                <main className="w-full h-full relative flex flex-col min-w-0 lg:min-w-[600px]">
                                    <AgendaView
                                        subjects={subjects}
                                        onCreateTask={handleCalendarCreateTask}
                                        onUpdateTask={handleCalendarUpdateTask}
                                        onDeleteTask={handleCalendarDeleteTask}
                                        onToggleTask={handleToggleTask}
                                    />
                                </main>
                            </div>

                            {/* --- BLOCK 2: TASKS (CENTER) --- */}
                        <div className={`${mobileView === "tasks" ? "flex" : "hidden"} sm:flex flex-1 rounded-2xl bg-white dark:bg-gray-900 shadow-md flex-col overflow-y-auto transition-colors duration-500 ease-in-out sm:ml-4`}>
                            <div className="p-4 sm:p-6 mx-auto w-full max-w-4xl transition-all duration-500 ease-in-out">

                                {/* TASKS HEADER + FOCUS MODE BUTTON */}
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">{ getGreeting(username) }</h1>
                                        <p className="text-gray-500 dark:text-gray-500 mt-1 capitalize">{today}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            {totalPending === 0 ? (
                                                <>
                                                    {t.noPendingTasks} <Coffee size={16} />
                                                </>
                                            ) : (
                                                <span>&nbsp;</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 shrink-0 mt-1">
                                        {/* Always-visible access to the last SmartCheck plan — lives
                                            here (not just inside the collapsible Sidebar section) so
                                            it stays reachable even when the sidebar is collapsed. */}
                                        {aiPlanData && (
                                            <button
                                                onClick={handleOpenAiModal}
                                                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border shrink-0 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title={t.viewLastPlan}
                                            >
                                                <Eye size={18} strokeWidth={2.5} />
                                                <span className="hidden xl:inline">{t.viewLastPlan}</span>
                                                {aiNotificationReady && (
                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                                                )}
                                            </button>
                                        )}

                                        {/* Focus mode is a desktop-only concept — mobile switches
                                            between Agenda/Tasks/Progress via the bottom tab bar instead. */}
                                        <button
                                            onClick={() => setShowCalendar(!showCalendar)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border shrink-0 ${
                                                showCalendar
                                                    ? "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-sm"
                                            }`}
                                            title={showCalendar ? t.hideAgendaTitle : t.showAgendaTitle}
                                        >
                                            {showCalendar ? <Focus size={18} strokeWidth={2.5} /> : <LayoutGrid size={18} strokeWidth={2.5} />}
                                            <span className="hidden xl:inline">
                                                {showCalendar ? t.focusMode : t.viewCalendar}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Client-side search over subject names and task titles —
                                    filters the list below and OverdueSection together via
                                    filteredSubjects, computed once above. */}
                                <div className="relative mb-6">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500 pointer-events-none" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t.searchPlaceholder}
                                        className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl text-sm focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-400 dark:focus:border-red-500 transition-all duration-300"
                                    />
                                    {searchQuery ? (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            title={t.searchClear}
                                            aria-label={t.searchClear}
                                        >
                                            <X size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setPaletteOpen(true)}
                                            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] font-semibold text-gray-500 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                            title={t.palettePlaceholder}
                                        >
                                            {isMac ? "⌘" : "Ctrl"}K
                                        </button>
                                    )}
                                </div>

                                {/* Bulk task actions toggle / active selection toolbar */}
                                {subjects.length > 0 && (
                                    <div className="flex items-center justify-between mb-4 min-h-[36px]">
                                        {selectionMode ? (
                                            <>
                                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    {selectedTaskKeys.size === 1 ? t.tasksSelectedOne : `${selectedTaskKeys.size} ${t.tasksSelectedMany}`}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={exitSelectionMode}
                                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                    >
                                                        {t.cancelSelection}
                                                    </button>
                                                    <button
                                                        onClick={handleBulkComplete}
                                                        disabled={selectedTaskKeys.size === 0}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                                    >
                                                        <Check size={14} /> {t.bulkComplete}
                                                    </button>
                                                    <button
                                                        onClick={handleBulkDelete}
                                                        disabled={selectedTaskKeys.size === 0}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                                    >
                                                        <Trash2 size={14} /> {t.bulkDelete}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Only rendered at all when there's something to show —
                                                    zero footprint for the common case of no archived
                                                    subjects, per the user's "shouldn't get in the way"
                                                    request. Opens a popover (ArchivedSubjectsPopover)
                                                    rather than a dedicated screen or a permanent Settings
                                                    section, which is where this used to live. */}
                                                {archivedSubjects.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setArchivedPopoverOpen(o => !o)}
                                                            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                                        >
                                                            <Archive size={16} />
                                                            {archivedSubjects.length} {archivedSubjects.length === 1 ? t.archivedTrigger : t.archivedTriggerPlural}
                                                        </button>
                                                        {archivedPopoverOpen && (
                                                            <ArchivedSubjectsPopover
                                                                subjects={archivedSubjects}
                                                                onRestore={handleArchiveSubject}
                                                                onClose={() => setArchivedPopoverOpen(false)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSortByPriority(v => !v)}
                                                    aria-pressed={sortByPriority}
                                                    title={t.ttSortByPriority}
                                                    className={`ml-auto mr-4 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                                                        sortByPriority
                                                            ? "text-red-600 dark:text-red-400"
                                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                                    }`}
                                                >
                                                    <ArrowUpDown size={16} /> {t.sortByPriority}
                                                </button>
                                                {/* Desktop only — on mobile, selection mode is entered by
                                                    long-pressing a task (gallery-style), so this button
                                                    would just be redundant chrome cramped next to the
                                                    priority-sort button above. */}
                                                <button
                                                    onClick={() => setSelectionMode(true)}
                                                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                                >
                                                    <CheckSquare size={16} /> {t.selectTasks}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {searchQuery && filteredSubjects.filter(subject => !subject.archived).length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                                        {t.searchNoResults} "{searchQuery}"
                                    </p>
                                )}

                                {/* First-run welcome — only for a genuinely empty account (checked
                                    against the unfiltered `subjects`, not the search-filtered list),
                                    so it never fights with the "no search results" message above. */}
                                {!searchQuery && subjects.length === 0 && (
                                    <div className="flex flex-col items-center text-center gap-3 py-8 px-6">
                                        <WelcomeIllustration className="w-28 h-28 shrink-0" />
                                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.welcomeTitle}</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{t.welcomeDesc}</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-8">
                                    {displaySubjects.filter(subject => !subject.archived).map(subject => {
                                        const isDeleting = deletingSubjects.includes(subject.id);
                                        const isAdding = addingSubjects.includes(subject.id);
                                        return (
                                            <div 
                                                key={`subject-wrapper-${subject.id}`}
                                                className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                                                    isDeleting || isAdding
                                                        ? "opacity-0 scale-95 max-h-0 !mb-[-2rem]"
                                                        : "opacity-100 scale-100 max-h-[2000px]"
                                                }`}
                                            >
                                                <SubjectSection
                                                    key={subject.id}
                                                    subject={subject}
                                                    addingTasks={addingTasks}
                                                    setOpenFormUpdateSubject={setOpenFormUpdateSubject}
                                                    openFormUpdateSubject={openFormUpdateSubject}
                                                    handleUpdateSubject={handleUpdateSubject}
                                                    handleArchiveSubject={handleArchiveSubject}
                                                    handleDeleteSubject={handleDeleteSubject}
                                                    updatedSubject={updatedSubject}
                                                    handleChangeUpdateSubject={handleChangeUpdateSubject}
                                                    handleToggleTask={handleToggleTask}
                                                    handleDeleteTask={handleDeleteTask}
                                                    setOpenFormSubjectIdTaskId={setOpenFormSubjectIdTaskId}
                                                    openFormSubjectIdTaskId={openFormSubjectIdTaskId}
                                                    handleUpdateTask={handleUpdateTask}
                                                    updatedTask={updatedTask}
                                                    handleChangeUpdateTask={handleChangeUpdateTask}
                                                    setOpenFormSubjectId={setOpenFormSubjectId}
                                                    openFormSubjectId={openFormSubjectId}
                                                    handleSubmitTask={handleSubmitTask}
                                                    newTask={newTask}
                                                    handleChangeTask={handleChangeTask}
                                                    error={error}
                                                    loading={loading}
                                                    deletingTasks={deletingTasks}
                                                    setUpdatedTask={setUpdatedTask}
                                                    setUpdatedSubject={setUpdatedSubject}
                                                    selectionMode={selectionMode}
                                                    selectedTaskKeys={selectedTaskKeys}
                                                    onToggleSelectTask={handleToggleSelectTask}
                                                    onLongPressSelectTask={handleLongPressSelectTask}
                                                />
                                            </div>
                                        );
                                    })}

                                    <button 
                                        className="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl py-4 text-sm font-medium transition-all group"
                                        onClick={() => { setOpenFormNewSubject(true); }}
                                    >
                                        <Plus size={18} className="transition-transform group-hover:scale-110" />
                                        <span>{t.addNewSubject}</span>
                                    </button>

                                    {/* Animated container for the New Subject form */}
                                    <div 
                                        className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                                            openFormNewSubject 
                                                ? "opacity-100 scale-100 max-h-[500px] mt-4" 
                                                : "opacity-0 scale-95 max-h-0 !mt-0 !mb-0" 
                                        }`}
                                    >
                                        <form onSubmit={handleSubmitSubject} className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_2px_10px_-3px_rgba(220,38,38,0.1)] dark:shadow-none transition-colors duration-300">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t.newSubjectTitle}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.newSubjectDesc}</p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col">
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.formName}</label>
                                                    <input 
                                                        type="text" 
                                                        name="name" 
                                                        value={newSubject.name} 
                                                        onChange={handleChangeSubject} 
                                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                                        required 
                                                    />
                                                </div>
                                                
                                                <div className="flex flex-col">
                                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t.formDesc} <span className="text-gray-500 dark:text-gray-500 font-normal lowercase">{t.formOptional}</span></label>
                                                    <input 
                                                        type="text" 
                                                        name="description" 
                                                        value={newSubject.description} 
                                                        onChange={handleChangeSubject} 
                                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 transition-all duration-200 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded-lg text-center">{error}</p>}

                                            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setOpenFormNewSubject(false) }} 
                                                    className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                                                >
                                                    {t.btnCancel}
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    disabled={loading} 
                                                    className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                                >
                                                    {t.btnSaveSubject}
                                                </button>
                                            </div>
                                        </form>
                                    </div>   
                                </div>

                                <OverdueSection
                                    subjects={displaySubjects}
                                    totalPendingOverdue={totalPendingOverdue}
                                    handleToggleTask={handleToggleTask}
                                    handleDeleteTask={handleDeleteTask}
                                    setOpenFormSubjectIdTaskId={setOpenFormSubjectIdTaskId}
                                    openFormSubjectIdTaskId={openFormSubjectIdTaskId}
                                    handleUpdateTask={handleUpdateTask}
                                    updatedTask={updatedTask}
                                    handleChangeUpdateTask={handleChangeUpdateTask}
                                    setUpdatedTask={setUpdatedTask}
                                    deletingTasks={deletingTasks} 
                                />
                            </div>
                        </div>

                        {/* --- BLOCK 3: PERFORMANCE PANEL WITH HEATMAP (ONLY IN FOCUS MODE) --- */}
                        <div className={`${mobileView === "performance" ? "flex" : "hidden"} sm:flex
                            w-full h-full sm:h-auto sm:transition-all sm:duration-500 sm:ease-in-out flex-col overflow-hidden shrink-0 ${
                                showCalendar ? "sm:w-0 sm:opacity-0 sm:ml-0" : "sm:w-[350px] sm:opacity-100 sm:ml-4"
                            }`}>
                            <div className="w-full sm:w-[350px] h-full bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 sm:p-6 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden transition-colors duration-500">
                                
                                <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-gray-800 pb-4 transition-colors">
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                        <LayoutGrid size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.perfTitle}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">{t.perfSubtitle}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <ProgressHeatmap />
                                </div>

                                {/* Motivational block — desktop only (never shown on
                                    mobile). Dismissible via the close button; stays
                                    dismissed (sessionStorage) until the next login. */}
                                <div className={`hidden sm:block overflow-hidden shrink-0 transition-all duration-500 ease-in-out ${
                                    focusTipDismissed
                                        ? "max-h-0 opacity-0 mt-0"
                                        : "max-h-[240px] opacity-100 mt-8"
                                }`}>
                                    <div className="relative p-5 pr-10 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-100/50 dark:border-green-900/50 shadow-sm transition-colors duration-500">
                                        <button
                                            onClick={handleDismissFocusTip}
                                            className="absolute top-3 right-3 p-1 rounded-lg text-green-700/60 dark:text-green-500/60 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-100/60 dark:hover:bg-green-900/40 transition-colors"
                                            title={t.dismissFocusTip}
                                            aria-label={t.dismissFocusTip}
                                        >
                                            <X size={14} />
                                        </button>
                                        <h4 className="text-green-800 dark:text-green-400 font-bold text-sm mb-2 flex items-center gap-2">
                                            <Check size={16} />
                                            {t.focusActiveTitle}
                                        </h4>
                                        <p className="text-[13px] text-green-700/80 dark:text-green-500/80 font-medium leading-relaxed">
                                            {t.focusActiveDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <Suspense fallback={null}>
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        handleDeleteAccount={handleDeleteAccount}
                        userEmail={userEmail}
                        remindersEnabled={remindersEnabled}
                        onToggleReminders={handleToggleReminders}
                        taskFeedbackEnabled={taskFeedbackEnabled}
                        onToggleTaskFeedback={handleToggleTaskFeedback}
                        onOpenFeedback={handleOpenFeedback}
                    />
                </Suspense>

                <Suspense fallback={null}>
                    <SmartCheckModal
                        isOpen={isAiModalOpen}
                        onClose={() => setIsAiModalOpen(false)}
                        aiData={aiPlanData}
                        subjects={subjects}
                    />
                </Suspense>

                <Suspense fallback={null}>
                    <CommandPalette
                        isOpen={paletteOpen}
                        onClose={() => setPaletteOpen(false)}
                        actions={paletteActions}
                        subjects={subjects}
                        onSelectTask={handleOpenTaskEditor}
                        onSelectSubject={handleSelectSubjectFromPalette}
                        placeholder={t.palettePlaceholder}
                        subjectsGroupLabel={t.paletteSubjectsGroup}
                        tasksGroupLabel={t.paletteTasksGroup}
                        actionsGroupLabel={t.paletteActionsGroup}
                        emptyLabel={t.paletteEmpty}
                        taskCountOneLabel={t.paletteTaskCountOne}
                        taskCountManyLabel={t.paletteTaskCountMany}
                        moreTasksLabel={t.paletteMoreTasks}
                    />
                </Suspense>

                <Suspense fallback={null}>
                    <OnboardingTour isOpen={showOnboarding} onClose={handleCloseOnboarding} />
                </Suspense>

                <Suspense fallback={null}>
                    <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
                </Suspense>
            </div>

            {/* --- MOBILE BOTTOM TAB BAR --- */}
            {!showTrash && (
                <div className="sm:hidden relative shrink-0 mt-2 grid grid-cols-3 gap-1 p-1.5 rounded-2xl bg-white dark:bg-gray-900 shadow-md">
                    {/* Sliding pill background, same pattern as AgendaView's
                        Day/Week/Month selector — one animated layer that
                        glides in multiples of 1/3 instead of each button
                        toggling its own background. */}
                    <div
                        aria-hidden="true"
                        className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-red-50 dark:bg-red-900/30 transition-transform duration-300 ease-out"
                        style={{
                            width: "calc((100% - 0.75rem) / 3)",
                            transform: `translateX(${MOBILE_TAB_ORDER.indexOf(mobileView) * 100}%)`,
                        }}
                    />
                    {([
                        { id: "tasks", label: t.tabTasks, icon: ListChecks },
                        { id: "agenda", label: t.tabAgenda, icon: Calendar },
                        { id: "performance", label: t.tabPerformance, icon: BarChart3 },
                    ] as const).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setMobileView(id)}
                            className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-[color,transform] ${
                                mobileView === id
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500 dark:text-gray-500"
                            }`}
                        >
                            <Icon size={20} strokeWidth={2.5} />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
        </PageTransition>
    );
};

export default DashboardPage;