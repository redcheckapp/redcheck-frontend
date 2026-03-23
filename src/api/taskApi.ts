import api from "./axiosConfig";
import type { TaskResponse } from "../types";

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