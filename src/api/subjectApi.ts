import api from "./axiosConfig";
import type { SubjectRequest, SubjectResponse, SubjectWithTasks } from "../types";

export const getSubjects = async (): Promise<SubjectResponse[]> => {
    const response = await api.get(`subjects`);
    return response.data;
}

// Single-call dashboard fetch: subjects with their pending/completed-today
// tasks already nested, avoiding one tasks request per subject (see
// refreshData() in DashboardPage.tsx).
export const getSubjectsWithTasks = async (): Promise<SubjectWithTasks[]> => {
    const response = await api.get(`subjects/with-tasks`);
    return response.data;
}

export const postSubject = async (subjectData: SubjectRequest): Promise<SubjectResponse> => {
    const response = await api.post(
        `subjects`,
        subjectData
    );
    return response.data;
}

export const archiveSubject = async (subjectId: number, archived: boolean): Promise<SubjectResponse> => {
    const response = await api.patch(
        `subjects/${subjectId}/archive`,
        { archived }
    );
    return response.data;
}

export const deleteSubject = async (subjectId: number): Promise<void> => {
    await api.delete(`subjects/${subjectId}`);
}

export const updateSubject = async (subjectId: number, subjectData: SubjectRequest): Promise<SubjectResponse> => {
    const response = await api.put(
        `subjects/${subjectId}`,
        subjectData
    );
    return response.data;
}

export const getTrashSubjects = async (): Promise<SubjectResponse[]> => {
    const response = await api.get(`subjects?deleted=true`);
    return response.data;
}

export const restoreSubject = async (subjectId: number): Promise<SubjectResponse> => {
    const response = await api.patch(`subjects/${subjectId}/restore`);
    return response.data;
}

export const hardDeleteSubject = async (subjectId: number): Promise<void> => {
    await api.delete(`subjects/${subjectId}/force`);
}