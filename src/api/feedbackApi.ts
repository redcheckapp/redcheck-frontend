import api from "./axiosConfig";
import type { FeedbackRequest, FeedbackResponse } from "../types";

export const postFeedback = async (data: FeedbackRequest): Promise<FeedbackResponse> => {
    const response = await api.post(`feedback`, data);
    return response.data;
}
