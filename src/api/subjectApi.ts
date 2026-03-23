import api from "./axiosConfig";
import type { SubjectResponse } from "../types";

export const getSubjects = async (): Promise<SubjectResponse[]> => {
    const response = await api.get("/subjects");
    return response.data;
}