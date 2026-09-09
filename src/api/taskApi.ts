import api from "./axiosConfig";
import type { TaskRequest, TaskResponse } from "../types";

export const getTodayTasks = async (subjectId: number): Promise<TaskResponse[]> => {
    const response = await api.get(`/subjects/${subjectId}/tasks?completed=false`);
    return response.data;
}

// Calendar history: every task (pending or completed) across all subjects
// whose deadline falls within [from, to] (both "YYYY-MM-DD"), in one call —
// used by AgendaView for past days, which the dashboard-scoped `subjects`
// data never covers (see getSubjectsWithTasks/getTodayTasks above).
export const getTasksForDateRange = async (from: string, to: string): Promise<TaskResponse[]> => {
    const response = await api.get(`/tasks?from=${from}&to=${to}`);
    return response.data;
}

export const toggleTask = async (subjectId: number, taskId: number, completed: boolean): Promise<TaskResponse> => {
    const response = await api.patch(
        `/subjects/${subjectId}/tasks/${taskId}/complete`,
        { completed }
    );
    return response.data;
}

export const addNewTask = async (subjectId: number, taskData: TaskRequest): Promise<TaskResponse> => {
    const response = await api.post(
        `subjects/${subjectId}/tasks`,
        taskData
    );
    return response.data;
}

export const deleteTask = async (subjectId: number, taskId: number): Promise<void> => {
    await api.delete(`subjects/${subjectId}/tasks/${taskId}`);
}

export const updateTask = async (subjectId: number, taskId: number, taskData: TaskRequest): Promise<TaskResponse> => {
    const response = await api.put(
        `subjects/${subjectId}/tasks/${taskId}`,
        taskData
    );
    return response.data;
}

export const getTrashTasks = async (subjectId: number): Promise<TaskResponse[]> => {
    const response = await api.get(`/subjects/${subjectId}/tasks?deleted=true`);
    return response.data;
}

export const restoreTask = async (subjectId: number, taskId: number): Promise<TaskResponse> => {
    const response = await api.patch(`subjects/${subjectId}/tasks/${taskId}/restore`);
    return response.data;
}

export const hardDeleteTask = async (subjectId: number, taskId: number): Promise<void> => {
    await api.delete(`subjects/${subjectId}/tasks/${taskId}/force`);
}