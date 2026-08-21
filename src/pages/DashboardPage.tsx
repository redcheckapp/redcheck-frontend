import { Sidebar } from "../components/Sidebar";
import { SubjectSection } from "../components/SubjectSection";
import { OverdueSection } from "../components/OverdueSection";
import { SettingsModal } from "../components/SettingsModal";
import { AnimatedVisibility } from "../components/AnimatedVisibility";
import { useState, useEffect, useMemo } from "react";
import { Check, Coffee, Plus, Focus, LayoutGrid } from "lucide-react";
import { ProgressHeatmap } from "../components/ProgressHeatmap";
import { archiveSubject, deleteSubject, getSubjects, postSubject, updateSubject } from "../api/subjectApi";
import { addNewTask, deleteTask, getTodayTasks, toggleTask, updateTask } from "../api/taskApi";
import type { SubjectWithTasks } from "../types";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsername } from "../api/userApi";
import { addRecurringTask } from "../api/recurringTaskApi";
import SmartCheckModal from "../components/SmartCheckModal";
import { dailyAnalysis, pollForAnalysis } from "../api/smartCheckApi";
import { PageTransition } from "../components/PageTransition";
import { AgendaView } from "../components/AgendaView";
import { TrashView } from "../components/TrashView";

const DashboardPage = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectWithTasks[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openFormSubjectId, setOpenFormSubjectId] = useState<number | null>(null);
    const [openFormSubjectIdTaskId, setOpenFormSubjectIdTaskId] = useState<{subjectId: number; taskId: number} | null>(null);
    const [openFormUpdateSubject, setOpenFormUpdateSubject] = useState<number | null>(null);
    const [openFormNewSubject, setOpenFormNewSubject] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [showCalendar, setShowCalendar] = useState(true);
    const [showTrash, setShowTrash] = useState(false); // <-- NUEVO: Estado para controlar si vemos la papelera

    const [deletingSubjects, setDeletingSubjects] = useState<number[]>([]);
    const [deletingTasks, setDeletingTasks] = useState<number[]>([]);
    const [username, setUsername] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [updatedSubject, setUpdatedSubject] = useState({ name: "", description: "" });
    const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "", recurrence: "NONE" });
    const [updatedTask, setUpdatedTask] = useState({ title: "", description: "", deadline: "" });
    const [newSubject, setNewSubject] = useState({ name: "", description: "" });

    const handleChangeTask = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setNewTask({ ...newTask, [e.target.name]: e.target.value}); };
    const handleChangeUpdateTask = (e: React.ChangeEvent<HTMLInputElement>) => { setUpdatedTask({ ...updatedTask, [e.target.name]: e.target.value}); };
    const handleChangeUpdateSubject = (e: React.ChangeEvent<HTMLInputElement>) => { setUpdatedSubject({ ...updatedSubject, [e.target.name]: e.target.value}); };
    const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => { setNewSubject({ ...newSubject, [e.target.name]: e.target.value}); }

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPlanData, setAiPlanData] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiNotificationReady, setAiNotificationReady] = useState(false);
    
    // ... [TODO EL RESTO DE TUS FUNCIONES SE MANTIENE IGUAL HASTA EL RENDER] ...
    
    const handleGenerateAiPlan = async () => {
        setIsAiLoading(true);
        alert("🧠 SmartCheck está analizando tus tareas. Te avisaremos cuando esté listo (Suele tardar unos 15-20 segundos).");
        try {
            await dailyAnalysis();
        } catch (error) {
            console.warn("dailyAnalysis() lanzó error, pero continuamos el polling:", error);
        }

        pollForAnalysis()
            .then((analysis) => {
                setAiPlanData(analysis);
                setAiNotificationReady(true); 
            })
            .catch((err) => {
                if (err?.message === "TIMEOUT") {
                    alert("SmartCheck tardó demasiado en responder. Inténtalo de nuevo.");
                } else {
                    console.error("Error en polling:", err);
                    alert("Error al obtener el análisis.");
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

    const handleSubmitTask = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null);
        try {
            if (newTask.recurrence === "NONE") {
                const response = await addNewTask(subjectId, {
                    title: newTask.title,
                    description: newTask.description,
                    deadline: newTask.deadline
                });
                setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: [...subject.tasks, response] }));
            } else {
                await addRecurringTask(subjectId, {
                    title: newTask.title,
                    description: newTask.description,
                    periodicidad: newTask.recurrence
                });
                alert("Tarea recurrente creada. Aparecerá según su periodicidad a partir de mañana.");
            }
            
            setOpenFormSubjectId(null);
            setNewTask({title: "", description: "", deadline: "", recurrence: "NONE"});
        } catch(err) { 
            setError("Error al crear la tarea"); 
        }
    };

    const handleUpdateTask = async (e: React.FormEvent, subjectId: number, taskId: number) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await updateTask(subjectId, taskId, updatedTask);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : response) }));
            setOpenFormSubjectIdTaskId(null);
            setUpdatedTask({title: "", description: "", deadline: ""});
        } catch(err) { setError("Error"); }
    };

    const handleDeleteTask = async (subjectId: number, taskId: number) => {
        setError(null);
        try {
            setDeletingTasks(prev => [...prev, taskId]);
            await deleteTask(subjectId, taskId);
            setTimeout(() => {
                setSubjects(current => current.map(subject => 
                    subject.id !== subjectId 
                        ? subject 
                        : { ...subject, tasks: subject.tasks.filter(task => task.id !== taskId) }
                ));
                setDeletingTasks(prev => prev.filter(id => id !== taskId));
            }, 400);
        } catch(err) { 
            console.error("Error al eliminar la tarea:", err);
            setDeletingTasks(prev => prev.filter(id => id !== taskId));
        } 
    };

    const handleDeleteSubject = async (subjectId: number) => {
        setError(null); 
        try {
            setDeletingSubjects(prev => [...prev, subjectId]);
            await deleteSubject(subjectId);
            setTimeout(() => {
                setSubjects(current => current.filter(subject => subject.id !== subjectId));
                setDeletingSubjects(prev => prev.filter(id => id !== subjectId));
            }, 400);
            
        } catch(err) { 
            console.error("Error al enviar a la papelera:", err);
            setError("No se pudo enviar la asignatura a la papelera."); 
            setDeletingSubjects(prev => prev.filter(id => id !== subjectId));
        } 
    };

    const handleUpdateSubject = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await updateSubject(subjectId, updatedSubject);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, ...response, tasks: subject.tasks }));
            setOpenFormUpdateSubject(null);
            setUpdatedSubject({ name: "", description: "" });
        } catch (err) { setError("Error"); }
    };

    const handleArchiveSubject = async (subjectId: number) => {
        try {
            const subject = subjects.find(s => s.id === subjectId);
            const isCurrentlyArchived = subject?.archived || false;
            const response = await archiveSubject(subjectId, !isCurrentlyArchived);
            setSubjects(subjects.map(subject => 
                subject.id !== subjectId 
                    ? subject 
                    : { ...subject, ...response, tasks: subject.tasks } 
            ));
        } catch (err) { 
            console.error("Error al archivar/desarchivar:", err);
            alert("No se pudo cambiar el estado de la asignatura.");
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("¿Estás seguro de que quieres borrar tu cuenta permanentemente? Esta acción no se puede deshacer.")) {
            try {
                await deleteUser(); 
                localStorage.removeItem("token");
                navigate("/login");
            } catch (err) {
                alert("Hubo un problema al intentar borrar la cuenta. Inténtalo de nuevo.");
            }
        }
    };

    const getGreeting = (username: string): string => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return `Buenos días, ${username}`;
        if (hour >= 12 && hour < 21) return `Buenas tardes, ${username}`;
        return `Buenas noches, ${username}`;
    };

    const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    // 1. Crea esta función justo antes de tu useEffect
    const refreshData = async () => {
        try {
            const subjectsData = await getSubjects();
            const subjectsWithTasks = await Promise.all(
                subjectsData.map(async (subject) => {
                    const tasks = await getTodayTasks(subject.id);
                    return { ...subject, tasks };
                })
            );
            setSubjects(subjectsWithTasks); 
        } catch (err) {
            console.error("Error refrescando el dashboard:", err);
        }
    };

    // 2. Modifica tu useEffect para que sea más limpio
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const profile = await getUsername();
                setUsername(profile.username);
                setUserEmail(profile.email);
                await refreshData(); // Usamos la nueva función
            } catch (err) {
                setError("Error al cargar los datos");
            } finally { 
                setLoading(false); 
            }
        };
    
        fetchInitialData();
    }, []);

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

        const colorPalette = [
            { colorClass: "bg-red-500", hoverTextClass: "group-hover:text-red-600" },
            { colorClass: "bg-blue-500", hoverTextClass: "group-hover:text-blue-600" },
            { colorClass: "bg-amber-500", hoverTextClass: "group-hover:text-amber-500" },
        ];

        return top3Stats.map((stat, index) => ({
            ...stat,
            colorClass: colorPalette[index].colorClass,
            hoverTextClass: colorPalette[index].hoverTextClass
        }));
        
    }, [subjects]); 

    const handleToggleTask = async (subjectId: number, taskId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        const task = subject?.tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            await toggleTask(subjectId, taskId, !task.completed);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : { ...task, completed: !task.completed }) }));
        } catch (err) { console.error("Error al actualizar la tarea"); }
    };

    const handleSubmitSubject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); 
        setError(null); 
        try {
            const response = await postSubject(newSubject);
            setSubjects([...subjects, { ...response, tasks: [] }]);
            setOpenFormNewSubject(false);
            setNewSubject({ name: "", description: "" });
        } catch(err) { 
            console.error("Error al crear asignatura:", err);
            setError("No se pudo crear la asignatura. Inténtalo de nuevo."); 
        } 
    };

    const totalPending = subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed).length, 0);
    const totalPendingOverdue = subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed && t.overdue).length, 0);
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#e3e7e2]">
                <div className="flex flex-col items-center gap-5 animate-pulse">
                    <div className="bg-[#cc2229] w-16 h-16 rounded-[18px] flex items-center justify-center shadow-lg flex-shrink-0">
                        <Check size={40} strokeWidth={4} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                        Cargando tu espacio...
                    </span>
                </div>
            </div>
        );
    }

    if (error) return <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2]"><p className="text-red-500 font-semibold">{error}</p></div>;

    return (
        <PageTransition>
            <div className="flex h-screen bg-[#e3e7e2] p-4 overflow-hidden">
                
                <Sidebar 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    totalPending={totalPending} 
                    subjects={subjects} 
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onAiPlanClick={handleGenerateAiPlan} 
                    isAiLoading={isAiLoading}
                    aiNotificationReady={aiNotificationReady}
                    onOpenAiModal={handleOpenAiModal} 
                    subjectStats={subjectStats}
                    showTrash={showTrash}                                  // <-- NUEVO: Le decimos al Sidebar si estamos en la papelera
                    onOpenTrash={() => {
                        if (showTrash) {
                            // Si ya estamos en la papelera, salir y refrescar datos
                            setShowTrash(false);
                            refreshData();
                        } else {
                            // Si no, entrar a la papelera
                            setShowTrash(true);
                        }
                    }}                 // <-- NUEVO: Función para abrir papelera
                    onGoHome={() => setShowTrash(false)}                   // <-- NUEVO: Función para volver al dashboard
                />

                {/* --- RENDERIZADO CONDICIONAL CON ANIMACIÓN SUAVE --- */}
                {/* El 'key' obliga a React a reiniciar la animación cada vez que cambiamos de vista */}
                <div key={showTrash ? 'view-trash' : 'view-dashboard'} className="flex-1 flex h-full animate-soft-fade">
                    
                    {showTrash ? (
                        // VISTA DE LA PAPELERA
                        <div className="flex-1 ml-4">
                            <TrashView 
                                onClose={() => {
                                    setShowTrash(false);
                                    refreshData();
                                }} 
                                onRestore={() => {}} 
                            />
                        </div>
                    ) : (
                        // VISTA NORMAL DEL DASHBOARD
                        <>
                            {/* --- BLOCK 1: AGENDA (LEFT) --- */}
                            <div className={`transition-all duration-500 ease-in-out flex flex-col overflow-hidden shrink-0 ${
                                showCalendar ? "w-[55%] opacity-100 ml-4" : "w-0 opacity-0 ml-0"
                            }`}>
                                <main className="w-full h-full relative flex flex-col min-w-[700px]">
                                    <AgendaView subjects={subjects} />
                                </main>
                            </div>

                            {/* --- BLOCK 2: TASKS (CENTER) --- */}
                        <div className="flex-1 rounded-2xl bg-white shadow-md flex flex-col overflow-y-auto transition-all duration-500 ease-in-out ml-4">
                            <div className="p-6 mx-auto w-full max-w-4xl transition-all duration-500 ease-in-out">
                                
                                {/* TASKS HEADER + FOCUS MODE BUTTON */}
                                <div className="mb-6 flex justify-between items-start">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-800">{ getGreeting(username) }</h1>
                                        <p className="text-gray-400 mt-1 capitalize">{today}</p>
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            {totalPending === 0 ? (
                                                <>
                                                    ¡No tienes tareas pendientes hoy! <Coffee size={16} />
                                                </>
                                            ) : (
                                                <span>&nbsp;</span>
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border shrink-0 mt-1 ${
                                            showCalendar 
                                                ? "bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 border-gray-200" 
                                                : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 shadow-sm"
                                        }`}
                                        title={showCalendar ? "Ocultar agenda (Modo Foco)" : "Mostrar agenda"}
                                    >
                                        {showCalendar ? <Focus size={18} strokeWidth={2.5} /> : <LayoutGrid size={18} strokeWidth={2.5} />}
                                        <span className="hidden xl:inline">
                                            {showCalendar ? "Modo Foco" : "Ver Agenda"}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-8">
                                    {subjects.filter(subject => !subject.archived).map(subject => {
                                        const isDeleting = deletingSubjects.includes(subject.id);
                                        return (
                                            <div 
                                                key={`subject-wrapper-${subject.id}`}
                                                className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${
                                                    isDeleting 
                                                        ? "opacity-0 scale-95 max-h-0 !mb-[-2rem]"
                                                        : "opacity-100 scale-100 max-h-[2000px]"
                                                }`}
                                            >
                                                <SubjectSection
                                                    key={subject.id}
                                                    subject={subject}
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
                                                />
                                            </div>
                                        );
                                    })}

                                    <button 
                                        className="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 bg-transparent border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl py-4 text-sm font-medium transition-all group" 
                                        onClick={() => { setOpenFormNewSubject(true); }}
                                    >
                                        <Plus size={18} className="transition-transform group-hover:scale-110" />
                                        <span>Añadir nueva asignatura</span>
                                    </button>

                                    <AnimatedVisibility isVisible={openFormNewSubject}>
                                        <form onSubmit={handleSubmitSubject} className="flex flex-col gap-4 mt-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">Nueva asignatura</h3>
                                                <p className="text-xs text-gray-500 mt-1">Añade una nueva materia para organizar tus tareas.</p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</label>
                                                    <input type="text" name="name" value={newSubject.name} onChange={handleChangeSubject} placeholder="Ej. Desarrollo de Interfaces" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" required />
                                                </div>
                                                
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                                    <input type="text" name="description" value={newSubject.description} onChange={handleChangeSubject} placeholder="Ej. Asignatura de 3º de carrera" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all" />
                                                </div>
                                            </div>

                                            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg text-center">{error}</p>}

                                            <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-50">
                                                <button type="button" onClick={() => { setOpenFormNewSubject(false) }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
                                                <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50">Guardar asignatura</button>
                                            </div>
                                        </form>
                                    </AnimatedVisibility>       
                                </div>

                                <OverdueSection
                                    subjects={subjects}
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
                        <div className={`transition-all duration-500 ease-in-out flex flex-col overflow-hidden shrink-0 ${
                                showCalendar ? "w-0 opacity-0 ml-0" : "w-[350px] opacity-100 ml-4" 
                            }`}>
                            <div className="w-[350px] h-full bg-white rounded-2xl shadow-md p-6 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden">
                                
                                <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                        <LayoutGrid size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">Tu rendimiento</h3>
                                        <p className="text-xs text-gray-400 font-medium">Historial de constancia</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <ProgressHeatmap />
                                </div>

                                {/* Motivational block */}
                                <div className="mt-8 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100/50 shadow-sm shrink-0">
                                    <h4 className="text-green-800 font-bold text-sm mb-2 flex items-center gap-2">
                                        <Check size={16} /> 
                                        Modo Foco Activo
                                    </h4>
                                    <p className="text-[13px] text-green-700/80 font-medium leading-relaxed">
                                        El calendario principal está oculto. Concéntrate en completar tus tareas de hoy para mantener tu racha de progreso en verde.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <SettingsModal 
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    subjects={subjects}
                    handleArchiveSubject={handleArchiveSubject}
                    handleDeleteAccount={handleDeleteAccount}
                    userEmail={userEmail}
                />

                <SmartCheckModal 
                    isOpen={isAiModalOpen} 
                    onClose={() => setIsAiModalOpen(false)} 
                    aiData={aiPlanData} 
                    subjects={subjects} 
                />
            </div>
        </div>
        </PageTransition>
    );
};

export default DashboardPage;