import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { isAxiosError } from "axios";
import { ArrowLeft, Gauge, Bug, Lightbulb, Heart, MoreHorizontal, Mail, Loader2, ShieldOff, Inbox, RefreshCw, BellRing, ChevronUp, StickyNote, Server } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { axisTicks } from "../utils/chartTicks";
import { getAdminFeedback, getAiUsage, getSystemStatus, getUserStats, notifyFeedbackAuthor, updateAdminFeedback } from "../api/adminApi";
import type { AdminFeedback, AiUsageStats, FeedbackCategory, FeedbackStatus, SystemStatus, UserStats } from "../types";

// --- Translation dictionary for DeveloperPage ---
const translations = {
    es: {
        title: "Panel de desarrollador",
        subtitle: "Solo visible para ti — feedback de usuarios y uso de SmartCheck AI",
        back: "Volver al dashboard",
        refresh: "Actualizar",
        noAccessTitle: "Sin acceso",
        noAccessDesc: "Esta sección es solo para el desarrollador de RedCheck.",
        errLoad: "No se pudieron cargar los datos del panel.",
        errSave: "No se pudo guardar el cambio.",
        saved: "Guardado",
        period: "Periodo",
        usersSection: "Usuarios",
        kpiTotalUsers: "Usuarios",
        kpiSeenToday: "Activos hoy",
        kpiSeen7d: "Activos · 7 días",
        kpiSeen30d: "Activos · 30 días",
        kpiActing7d: "Usan la app · 7 días",
        kpiActing30d: "Usan la app · 30 días",
        kpiNewUsers: "Altas en el periodo",
        kpiStickiness: "Vuelven (7 / 30 días)",
        usersChartTitle: "Usuarios que usan la app por día",
        colUsing: "Usan la app",
        colSignups: "Altas",
        usersFootnote: (google: number, total: number) =>
            `«Activos» = han abierto la app (se registra desde que se desplegó esta versión). «Usan la app» = han completado o creado alguna tarea, con histórico completo. Sin cuentas demo ni la tuya. ${google} de ${total} entran con Google.`,
        systemSection: "Sistema",
        sysBackend: "Backend",
        sysFrontend: "Frontend",
        sysAiEngine: "Motor SmartCheck AI",
        sysUp: "Operativo",
        sysDown: "Sin respuesta",
        sysBuilt: "Compilado",
        sysCommit: "Commit",
        sysUptime: "En marcha",
        sysMemory: "Memoria",
        sysUnknown: "desconocido",
        // Local/compose builds don't get a commit (only CI passes GIT_SHA).
        sysLocalBuild: "build local",
        sysLatency: "Respuesta",
        aiSection: "SmartCheck AI",
        lastDays: (n: number) => `Últimos ${n} días`,
        kpiToday: "Análisis hoy",
        kpiPeriod: "Análisis en el periodo",
        kpiFailRate: "Tasa de fallo",
        kpiAvgDuration: "Duración media",
        aiFootnote: (users: number, outcomes: number) =>
            `${users} ${users === 1 ? "usuario distinto" : "usuarios distintos"} · ${outcomes} resultados de tarea enviados (1 embedding cada uno). Cada análisis cuesta 1–3 llamadas a Gemini + 1 embedding.`,
        chartTitle: "Análisis por día",
        showTable: "Ver como tabla",
        hideTable: "Ver gráfico",
        colDate: "Día",
        colAnalyses: "Análisis",
        colOutcomes: "Resultados",
        colFailed: "Fallos",
        feedbackSection: "Feedback",
        all: "Todos",
        allCategories: "Todas",
        status: { NEW: "Nuevo", SEEN: "Visto", IN_PROGRESS: "En curso", DONE: "Hecho", WONTFIX: "Descartado" } as Record<FeedbackStatus, string>,
        category: { BUG: "Bug", SUGGESTION: "Sugerencia", PRAISE: "Opinión", OTHER: "Otro" } as Record<FeedbackCategory, string>,
        deletedUser: "Cuenta eliminada",
        emptyFeedback: "No hay feedback con estos filtros.",
        note: "Nota interna",
        notePlaceholder: "Solo la ves tú...",
        saveNote: "Guardar nota",
        reply: "Responder por email",
        replySubject: "Sobre tu feedback en RedCheck",
        notePreview: "Nota interna:",
        collapse: "Cerrar",
        alsoEmail: "Enviar también por email",
        alsoEmailHint: "Desde no-reply@redcheckapp.com, con su mensaje original citado.",
        notifyTitle: "Notificar en la app",
        notifyHint: "Le aparecerá en la campana de notificaciones.",
        notifySend: "Enviar notificación",
        notifySent: "Notificación enviada",
        notifiedOn: (date: string) => `Notificado el ${date}`,
        errNotify: "No se pudo enviar la notificación.",
        // Prefilled per status; always editable before sending.
        notifyTemplate: {
            DONE: "¡Gracias por tu feedback! Ya está resuelto en RedCheck.",
            IN_PROGRESS: "¡Gracias por tu feedback! Ya estamos trabajando en ello.",
            WONTFIX: "¡Gracias por tu feedback! Lo hemos valorado, pero de momento no lo vamos a incluir.",
            DEFAULT: "¡Gracias por tu feedback! Lo hemos recibido y lo estamos revisando.",
        },
    },
    en: {
        title: "Developer dashboard",
        subtitle: "Only visible to you — user feedback and SmartCheck AI usage",
        back: "Back to dashboard",
        refresh: "Refresh",
        noAccessTitle: "No access",
        noAccessDesc: "This section is only for RedCheck's developer.",
        errLoad: "Couldn't load the dashboard data.",
        errSave: "Couldn't save the change.",
        saved: "Saved",
        period: "Period",
        usersSection: "Users",
        kpiTotalUsers: "Users",
        kpiSeenToday: "Active today",
        kpiSeen7d: "Active · 7 days",
        kpiSeen30d: "Active · 30 days",
        kpiActing7d: "Using the app · 7 days",
        kpiActing30d: "Using the app · 30 days",
        kpiNewUsers: "Sign-ups in period",
        kpiStickiness: "Coming back (7 / 30 days)",
        usersChartTitle: "Users using the app per day",
        colUsing: "Using the app",
        colSignups: "Sign-ups",
        usersFootnote: (google: number, total: number) =>
            `"Active" = opened the app (recorded since this version was deployed). "Using the app" = completed or created a task, with full history. Demo accounts and yours are excluded. ${google} of ${total} sign in with Google.`,
        systemSection: "System",
        sysBackend: "Backend",
        sysFrontend: "Frontend",
        sysAiEngine: "SmartCheck AI engine",
        sysUp: "Up",
        sysDown: "Not responding",
        sysBuilt: "Built",
        sysCommit: "Commit",
        sysUptime: "Uptime",
        sysMemory: "Memory",
        sysUnknown: "unknown",
        sysLocalBuild: "local build",
        sysLatency: "Response",
        aiSection: "SmartCheck AI",
        lastDays: (n: number) => `Last ${n} days`,
        kpiToday: "Analyses today",
        kpiPeriod: "Analyses in period",
        kpiFailRate: "Failure rate",
        kpiAvgDuration: "Avg. duration",
        aiFootnote: (users: number, outcomes: number) =>
            `${users} distinct ${users === 1 ? "user" : "users"} · ${outcomes} task outcomes sent (1 embedding each). Each analysis costs 1–3 Gemini calls + 1 embedding.`,
        chartTitle: "Analyses per day",
        showTable: "Show as table",
        hideTable: "Show chart",
        colDate: "Day",
        colAnalyses: "Analyses",
        colOutcomes: "Outcomes",
        colFailed: "Failed",
        feedbackSection: "Feedback",
        all: "All",
        allCategories: "All",
        status: { NEW: "New", SEEN: "Seen", IN_PROGRESS: "In progress", DONE: "Done", WONTFIX: "Won't fix" } as Record<FeedbackStatus, string>,
        category: { BUG: "Bug", SUGGESTION: "Suggestion", PRAISE: "Feedback", OTHER: "Other" } as Record<FeedbackCategory, string>,
        deletedUser: "Deleted account",
        emptyFeedback: "No feedback matches these filters.",
        note: "Internal note",
        notePlaceholder: "Only you can see this...",
        saveNote: "Save note",
        reply: "Reply by email",
        replySubject: "About your RedCheck feedback",
        notePreview: "Internal note:",
        collapse: "Close",
        alsoEmail: "Also send by email",
        alsoEmailHint: "From no-reply@redcheckapp.com, quoting their original message.",
        notifyTitle: "Notify in the app",
        notifyHint: "It will show up in their notifications bell.",
        notifySend: "Send notification",
        notifySent: "Notification sent",
        notifiedOn: (date: string) => `Notified on ${date}`,
        errNotify: "Couldn't send the notification.",
        notifyTemplate: {
            DONE: "Thanks for your feedback! It's now resolved in RedCheck.",
            IN_PROGRESS: "Thanks for your feedback! We're already working on it.",
            WONTFIX: "Thanks for your feedback! We considered it, but it won't be included for now.",
            DEFAULT: "Thanks for your feedback! We've received it and are looking into it.",
        },
    }
};

const WINDOW_OPTIONS = [7, 30, 90] as const;
// Notification.message is a VARCHAR(255) on the backend.
const NOTIFY_MAX_LENGTH = 255;

const notifyTemplateFor = (status: FeedbackStatus, t: typeof translations.es) =>
    status === "DONE" || status === "IN_PROGRESS" || status === "WONTFIX" ? t.notifyTemplate[status] : t.notifyTemplate.DEFAULT;
const STATUSES: FeedbackStatus[] = ["NEW", "SEEN", "IN_PROGRESS", "DONE", "WONTFIX"];
const CATEGORIES: FeedbackCategory[] = ["BUG", "SUGGESTION", "PRAISE", "OTHER"];

// Same per-category accents as FeedbackModal's chips, so a category reads the
// same on both sides of the feature.
const CATEGORY_STYLES: Record<FeedbackCategory, { icon: typeof Bug; className: string }> = {
    BUG: { icon: Bug, className: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
    SUGGESTION: { icon: Lightbulb, className: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
    PRAISE: { icon: Heart, className: "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400" },
    OTHER: { icon: MoreHorizontal, className: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
};

// Status pills are UI state, always shown with their text label.
const STATUS_STYLES: Record<FeedbackStatus, string> = {
    NEW: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    SEEN: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
    IN_PROGRESS: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    DONE: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    WONTFIX: "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 line-through",
};

const chipClass = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active
        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"}`;

const formatDuration = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);

const StatTile = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 min-w-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</span>
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
);

// One column per day. Shared by the users and AI sections.
interface ChartPoint {
    date: string; // "YYYY-MM-DD"
    value: number;
    details: ReactNode; // extra tooltip line(s) under the value
}

const fmtDay = (iso: string, language: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" });

// Single-series column chart. Each column is its own hover/focus target;
// the table view (DataTable) carries every value without hovering.
const ColumnChart = ({ points, valueLabel, language }: { points: ChartPoint[]; valueLabel: string; language: string }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const ticks = axisTicks(Math.max(...points.map(p => p.value)));
    const top = ticks[0];
    const active = hovered !== null ? points[hovered] : null;

    return (
        <div className="relative">
            <div className="flex gap-2">
                <div className="flex flex-col justify-between h-40 text-[10px] tabular-nums text-gray-400 dark:text-gray-500 text-right w-6 shrink-0 -my-1.5">
                    {ticks.map(tick => <span key={tick}>{tick}</span>)}
                </div>
                <div className="relative flex-1 h-40 min-w-0">
                    {/* Hairline gridlines */}
                    {[0, 50, 100].map(pct => (
                        <div key={pct} className="absolute inset-x-0 border-t border-gray-100 dark:border-gray-800" style={{ top: `${pct}%` }} />
                    ))}
                    <div className="absolute inset-0 flex items-end gap-[2px]" onPointerLeave={() => setHovered(null)}>
                        {points.map((point, i) => (
                            <button
                                key={point.date}
                                type="button"
                                aria-label={`${fmtDay(point.date, language)}: ${point.value} ${valueLabel}`}
                                onPointerEnter={() => setHovered(i)}
                                onFocus={() => setHovered(i)}
                                onBlur={() => setHovered(null)}
                                className="flex-1 h-full flex items-end justify-center focus:outline-none group"
                            >
                                <span
                                    className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${point.value === 0 ? "" : "bg-[#2a78d6] dark:bg-[#3987e5]"} ${hovered !== null && hovered !== i ? "opacity-60" : ""} group-focus-visible:ring-2 group-focus-visible:ring-gray-400`}
                                    style={{ height: `${(point.value / top) * 100}%` }}
                                />
                            </button>
                        ))}
                    </div>
                    {active && hovered !== null && (
                        <div
                            role="status"
                            className="pointer-events-none absolute -top-2 z-10 -translate-y-full -translate-x-1/2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md px-3 py-2 text-xs whitespace-nowrap"
                            style={{ left: `${Math.min(85, Math.max(15, ((hovered + 0.5) / points.length) * 100))}%` }}
                        >
                            <p className="text-gray-500 dark:text-gray-400 mb-1">{fmtDay(active.date, language)}</p>
                            <p className="flex items-center gap-2">
                                <span className="inline-block w-3 h-0.5 rounded bg-[#2a78d6] dark:bg-[#3987e5]" />
                                <strong className="text-gray-900 dark:text-gray-100">{active.value}</strong>
                                <span className="text-gray-500 dark:text-gray-400">{valueLabel}</span>
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{active.details}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between pl-8 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                <span>{fmtDay(points[0].date, language)}</span>
                <span>{fmtDay(points[points.length - 1].date, language)}</span>
            </div>
        </div>
    );
};

// Table view of a chart's data, newest first. First column is the date.
const DataTable = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <tr>
                    {headers.map((header, i) => (
                        <th key={header} className={`font-medium px-3 py-2 ${i === 0 ? "text-left" : "text-right"}`}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
                {[...rows].reverse().map(row => (
                    <tr key={String(row[0])} className="border-t border-gray-100 dark:border-gray-800">
                        {row.map((cell, i) => (
                            <td key={i} className={`px-3 py-1.5 ${i === 0 ? "" : "text-right"}`}>{cell}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Chart with a "show as table" toggle and a title — the same block in the
// users and AI sections.
const ChartBlock = ({ title, subtitle, points, valueLabel, tableHeaders, tableRows, language, t }: {
    title: string;
    subtitle: string;
    points: ChartPoint[];
    valueLabel: string;
    tableHeaders: string[];
    tableRows: (string | number)[][];
    language: string;
    t: typeof translations.es;
}) => {
    const [showTable, setShowTable] = useState(false);
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {title} <span className="text-gray-400 dark:text-gray-500 font-normal">· {subtitle}</span>
                </h3>
                <button type="button" onClick={() => setShowTable(v => !v)} className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline-offset-2 hover:underline">
                    {showTable ? t.hideTable : t.showTable}
                </button>
            </div>
            {showTable
                ? <DataTable headers={tableHeaders} rows={tableRows} />
                : <ColumnChart points={points} valueLabel={valueLabel} language={language} />}
        </div>
    );
};

const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SystemRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 border-t first:border-t-0 border-gray-100 dark:border-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 text-right min-w-0 break-words">{children}</span>
    </div>
);

// Smooth height animation for content that opens/closes, in both
// directions: animating grid-template-rows 0fr↔1fr transitions to the
// content's real height without measuring it (a plain height/max-height
// transition can't target "auto"). Content stays mounted so closing animates
// too; `inert` + aria-hidden keep a closed section out of Tab order and the
// accessibility tree. Same easing curve as index.css's animate-soft-fade.
const Collapse = ({ open, as: Tag = "div", children }: { open: boolean; as?: "div" | "span"; children: ReactNode }) => (
    <Tag
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        inert={!open}
        aria-hidden={!open}
    >
        <Tag className="block overflow-hidden min-h-0">{children}</Tag>
    </Tag>
);

const FeedbackRow = ({ item, expanded, onToggle, onUpdate, onNotify, language, t }: {
    item: AdminFeedback;
    expanded: boolean;
    onToggle: () => void;
    onUpdate: (id: number, data: { status?: FeedbackStatus; adminNote?: string }) => Promise<boolean>;
    onNotify: (id: number, message: string, sendEmail: boolean) => Promise<boolean>;
    language: string;
    t: typeof translations.es;
}) => {
    const [note, setNote] = useState(item.adminNote ?? "");
    const [savingNote, setSavingNote] = useState(false);
    // null = untouched, so the prefilled template follows the status until
    // the developer actually edits it.
    const [notifyDraft, setNotifyDraft] = useState<string | null>(null);
    const [sendingNotify, setSendingNotify] = useState(false);
    const [alsoEmail, setAlsoEmail] = useState(false);
    const notifyMessage = notifyDraft ?? notifyTemplateFor(item.status, t);
    const { icon: CategoryIcon, className: categoryClass } = CATEGORY_STYLES[item.category];
    const date = new Date(item.createdDate).toLocaleString(language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const noteDirty = note !== (item.adminNote ?? "");

    const handleSaveNote = async () => {
        setSavingNote(true);
        await onUpdate(item.id, { adminNote: note });
        setSavingNote(false);
    };

    const handleNotify = async () => {
        setSendingNotify(true);
        if (await onNotify(item.id, notifyMessage.trim(), alsoEmail)) {
            setNotifyDraft(null);
            setAlsoEmail(false);
        }
        setSendingNotify(false);
    };

    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" });

    return (
        <li className={`rounded-xl border transition-colors duration-300 ${expanded ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/70"}`}>
            <button type="button" onClick={onToggle} aria-expanded={expanded} className="w-full text-left p-3 sm:p-4 flex gap-3 min-w-0">
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${categoryClass}`} title={t.category[item.category]}>
                    <CategoryIcon size={15} />
                </span>
                <span className="flex-1 min-w-0">
                    {/* One-line preview and full text cross-collapse, so the
                        message grows/shrinks smoothly instead of jumping
                        between truncated and wrapped. */}
                    <span className="flex items-start gap-2 min-w-0">
                        {item.status === "NEW" && <span className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-500" aria-hidden="true" />}
                        <span className={`flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-100 ${item.status === "NEW" ? "font-semibold" : ""}`}>
                            <Collapse as="span" open={!expanded}>
                                <span className="block truncate">{item.message}</span>
                            </Collapse>
                            <Collapse as="span" open={expanded}>
                                <span className="block whitespace-pre-wrap break-words">{item.message}</span>
                            </Collapse>
                        </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate min-w-0 max-w-[14rem]">{item.userEmail ?? t.deletedUser}</span>
                        <span aria-hidden="true">·</span>
                        <span>{date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[item.status]}`}>{t.status[item.status]}</span>
                    </span>
                    {/* Saved note, shown only while collapsed — when expanded
                        it's already in the editable textarea below. */}
                    {item.adminNote && (
                        <Collapse as="span" open={!expanded}>
                            <span className="flex items-center gap-1.5 pt-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0">
                                <StickyNote size={12} className="shrink-0 text-amber-500 dark:text-amber-400" />
                                <span className="font-semibold shrink-0">{t.notePreview}</span>
                                <span className="truncate min-w-0 italic">{item.adminNote}</span>
                            </span>
                        </Collapse>
                    )}
                </span>
            </button>

            <Collapse open={expanded}>
                <div className="px-3 sm:px-4 pb-4 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(status => (
                            <button key={status} type="button" onClick={() => onUpdate(item.id, { status })} className={chipClass(item.status === status)}>
                                {t.status[status]}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor={`note-${item.id}`} className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t.note}</label>
                        <textarea
                            id={`note-${item.id}`}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            maxLength={2000}
                            rows={2}
                            placeholder={t.notePlaceholder}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-y"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSaveNote}
                            disabled={!noteDirty || savingNote}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-40 active:scale-95 transition"
                        >
                            {savingNote && <Loader2 size={14} className="animate-spin" />}
                            {t.saveNote}
                        </button>
                        {item.userEmail && (
                            <a
                                href={`mailto:${item.userEmail}?subject=${encodeURIComponent(t.replySubject)}`}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Mail size={14} />
                                {t.reply}
                            </a>
                        )}
                    </div>

                    {/* In-app reply → a FEEDBACK_REPLY notification in the
                        author's bell. Hidden once the author is gone. */}
                    {item.userEmail && (
                        <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <label htmlFor={`notify-${item.id}`} className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t.notifyTitle}</label>
                                {item.userNotifiedDate && (
                                    <span className="text-[11px] text-green-700 dark:text-green-400">{t.notifiedOn(fmtDate(item.userNotifiedDate))}</span>
                                )}
                            </div>
                            <textarea
                                id={`notify-${item.id}`}
                                value={notifyMessage}
                                onChange={e => setNotifyDraft(e.target.value)}
                                maxLength={NOTIFY_MAX_LENGTH}
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-y"
                            />
                            <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={alsoEmail}
                                    onChange={e => setAlsoEmail(e.target.checked)}
                                    className="mt-0.5 accent-red-600"
                                />
                                <span>
                                    {t.alsoEmail}
                                    <span className="block text-[11px] text-gray-400 dark:text-gray-500">{t.alsoEmailHint}</span>
                                </span>
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[11px] text-gray-400 dark:text-gray-500">{t.notifyHint} · {notifyMessage.length}/{NOTIFY_MAX_LENGTH}</span>
                                <button
                                    type="button"
                                    onClick={handleNotify}
                                    disabled={sendingNotify || notifyMessage.trim().length === 0}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:shadow-md hover:shadow-red-600/20 disabled:opacity-40 active:scale-95 transition"
                                >
                                    {sendingNotify ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                                    {t.notifySend}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onToggle}
                        className="self-center flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronUp size={14} />
                        {t.collapse}
                    </button>
                </div>
            </Collapse>
        </li>
    );
};

const DeveloperPage = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const [days, setDays] = useState<number>(30);
    const [usage, setUsage] = useState<AiUsageStats | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [system, setSystem] = useState<SystemStatus | null>(null);
    const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "ALL">("ALL");
    const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "ALL">("ALL");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const loadAll = useCallback(async (windowDays: number) => {
        setLoading(true);
        try {
            const [usageData, userData, feedbackData] = await Promise.all([
                getAiUsage(windowDays), getUserStats(windowDays), getAdminFeedback(),
            ]);
            setUsage(usageData);
            setUserStats(userData);
            setFeedback(feedbackData);
            // Separate and non-fatal: it pings the AI engine (up to ~3s), so
            // it must neither block nor fail the rest of the page.
            getSystemStatus().then(setSystem).catch(() => setSystem(null));
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 403) {
                setForbidden(true);
            } else {
                toast.error(t.errLoad);
            }
        } finally {
            setLoading(false);
        }
    }, [t.errLoad]);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login");
            return;
        }
        loadAll(days);
    }, [days, loadAll, navigate]);

    const handleUpdate = async (id: number, data: { status?: FeedbackStatus; adminNote?: string }) => {
        try {
            const updated = await updateAdminFeedback(id, data);
            setFeedback(prev => prev.map(item => (item.id === id ? updated : item)));
            if (data.adminNote !== undefined) toast.success(t.saved);
            return true;
        } catch {
            toast.error(t.errSave);
            return false;
        }
    };

    const handleNotify = async (id: number, message: string, sendEmail: boolean) => {
        try {
            const updated = await notifyFeedbackAuthor(id, message, sendEmail, language);
            setFeedback(prev => prev.map(item => (item.id === id ? updated : item)));
            toast.success(t.notifySent);
            return true;
        } catch {
            toast.error(t.errNotify);
            return false;
        }
    };

    // Opening an unread entry marks it as seen — that's what keeps the
    // "New" count meaningful without a separate "mark as read" step.
    const handleToggle = (item: AdminFeedback) => {
        const opening = expandedId !== item.id;
        setExpandedId(opening ? item.id : null);
        if (opening && item.status === "NEW") {
            handleUpdate(item.id, { status: "SEEN" });
        }
    };

    // The expanded entry stays visible even once it stops matching the
    // filter (e.g. opening one under "New" flips it to SEEN), so it doesn't
    // vanish mid-edit.
    const visibleFeedback = useMemo(() => feedback.filter(item =>
        item.id === expandedId || (
            (statusFilter === "ALL" || item.status === statusFilter)
            && (categoryFilter === "ALL" || item.category === categoryFilter)
        )
    ), [feedback, statusFilter, categoryFilter, expandedId]);

    const countByStatus = useMemo(() => {
        const counts = {} as Record<FeedbackStatus, number>;
        STATUSES.forEach(status => { counts[status] = 0; });
        feedback.forEach(item => { counts[item.status] += 1; });
        return counts;
    }, [feedback]);

    const stickiness = userStats && userStats.seen30d > 0 ? `${Math.round((userStats.seen7d / userStats.seen30d) * 100)}%` : "—";
    const fmtInstant = (iso: string | null) => iso
        ? new Date(iso).toLocaleString(language === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : t.sysUnknown;
    // "commit abc1234", or "local build" when the image wasn't built by CI.
    const commitLabel = (sha: string) => (sha && sha !== "unknown" ? `${t.sysCommit.toLowerCase()} ${sha.slice(0, 7)}` : t.sysLocalBuild);

    const totalCalls = usage ? usage.totalPrioritizeCalls + usage.totalOutcomeCalls : 0;
    const failRate = usage && totalCalls > 0 ? `${((usage.failedCalls / totalCalls) * 100).toFixed(1)}%` : "0%";

    if (forbidden) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 dark:bg-gray-950 text-center">
                <ShieldOff size={40} className="text-gray-300 dark:text-gray-700" />
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{t.noAccessTitle}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{t.noAccessDesc}</p>
                <button type="button" onClick={() => navigate("/dashboard")} className="mt-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
                    {t.back}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4 py-6 sm:p-8 flex flex-col gap-6">
                <header className="flex items-start gap-3 sm:gap-4">
                    <button type="button" onClick={() => navigate("/dashboard")} aria-label={t.back} title={t.back} className="shrink-0 p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 text-red-600 dark:text-red-500">
                            <Gauge size={24} className="shrink-0" />
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate min-w-0">{t.title}</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{t.subtitle}</p>
                    </div>
                    {system && (
                        <span className="hidden sm:flex shrink-0 items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
                            <span className={`w-2 h-2 rounded-full ${system.aiEngineReachable ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
                            AI {system.aiEngineReachable ? t.sysUp.toLowerCase() : t.sysDown.toLowerCase()}
                            <span className="text-gray-400 dark:text-gray-500">· {commitLabel(system.gitSha)}</span>
                        </span>
                    )}
                    <button type="button" onClick={() => loadAll(days)} disabled={loading} aria-label={t.refresh} title={t.refresh} className="shrink-0 p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-40">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </header>

                {/* One period selector for every chart on the page. */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.period}</span>
                    {WINDOW_OPTIONS.map(option => (
                        <button key={option} type="button" onClick={() => setDays(option)} className={chipClass(days === option)}>
                            {option}d
                        </button>
                    ))}
                </div>

                {/* Users */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 flex flex-col gap-5">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.usersSection}</h2>
                    {!userStats ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                            </div>
                            <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatTile label={t.kpiTotalUsers} value={userStats.totalUsers.toLocaleString()} />
                                <StatTile label={t.kpiSeenToday} value={userStats.seenToday.toLocaleString()} />
                                <StatTile label={t.kpiSeen7d} value={userStats.seen7d.toLocaleString()} />
                                <StatTile label={t.kpiSeen30d} value={userStats.seen30d.toLocaleString()} />
                                <StatTile label={t.kpiActing7d} value={userStats.acting7d.toLocaleString()} />
                                <StatTile label={t.kpiActing30d} value={userStats.acting30d.toLocaleString()} />
                                <StatTile label={t.kpiNewUsers} value={userStats.newUsers.toLocaleString()} />
                                <StatTile label={t.kpiStickiness} value={stickiness} />
                            </div>
                            <ChartBlock
                                title={t.usersChartTitle}
                                subtitle={t.lastDays(userStats.days)}
                                points={userStats.daily.map(day => ({
                                    date: day.date,
                                    value: day.actingUsers,
                                    details: <><strong className="text-gray-900 dark:text-gray-100">{day.signups}</strong> {t.colSignups.toLowerCase()}</>,
                                }))}
                                valueLabel={t.colUsing.toLowerCase()}
                                tableHeaders={[t.colDate, t.colUsing, t.colSignups]}
                                tableRows={userStats.daily.map(day => [day.date, day.actingUsers, day.signups])}
                                language={language}
                                t={t}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.usersFootnote(userStats.googleUsers, userStats.totalUsers)}</p>
                        </>
                    )}
                </section>

                {/* SmartCheck AI usage */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 flex flex-col gap-5">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.aiSection}</h2>

                    {!usage ? (
                        <div className="animate-pulse flex flex-col gap-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                            </div>
                            <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatTile label={t.kpiToday} value={usage.todayPrioritizeCalls.toLocaleString()} />
                                <StatTile label={t.kpiPeriod} value={usage.totalPrioritizeCalls.toLocaleString()} />
                                <StatTile label={t.kpiFailRate} value={failRate} />
                                <StatTile label={t.kpiAvgDuration} value={formatDuration(usage.avgPrioritizeDurationMs)} />
                            </div>

                            <ChartBlock
                                title={t.chartTitle}
                                subtitle={t.lastDays(usage.days)}
                                points={usage.daily.map(day => ({
                                    date: day.date,
                                    value: day.prioritizeCalls,
                                    details: <><strong className="text-gray-900 dark:text-gray-100">{day.outcomeCalls}</strong> {t.colOutcomes.toLowerCase()} · <strong className="text-gray-900 dark:text-gray-100">{day.failedCalls}</strong> {t.colFailed.toLowerCase()}</>,
                                }))}
                                valueLabel={t.colAnalyses.toLowerCase()}
                                tableHeaders={[t.colDate, t.colAnalyses, t.colOutcomes, t.colFailed]}
                                tableRows={usage.daily.map(day => [day.date, day.prioritizeCalls, day.outcomeCalls, day.failedCalls])}
                                language={language}
                                t={t}
                            />

                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiFootnote(usage.distinctUsers, usage.totalOutcomeCalls)}</p>
                        </>
                    )}
                </section>

                {/* Feedback inbox */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 flex flex-col gap-4">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.feedbackSection} <span className="text-gray-400 dark:text-gray-500 font-normal normal-case tracking-normal">· {feedback.length}</span>
                    </h2>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                            <button type="button" onClick={() => setStatusFilter("ALL")} className={chipClass(statusFilter === "ALL")}>{t.all}</button>
                            {STATUSES.map(status => (
                                <button key={status} type="button" onClick={() => setStatusFilter(status)} className={chipClass(statusFilter === status)}>
                                    {t.status[status]} <span className="opacity-60">{countByStatus[status]}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                            <button type="button" onClick={() => setCategoryFilter("ALL")} className={chipClass(categoryFilter === "ALL")}>{t.allCategories}</button>
                            {CATEGORIES.map(category => (
                                <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={chipClass(categoryFilter === category)}>
                                    {t.category[category]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading && feedback.length === 0 ? (
                        <div className="animate-pulse flex flex-col gap-2">
                            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
                        </div>
                    ) : visibleFeedback.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                            <Inbox size={32} className="text-gray-300 dark:text-gray-700" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.emptyFeedback}</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {visibleFeedback.map(item => (
                                <FeedbackRow
                                    key={item.id}
                                    item={item}
                                    expanded={expandedId === item.id}
                                    onToggle={() => handleToggle(item)}
                                    onUpdate={handleUpdate}
                                    onNotify={handleNotify}
                                    language={language}
                                    t={t}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                {/* System */}
                <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <Server size={14} /> {t.systemSection}
                    </h2>
                    {!system ? (
                        <div className="animate-pulse h-28 rounded-xl bg-gray-100 dark:bg-gray-800" />
                    ) : (
                        <div className="flex flex-col">
                            <SystemRow label={t.sysAiEngine}>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${system.aiEngineReachable ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
                                    {system.aiEngineReachable ? `${t.sysUp} · ${t.sysLatency} ${system.aiEngineLatencyMs} ms` : t.sysDown}
                                </span>
                            </SystemRow>
                            <SystemRow label={t.sysBackend}>
                                {system.version ?? t.sysUnknown} · <span className="font-mono">{commitLabel(system.gitSha)}</span> · {t.sysBuilt} {fmtInstant(system.buildTime)}
                            </SystemRow>
                            <SystemRow label={`${t.sysBackend} · ${t.sysUptime}`}>
                                {formatUptime(system.uptimeSeconds)} · {t.sysMemory} {system.memoryUsedMb} / {system.memoryMaxMb} MB · Java {system.javaVersion}
                            </SystemRow>
                            <SystemRow label={t.sysFrontend}>
                                {t.sysBuilt} {fmtInstant(__APP_BUILD_TIME__)}
                            </SystemRow>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default DeveloperPage;
