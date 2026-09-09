import api from "./axiosConfig";
import type { RecurringTaskResponse } from "../types";

export const addRecurringTask = async (
    subjectId: number,
    taskData: { title: string; description?: string; periodicidad: string; time?: string; endDate?: string }
): Promise<RecurringTaskResponse> => {
    const response = await api.post(`/subjects/${subjectId}/recurring-tasks`, {
        title: taskData.title,
        description: taskData.description,
        frequency: taskData.periodicidad,
        time: taskData.time || null,
        endDate: taskData.endDate || null,
        subjectId: subjectId
    });
    return response.data;
};

export const getRecurringTasks = async (subjectId: number): Promise<RecurringTaskResponse[]> => {
    const response = await api.get(`/subjects/${subjectId}/recurring-tasks`);
    return response.data;
};

export const toggleRecurringTaskActive = async (subjectId: number, recurringTaskId: number, active: boolean): Promise<RecurringTaskResponse> => {
    const response = await api.patch(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}/active`, { active });
    return response.data;
};

export const deleteRecurringTask = async (subjectId: number, recurringTaskId: number): Promise<void> => {
    await api.delete(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}`);
};

export const updateRecurringTask = async (
    subjectId: number,
    recurringTaskId: number,
    taskData: { title: string; description?: string; frequency: string; time?: string; endDate?: string; subjectId: number }
): Promise<RecurringTaskResponse> => {
    const response = await api.put(`/subjects/${subjectId}/recurring-tasks/${recurringTaskId}`, {
        ...taskData,
        time: taskData.time || null,
        endDate: taskData.endDate || null
    });
    return response.data;
};