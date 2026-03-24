import { Sidebar } from "../components/Sidebar";
import { SubjectSection } from "../components/SubjectSection";
import { OverdueSection } from "../components/OverdueSection";
import { SettingsModal } from "../components/SettingsModal";
import { AnimatedVisibility } from "../components/AnimatedVisibility";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { archiveSubject, deleteSubject, getSubjects, postSubject, updateSubject } from "../api/subjectApi";
import { addNewTask, deleteTask, getTodayTasks, toggleTask, updateTask } from "../api/taskApi";
import type { SubjectWithTasks } from "../types";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsername } from "../api/userApi";

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

    const [username, setUsername] = useState("");

    const [updatedSubject, setUpdatedSubject] = useState({ name: "", description: "" });
    const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "" });
    const [updatedTask, setUpdatedTask] = useState({ title: "", description: "", deadline: "" });
    const [newSubject, setNewSubject] = useState({ name: "", description: "" });

    const handleChangeTask = (e: React.ChangeEvent<HTMLInputElement>) => { setNewTask({ ...newTask, [e.target.name]: e.target.value}); };
    const handleChangeUpdateTask = (e: React.ChangeEvent<HTMLInputElement>) => { setUpdatedTask({ ...updatedTask, [e.target.name]: e.target.value}); };
    const handleChangeUpdateSubject = (e: React.ChangeEvent<HTMLInputElement>) => { setUpdatedSubject({ ...updatedSubject, [e.target.name]: e.target.value}); };
    const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => { setNewSubject({ ...newSubject, [e.target.name]: e.target.value}); }

    const handleSubmitSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); setLoading(true);
        try {
            const response = await postSubject(newSubject);
            setSubjects([...subjects, { ...response, tasks: [] }]);
            setOpenFormNewSubject(false);
            setNewSubject({name: "", description: ""});
        } catch(err) { setError("Error"); } finally { setLoading(false); }
    }

    const handleSubmitTask = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null); setLoading(true);
        try {
            const response = await addNewTask(subjectId, newTask);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: [...subject.tasks, response] }));
            setOpenFormSubjectId(null);
            setNewTask({title: "", description: "", deadline: ""});
        } catch(err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleUpdateTask = async (e: React.FormEvent, subjectId: number, taskId: number) => {
        e.preventDefault();
        setError(null); setLoading(true);
        try {
            const response = await updateTask(subjectId, taskId, updatedTask);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : response) }));
            setOpenFormSubjectIdTaskId(null);
            setUpdatedTask({title: "", description: "", deadline: ""});
        } catch(err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleDeleteTask = async (subjectId: number, taskId: number) => {
        setError(null); setLoading(true);
        try {
            await deleteTask(subjectId, taskId);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.filter(task => task.id !== taskId) }));
        } catch(err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleDeleteSubject = async (subjectId: number) => {
        setError(null); setLoading(true);
        try {
            await deleteSubject(subjectId);
            setSubjects(subjects.filter(subject => subjectId !== subject.id));
        } catch(err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleUpdateSubject = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null); setLoading(true);
        try {
            const response = await updateSubject(subjectId, updatedSubject);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, ...response }));
            setOpenFormUpdateSubject(null);
            setUpdatedSubject({ name: "", description: "" });
        } catch (err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleArchiveSubject = async (subjectId: number) => {
        setError(null); setLoading(true);
        try {
            const subject = subjects.find(s => s.id === subjectId);
            const isCurrentlyArchived = subject?.archived || false;
            const response = await archiveSubject(subjectId, !isCurrentlyArchived);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, ...response }));
        } catch (err) { setError("Error"); } finally { setLoading(false); }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("¿Estás seguro de que quieres borrar tu cuenta permanentemente? Esta acción no se puede deshacer.")) {
                        
            try {
                console.log("Llamando a la API para borrar cuenta...");
                
                await deleteUser(); 
                
                localStorage.removeItem("token");
                
                navigate("/login");
                
            } catch (err) {
                console.error("Error al borrar la cuenta:", err);
                alert("Hubo un problema al intentar borrar la cuenta. Inténtalo de nuevo.");
            }
        }
    };

    const getGreeting = (username: string): string => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 14) return `Buenos días, ${username}`;
        if (hour >= 14 && hour < 21) return `Buenas tardes, ${username}`;
        return `Buenas noches, ${username}`;
    };

    const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await getUsername();
                setUsername(profile.username);
                const subjectsData = await getSubjects();
                const subjectsWithTasks = await Promise.all(
                    subjectsData.map(async (subject) => {
                        const tasks = await getTodayTasks(subject.id);
                        return { ...subject, tasks };
                    })
                );
                setSubjects(subjectsWithTasks);
            } catch (err) {
                setError("Error al cargar los datos");
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleToggleTask = async (subjectId: number, taskId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        const task = subject?.tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            await toggleTask(subjectId, taskId, !task.completed);
            setSubjects(subjects.map(subject => subject.id !== subjectId ? subject : { ...subject, tasks: subject.tasks.map(task => task.id !== taskId ? task : { ...task, completed: !task.completed }) }));
        } catch (err) { console.error("Error al actualizar la tarea"); }
    };

    const totalPending = subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed).length, 0);
    const totalPendingOverdue = subjects.reduce((acc, subject) => acc + subject.tasks.filter(t => !t.completed && t.overdue).length, 0);

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2]"><p className="text-green-700 font-semibold">Cargando...</p></div>;
    if (error) return <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2]"><p className="text-red-500 font-semibold">{error}</p></div>;

    return (
        <div className="flex h-screen bg-[#e3e7e2] p-4 gap-4 overflow-hidden">
            <Sidebar 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
                totalPending={totalPending} 
                subjects={subjects} 
                onOpenSettings={() => setIsSettingsOpen(true)} 
            />

            <div className="flex-1 rounded-2xl bg-white shadow-md p-6 flex flex-col overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{ getGreeting(username) }</h1>
                    <p className="text-gray-400 mt-1 capitalize">{today}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalPending === 0 ? "¡No tienes tareas pendientes hoy! 🎉" : `Tienes ${totalPending} tarea${totalPending > 1 ? "s" : ""} pendiente${totalPending > 1 ? "s" : ""} hoy`}
                    </p>
                </div>

                <div className="flex flex-col gap-8">
                    {subjects.filter(subject => !subject.archived).map(subject => (
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
                        />
                    ))}

                    <button 
                        className="w-full mt-4 flex items-center justify-center gap-2 text-gray-500 bg-transparent border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl py-4 text-sm font-medium transition-all group" 
                        onClick={() => { setOpenFormNewSubject(true); }}
                    >
                        <Plus size={18} className="transition-transform group-hover:scale-110" />
                        <span>Añadir nueva asignatura</span>
                    </button>

                    {/* USAMOS EL COMPONENTE ANIMATED VISIBILITY */}
                    <AnimatedVisibility isVisible={openFormNewSubject}>
                        {/* QUITAR LA CLASE animate-slide-down DEL FORM, LA MANEJA EL ENVOLTORIO */}
                        <form onSubmit={(e) => handleSubmitSubject(e)} className="flex flex-col gap-4 mt-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            
                            {/* Cabecera del formulario */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Nueva asignatura</h3>
                                <p className="text-xs text-gray-500 mt-1">Añade una nueva materia para organizar tus tareas.</p>
                            </div>

                            {/* Inputs */}
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

                            {/* Botones */}
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
                />
            </div>

            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                subjects={subjects}
                handleArchiveSubject={handleArchiveSubject}
                handleDeleteAccount={handleDeleteAccount}
            />
        </div>
    );
};

export default DashboardPage;