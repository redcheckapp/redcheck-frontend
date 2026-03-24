import api from "./axiosConfig";
import type { TaskRequest, TaskResponse } from "../types";

export const getTodayTasks = async (subjectId: number): Promise<TaskResponse[]> => {
    const response = await api.get(`/subjects/${subjectId}/tasks?completed=false`);
    return response.data;
}

export const toggleTask = async (
    subjectId: number,
    taskId: number,
    completed: boolean
): Promise<TaskResponse> => {
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