import api from "./axiosConfig";

export const addRecurringTask = async (
    subjectId: number, 
    taskData: { title: string; description?: string; periodicidad: string }
) => {
    const response = await api.post(`/subjects/${subjectId}/recurring-tasks`, {
        title: taskData.title,
        description: taskData.description,
        frequency: taskData.periodicidad,
        subjectId: subjectId
    });
    return response.data;
};

// Obtener todas las rutinas de una asignatura
export const getRecurringTasks = async (subjectId: number) => {
    const response = await api.get(`/subjects/${subjectId}/recurring-tasks`);
    return response.data;
};

// Pausar/Reactivar una rutina
export const toggleRecurringTaskActive = async (subjectId: number, recurringTaskId: number, active: boolean) => {
    const response = await api.patch(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}/active`, { active });
    return response.data;
};

// Borrar una rutina para siempre
export const deleteRecurringTask = async (subjectId: number, recurringTaskId: number) => {
    await api.delete(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}`);
};

// Actualizar una rutina (añade esto en taskApi.ts)
export const updateRecurringTask = async (
    subjectId: number, 
    recurringTaskId: number, 
    taskData: { title: string; description?: string; frequency: string; subjectId: number }
) => {
    const response = await api.put(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}`, taskData);
    return response.data;
};