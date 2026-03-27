import api from "./axiosConfig";
import type { SubjectRequest, SubjectResponse } from "../types";

export const getSubjects = async (): Promise<SubjectResponse[]> => {
    const response = await api.get(`subjects`);
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
        archived
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