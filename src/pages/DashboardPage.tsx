import { Sidebar } from "../components/Sidebar";
import { TaskItem } from "../components/TaskItem";
import { SubjectSection } from "../components/SubjectSection";
import { useState, useEffect } from "react";
import { Plus, LogOut, Check, X, Pencil, CheckSquare, Archive, ArchiveX, FolderOpen } from "lucide-react";
import { archiveSubject, deleteSubject, getSubjects, postSubject, updateSubject } from "../api/subjectApi";
import { addNewTask, deleteTask, getTodayTasks, toggleTask, updateTask } from "../api/taskApi";
import type { SubjectWithTasks } from "../types";
import { useNavigate } from "react-router-dom";
import { getUsername } from "../api/userApi";

const DashboardPage = () => {
    // Datos de la API
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectWithTasks[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openFormSubjectId, setOpenFormSubjectId] = useState<number | null>(null);
    const [openFormSubjectIdTaskId, setOpenFormSubjectIdTaskId] = useState<{subjectId: number; taskId: number} | null>(null);
    const [openFormUpdateSubject, setOpenFormUpdateSubject] = useState<number | null>(null);
    const [openFormNewSubject, setOpenFormNewSubject] = useState<boolean>(false);

    const [username, setUsername] = useState("");

    const [updatedSubject, setUpdatedSubject] = useState({
        name: "",
        description: ""
    });

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        deadline: ""
    });

    const [updatedTask, setUpdatedTask] = useState({
        title: "",
        description: "",
        deadline: ""
    });

    const [newSubject, setNewSubject] = useState({
        name: "",
        description: ""
    });

    // Updates corresponding field when the user writes
    const handleChangeTask = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value});
    };

    // Updates corresponding field when the user writes task update form
    const handleChangeUpdateTask = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdatedTask({ ...updatedTask, [e.target.name]: e.target.value});
    };

    // Updates corresponding field when the user writes subject update form
    const handleChangeUpdateSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdatedSubject({ ...updatedSubject, [e.target.name]: e.target.value});
    };

    const handleChangeSubject = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewSubject({ ...newSubject, [e.target.name]: e.target.value});
    }

    const handleSubmitSubject = async (e: React.FormEvent) => {
        e.preventDefault(); // prevent the page from reloading
        setError(null);
        setLoading(true);

        try {
            const response = await postSubject(newSubject);

            setSubjects([...subjects, { ...response, tasks: [] }]);
            
            setOpenFormNewSubject(false);

            setNewSubject({name: "", description: ""});

        } catch(err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmitTask = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault(); // prevent the page from reloading
        setError(null);
        setLoading(true);
    
        try {
            const response = await addNewTask(subjectId, newTask);

            setSubjects(subjects.map(subject => {
                if(subject.id !== subjectId) return subject;
                return {
                    ...subject, 
                    tasks: [...subject.tasks, response]
                };
            }));
            
            setOpenFormSubjectId(null);

            setNewTask({title: "", description: "", deadline: ""});

        } catch(err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (e: React.FormEvent, subjectId: number, taskId: number) => {
        e.preventDefault(); // prevent the page from reloading
        setError(null);
        setLoading(true);

        try {
            const response = await updateTask(subjectId, taskId, updatedTask);

            setSubjects(subjects.map(subject => {
                if (subject.id !== subjectId) return subject;
                return {
                    ...subject,
                    tasks: subject.tasks.map(task => {
                        if (task.id !== taskId) return task;
                        return response; // reemplaza la tarea con la respuesta de la API
                    })
                };
            }));
            
            setOpenFormSubjectIdTaskId(null);

            setUpdatedTask({title: "", description: "", deadline: ""});

        } catch(err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (subjectId: number, taskId: number) => {
        setError(null);
        setLoading(true);

        try {
            await deleteTask(subjectId, taskId);

            setSubjects(subjects.map(subject => {
                if(subject.id !== subjectId) return subject;
                return {
                    ...subject, 
                    tasks: subject.tasks.filter(task => task.id !== taskId)
                };
            }));
            
        } catch(err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubject = async (subjectId: number) => {
        setError(null);
        setLoading(true);

        try {
            await deleteSubject(subjectId);

            setSubjects(subjects.filter(subject => subjectId !== subject.id));

        } catch(err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubject = async (e: React.FormEvent, subjectId: number) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await updateSubject(subjectId, updatedSubject);

            setSubjects(subjects.map(subject => {
                if (subject.id !== subjectId) return subject;
                return { ...subject, ...response };
            }));

            setOpenFormUpdateSubject(null);
            setUpdatedSubject({ name: "", description: "" });
        } catch (err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveSubject = async (subjectId: number) => {
        setError(null);
        setLoading(true);

        try {
            const subject = subjects.find(s => s.id === subjectId);
            const isCurrentlyArchived = subject?.archived || false;
            const response = await archiveSubject(subjectId, !isCurrentlyArchived);

            setSubjects(subjects.map(subject => {
                if (subject.id !== subjectId) return subject;
                return { ...subject, ...response };
            }));
        } catch (err) {
            setError("Error");
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = (username: string): string => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 14) return `Buenos días, ${username}`;
        if (hour >= 14 && hour < 21) return `Buenas tardes, ${username}`;
        return `Buenas noches, ${username}`;
    };

    const today = new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {

                const profile = await getUsername();
                setUsername(profile.username);

                // 1. Coge todas las asignaturas
                const subjectsData = await getSubjects();
                console.log("Respuesta de la API:", subjectsData); // añade esto

                // 2. Por cada asignatura, coge sus tareas de hoy
                const subjectsWithTasks = await Promise.all(
                    subjectsData.map(async (subject) => {
                        const tasks = await getTodayTasks(subject.id);
                        return { ...subject, tasks };
                    })
                );

                setSubjects(subjectsWithTasks);
            } catch (err) {
                console.error("Error completo:", err); // añade esto
                setError("Error al cargar los datos");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // [] = solo se ejecuta una vez al montar

    // Marca una tarea como completada o no
    const handleToggleTask = async (subjectId: number, taskId: number) => {

        const subject = subjects.find(s => s.id === subjectId);
        const task = subject?.tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            // Llama a la API
            await toggleTask(subjectId, taskId, !task.completed);

            // Actualiza el estado local
            setSubjects(subjects.map(subject => {
                if (subject.id !== subjectId) return subject;
                return {
                    ...subject,
                    tasks: subject.tasks.map(task => {
                        if (task.id !== taskId) return task;
                        return { ...task, completed: !task.completed };
                    })
                };
            }));
        } catch (err) {
            console.error("Error al actualizar la tarea");
        }
    };

    // Cuenta las tareas pendientes totales
    const totalPending = subjects.reduce((acc, subject) =>
        acc + subject.tasks.filter(t => !t.completed).length, 0
    );

    // Cuenta las tareas pendientes totales (fuera de plazo)
    const totalPendingOverdue = subjects.reduce((acc, subject) =>
        acc + subject.tasks.filter(t => !t.completed && t.overdue).length, 0
    );

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2]">
            <p className="text-green-700 font-semibold">Cargando...</p>
        </div>
    );

    if (error) return (
        <div className="flex min-h-screen items-center justify-center bg-[#e3e7e2]">
            <p className="text-red-500 font-semibold">{error}</p>
        </div>
    );

    return (

        <div className="flex h-screen bg-[#e3e7e2] p-4 gap-4 overflow-hidden">

            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                totalPending={totalPending}
                subjects={subjects}
            />

            {/* Contenido principal */}
            <div className="flex-1 rounded-2xl bg-white shadow-md p-6 flex flex-col overflow-y-auto">

                {/* Cabecera */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{ getGreeting(username) }</h1>
                    <p className="text-gray-400 mt-1 capitalize">{today}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalPending === 0
                            ? "¡No tienes tareas pendientes hoy! 🎉"
                            : `Tienes ${totalPending} tarea${totalPending > 1 ? "s" : ""} pendiente${totalPending > 1 ? "s" : ""} hoy`
                        }
                    </p>
                </div>

                {/* Lista de asignaturas con tareas */}
                <div className="flex flex-col gap-8">
                    {subjects
                        .filter(subject => !subject.archived)
                        .map(subject => (
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
                        ))
                    }

                    {/* Botón añadir asignatura */}
                    <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-xl px-3 py-2 text-sm transition w-fit"
                        onClick={() => { setOpenFormNewSubject(true); }}  
                    >
                        <div className="w-5 h-5 bg-blue-600 text-white
                            squared-full flex items-center justify-center">
                            <Plus size={12} />
                        </div>
                        <span>Añadir asignatura</span>
                    </button>

                    {openFormNewSubject && (
                        <form onSubmit={(e) => handleSubmitSubject(e)}
                            className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 rounded-xl">
        
                            {/* input title */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-600">Nombre</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newSubject.name}
                                        onChange={handleChangeSubject}
                                        placeholder="Título"
                                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                            </div>

                            {/* input description */}
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-600">Descripción</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={newSubject.description}
                                        onChange={handleChangeSubject}
                                        placeholder="Descripción"
                                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                            </div>

                            {/* botones Guardar y Cancelar */}
                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            <div className="flex gap-2 mt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
                                >
                                    Guardar
                                </button>
    
                                <button type="button" 
                                    onClick={() => {setOpenFormNewSubject(false)}}
                                    className="border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}        
                </div>

                {/* Sección de Tareas Fuera de Plazo */}
                <div className="mb-6 mt-8 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                        {totalPendingOverdue === 0
                            ? "¡No tienes tareas fuera de plazo! 🎉"
                            : `Tienes ${totalPendingOverdue} tarea${totalPendingOverdue > 1 ? "s" : ""} fuera de plazo`
                        }
                    </p>

                    {/* Renderizamos solo si hay tareas atrasadas */}
                    {totalPendingOverdue > 0 && (
                        <div className="flex flex-col gap-6">
                            {subjects
                                // 1. Filtramos para quedarnos solo con asignaturas que tengan alguna tarea atrasada y no completada
                                .filter(subject => !subject.archived && subject.tasks.some(task => !task.completed && task.overdue))
                                .map(subject => (
                                    <div key={`overdue-${subject.id}`}>
                                        
                                        {/* Nombre de la asignatura (en rojo para destacar) */}
                                        <h2 className="text-md font-semibold text-red-600 mb-3 border-b border-red-100 pb-2">
                                            {subject.name}
                                        </h2>

                                        <div className="flex flex-col gap-2">
                                            {subject.tasks
                                                // 2. Filtramos las tareas para mostrar solo las atrasadas
                                                .filter(task => !task.completed && task.overdue)
                                                .map(task => (
                                                    <div key={`overdue-task-${task.id}`}
                                                        className="flex items-center gap-3 p-3
                                                            rounded-xl bg-red-50 hover:bg-red-100 transition group border border-red-100">

                                                        {/* Checkbox */}
                                                        <button
                                                            onClick={() => handleToggleTask(subject.id, task.id)}
                                                            className="w-6 h-6 squared-full border-2 flex items-center justify-center transition border-red-300 hover:border-red-500 bg-white">
                                                            {task.completed && <Check size={12} color="red" />}
                                                        </button>

                                                        {/* Título y deadline */}
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-red-900">
                                                                {task.title}

                                                                {/* Descripción justo al lado (si existe) */}
                                                                {task.description && (
                                                                    <span className={`ml-2 font-normal transition 
                                                                        ${task.completed ? "text-gray-300" : "text-red-700"}`}>
                                                                        — {task.description}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-red-500 mt-0.5 font-medium">
                                                                {task.deadline 
                                                                    ? `Caducó el ${new Date(task.deadline).toLocaleString("es-ES", { 
                                                                        day: "2-digit", 
                                                                        month: "2-digit", 
                                                                        year: "numeric",
                                                                        hour: "2-digit", 
                                                                        minute: "2-digit" 
                                                                    })}`
                                                                    : "Sin fecha límite"
                                                                }
                                                            </p>
                                                        </div>

                                                        {/* Botón editar (Opcional, puedes añadir los botones de borrar y editar aquí igual que arriba) */}
                                                        <button type="button" className="flex items-center gap-2 text-yellow-600 hover:bg-white rounded-xl px-3 py-2 text-sm transition w-fit"
                                                            onClick={() => { setOpenFormSubjectIdTaskId({subjectId: subject.id, taskId: task.id}); }}
                                                        >
                                                            <div className="w-5 h-5 bg-yellow-600 text-white rounded-full flex items-center justify-center">
                                                                <Pencil size={12} />
                                                            </div>
                                                        </button>

                                                        {/* Botón borrar */}
                                                        <button type="button" className="flex items-center gap-2 text-red-600 hover:bg-white rounded-xl px-3 py-2 text-sm transition w-fit"
                                                            onClick={() => { handleDeleteTask(subject.id, task.id); }}  
                                                        >
                                                            <div className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center">
                                                                <X size={12} />
                                                            </div>
                                                        </button>

                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;