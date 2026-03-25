import api from "./axiosConfig";
import type { ProgressRecord } from "../types";

export const getProgressHeatmap = async (): Promise<ProgressRecord[]> => {
    const response = await api.get('/progress/heatmap');
    return response.data;
};