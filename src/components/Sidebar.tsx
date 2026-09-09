import { LogOut, Settings, Bell, Check, Sparkles, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, type TouchEvent } from "react";
import type { SubjectStat, SubjectWithTasks } from "../types";
import { SmartCheckButton } from "./SmartCheckButton";
import { SubjectBalance } from "./SubjectBalance";
import { useLanguage } from "../context/LanguageContext"; // <-- We import the context

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    totalPending: number;
    subjects: SubjectWithTasks[];
    onOpenSettings: () => void;
    onAiPlanClick: () => void;
    isAiLoading: boolean;
    aiNotificationReady: boolean;
    hasAiPlan: boolean;
    onOpenAiModal: () => void;
    subjectStats: SubjectStat[];
    showTrash: boolean;
    onOpenTrash: () => void;
    onGoHome: () => void;
    mobileOpen: boolean;
    onCloseMobile: () => void;
}

// Feature flags for sections hidden per product decision — not deleted so
// they can be quickly re-enabled later. See CLAUDE.md.
// SHOW_ANALYSIS_ENGINE_LABEL is back on for desktop only (per user request)
// — the label's own className now carries `hidden sm:flex` to enforce that,
// since this flag alone doesn't distinguish mobile from desktop.
const SHOW_ANALYSIS_ENGINE_LABEL = true;
const SHOW_RISK_ANALYSIS_BUTTON = false;

// --- Translation dictionary for the Sidebar ---
const translations = {
    es: {
        closeMenu: "Cerrar menú",
        openMenu: "Abrir menú",
        goHome: "Ir al inicio",
        notifications: "Notificaciones",
        markRead: "Marcar leídas",
        aiReadyTitle: "SmartCheck listo",
        aiReadyDesc: "¡Tu plan diario ya está disponible!",
        aiReadySub: "Haz clic para ver tu plan priorizado.",
        noNotifications: "No tienes notificaciones nuevas.",
        analysisEngine: "Motor de análisis",
        dailyAnalysisTitle: "Análisis Diario de Tareas",
        dailyAnalysisSub: "Genera un resumen de tus prioridades para hoy.",
        aiConsulting: "Consultando a SmartCheck...",
        riskAnalysisTitle: "Analizar riesgos",
        riskAnalysisSub: "Identifica posibles bloqueos o retrasos.",
        viewLastPlan: "Ver plan de hoy",
        trash: "Papelera",
        settings: "Ajustes",
        logout: "Cerrar sesión"
    },
    en: {
        closeMenu: "Close menu",
        openMenu: "Open menu",
        goHome: "Go to Home",
        notifications: "Notifications",
        markRead: "Mark as read",
        aiReadyTitle: "SmartCheck Ready",
        aiReadyDesc: "Your daily plan is now available!",
        aiReadySub: "Click to view your prioritized plan.",
        noNotifications: "You have no new notifications.",
        analysisEngine: "Analysis Engine",
        dailyAnalysisTitle: "Daily Task Analysis",
        dailyAnalysisSub: "Generate a summary of your priorities for today.",
        aiConsulting: "Consulting SmartCheck...",
        riskAnalysisTitle: "Analyze Risks",
        riskAnalysisSub: "Identify potential blockers or delays.",
        viewLastPlan: "View today's plan",
        trash: "Trash",
        settings: "Settings",
        logout: "Log out"
    }
};

export const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    totalPending,
    subjects,
    onOpenSettings,
    onAiPlanClick,
    isAiLoading,
    aiNotificationReady,
    hasAiPlan,
    onOpenAiModal,
    subjectStats,
    showTrash,
    onOpenTrash,
    onGoHome,
    mobileOpen,
    onCloseMobile
}: SidebarProps) => {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const { language } = useLanguage();
    const t = translations[language as keyof typeof translations];

    const totalTasks = subjects.reduce((acc, subject) => acc + subject.tasks.length, 0);
    const completedTasks = totalTasks - totalPending;
    const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;
    const strokeDashoffset = 226 - (226 * progress);

    // The ring's stroke already eases smoothly (transition-all duration-500
    // above), but the count next to it used to just snap to its new value —
    // a short scale-pop on the count, replayed via a remount-on-change key,
    // keeps it visually in sync with the ring's motion. Render-phase
    // comparison (not a bare effect + setState), same pattern as Confetti's
    // lastTrigger — see CLAUDE.md's note on that component.
    const [lastCompletedTasks, setLastCompletedTasks] = useState(completedTasks);
    const [countPulseKey, setCountPulseKey] = useState(0);
    if (completedTasks !== lastCompletedTasks) {
        setLastCompletedTasks(completedTasks);
        setCountPulseKey(k => k + 1);
    }

    // On mobile the drawer always shows the full content when open — there's
    // no point collapsing it to icon-only inside an overlay panel.
    const expanded = sidebarOpen || mobileOpen;

    // --- Mobile swipe-to-close gesture --------------------------------
    // Lets the user drag the open drawer toward the left edge to dismiss
    // it, the way a native slide-out panel behaves. Only engages while
    // the mobile drawer is actually open, so it never interferes with
    // the static desktop sidebar.
    const DRAWER_WIDTH = 280;
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleDrawerTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (!mobileOpen) return;
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleDrawerTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (!mobileOpen || !touchStartRef.current) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        if (!isDragging) {
            // Wait for clear horizontal intent (toward the left edge) so
            // vertical scrolling inside the drawer keeps working.
            if (deltaX >= 0 || Math.abs(deltaX) < Math.abs(deltaY) || Math.abs(deltaX) < 10) return;
            setIsDragging(true);
        }
        setDragX(Math.max(-DRAWER_WIDTH, deltaX));
    };

    const handleDrawerTouchEnd = () => {
        if (isDragging && dragX < -DRAWER_WIDTH * 0.3) {
            onCloseMobile();
        }
        setIsDragging(false);
        setDragX(0);
        touchStartRef.current = null;
    };

    return (
        <>
            {/* Mobile-only backdrop behind the sliding drawer */}
            {mobileOpen && (
                <div
                    onClick={onCloseMobile}
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 sm:hidden"
                />
            )}

            <div
                onTouchStart={handleDrawerTouchStart}
                onTouchMove={handleDrawerTouchMove}
                onTouchEnd={handleDrawerTouchEnd}
                onTouchCancel={handleDrawerTouchEnd}
                style={isDragging ? { transform: `translateX(${dragX}px)`, transitionDuration: "0ms" } : undefined}
                className={`fixed inset-y-0 left-0 z-40 w-[280px] p-5 flex flex-col
                transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                rounded-r-2xl shadow-xl
                sm:static sm:z-20 sm:translate-x-0 sm:transition-[width] sm:duration-300 sm:ease-in-out sm:rounded-2xl sm:shadow-md
                ${sidebarOpen ? "sm:w-[280px] sm:overflow-visible" : "sm:w-20 sm:overflow-hidden"}
                bg-gray-50 dark:bg-gray-900`}>

            {/* --- HEADER --- */}
            <div className="flex items-center mb-8 w-full sm:w-[240px] shrink-0">
                <button
                    onClick={() => {
                        if (mobileOpen) {
                            onCloseMobile();
                        } else {
                            setSidebarOpen(!sidebarOpen);
                        }
                        setShowNotifications(false);
                    }}
                    className="flex items-center justify-center shrink-0 w-10 h-10 text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title={sidebarOpen ? t.closeMenu : t.openMenu}
                >
                    <div className="bg-[#cc2229] w-9 h-9 rounded-[10px] flex items-center justify-center shadow-sm flex-shrink-0">
                        <Check size={22} strokeWidth={4} className="text-white" />
                    </div>
                </button>

                <div
                    onClick={() => { onGoHome(); onCloseMobile(); }}
                    className={`flex items-center overflow-hidden cursor-pointer hover:opacity-80 transition-all duration-300 ease-in-out ${expanded ? "w-[150px] opacity-100 ml-2" : "w-0 opacity-0 ml-0"}`}
                    title={t.goHome}
                >
                    <span className="text-[22px] font-black text-gray-900 dark:text-white tracking-tight leading-none mt-1">
                        REDCHECK
                    </span>
                </div>

                <div className={`relative flex items-center justify-end transition-all duration-300 ease-in-out ${expanded ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none"}`}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-90 shrink-0" 
                        title={t.notifications}
                    >
                        <Bell size={20} />
                        {aiNotificationReady && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full border border-gray-50 dark:border-gray-900 animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 left-auto sm:left-0 sm:right-auto top-12 w-64 sm:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 origin-top-right sm:origin-top-left z-[60]">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t.notifications}</h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.markRead}</span>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {aiNotificationReady ? (
                                    <div 
                                        onClick={() => {
                                            onOpenAiModal();
                                            setShowNotifications(false);
                                        }}
                                        className="p-4 hover:bg-zinc-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-zinc-100 dark:border-gray-800 flex flex-col gap-1 transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider italic">{t.aiReadyTitle}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">{t.aiReadyDesc}</p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.aiReadySub}</p>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                                        <Bell size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        {t.noNotifications}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CENTRAL ZONE --- */}
            <div className="flex-1 flex flex-col items-center w-full overflow-y-auto overflow-x-hidden pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                <div className={`relative transition-all duration-300 ease-in-out shrink-0 mb-5 ${expanded ? "w-24 h-24" : "w-10 h-10"}`}>
                    <svg viewBox="0 0 96 96" className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="currentColor" className="text-[#c3e0ce] dark:text-gray-800 fill-[#eaf6ed] dark:fill-gray-900/50 transition-colors duration-500" />
                        <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="8" fill="none"
                            strokeDasharray="226" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                            className="text-[#16a34a] dark:text-green-400 transition-all duration-500 ease-out"
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center font-bold text-green-700 dark:text-white transition-all duration-300 ease-in-out ${expanded ? "text-xl tracking-tight" : "text-xs"}`}>
                        <span key={countPulseKey} className="animate-count-pop inline-block">{completedTasks}/{totalTasks}</span>
                    </div>
                </div>

                <SubjectBalance
                    sidebarOpen={expanded}
                    setSidebarOpen={setSidebarOpen}
                    stats={subjectStats}
                />

                {/* AI hint — collapsed-sidebar-only affordance (desktop). A
                    quick visual cue that SmartCheck AI lives here; fades out
                    smoothly once the sidebar expands, and never renders on
                    mobile (the drawer has no collapsed state to hint at).
                    The full "SmartCheck AI / Analysis Engine" label below is
                    hidden per product decision — see CLAUDE.md — but kept
                    in the code (via `false &&`) for a fast re-enable. */}
                <div
                    onClick={() => setSidebarOpen(true)}
                    className={`hidden sm:flex items-center justify-center w-11 h-11 mx-auto mt-4 mb-2 rounded-2xl cursor-pointer text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm transition-all duration-300 ease-in-out ${
                        sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    title="SmartCheck AI"
                >
                    <Sparkles size={22} strokeWidth={1.5} />
                </div>

                {SHOW_ANALYSIS_ENGINE_LABEL && (
                    <div className={`hidden sm:flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out w-full ${expanded ? "max-h-[60px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                            <Sparkles size={14} strokeWidth={2} className="text-red-500 dark:text-red-400" />
                            SmartCheck AI
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 tracking-wide uppercase">
                            {t.analysisEngine}
                        </p>
                    </div>
                )}

                <div className={`
                        flex flex-col space-y-3 px-4 overflow-hidden w-full shrink-0
                        transition-all duration-500 ease-out
                        ${expanded
                            ? 'max-h-[800px] opacity-100 translate-y-0 mt-6 pb-4'
                            : 'max-h-0 opacity-0 translate-y-4 mt-0 pointer-events-none'
                        }
                    `}>

                    <SmartCheckButton
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                        title={t.dailyAnalysisTitle}
                        subtitle={isAiLoading ? t.aiConsulting : t.dailyAnalysisSub}
                        onClick={onAiPlanClick}
                        comingSoon={false}
                        isLoading={isAiLoading}
                    />

                    {/* Persistent access to the last generated plan — stays
                        reachable even after the bell notification has been
                        dismissed/read, since only one (today's) plan exists
                        at a time. Placed right after the (functional) daily
                        analysis button, ahead of the disabled "coming soon"
                        one, so it stays visible without scrolling this list. */}
                    {hasAiPlan && (
                        <button
                            onClick={() => { onOpenAiModal(); onCloseMobile(); }}
                            className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl py-2.5 transition-colors"
                        >
                            <Eye size={14} />
                            {t.viewLastPlan}
                        </button>
                    )}

                    {/* Hidden per product decision — not ready for release
                        yet. Kept in code (not deleted) for a fast
                        re-enable; see CLAUDE.md. */}
                    {SHOW_RISK_ANALYSIS_BUTTON && (
                        <SmartCheckButton
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            title={t.riskAnalysisTitle}
                            subtitle={t.riskAnalysisSub}
                            onClick={() => console.log("Risk analysis clicked")}
                            comingSoon={true}
                        />
                    )}
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className={`mt-auto flex flex-col gap-1 w-full pt-4 transition-all duration-300 ease-in-out ${expanded ? "border-t border-gray-200 dark:border-gray-800" : "border-transparent"}`}>

                <button
                    onClick={() => { onOpenTrash(); onCloseMobile(); }}
                    className={`flex items-center p-2 rounded-xl transition-all active:scale-95 w-full ${showTrash ? "bg-gray-800 dark:bg-gray-800 text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"}`}
                    title={t.trash}
                >
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Trash2 size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            {t.trash}
                        </span>
                    </div>
                </button>

                <button onClick={() => { onOpenSettings(); onCloseMobile(); }} className="flex items-center p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all active:scale-95 w-full" title={t.settings}>
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <Settings size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            {t.settings}
                        </span>
                    </div>
                </button>

                <button onClick={() => { localStorage.removeItem("token"); sessionStorage.removeItem("focusTipDismissed"); navigate("/login"); }} className="flex items-center p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-900/30 transition-all active:scale-95 w-full" title={t.logout}>
                    <div className="flex items-center justify-center shrink-0 w-6 h-6">
                        <LogOut size={20} />
                    </div>
                    <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "w-[120px] opacity-100" : "w-0 opacity-0"}`}>
                        <span className="text-sm font-medium whitespace-nowrap ml-3">
                            {t.logout}
                        </span>
                    </div>
                </button>
            </div>

            </div>
        </>
    );
};