import api from "./axiosConfig";
import type { AdminFeedback, AdminFeedbackUpdate, AiUsageStats, SystemStatus, UserStats } from "../types";

export const getAdminFeedback = async (): Promise<AdminFeedback[]> => {
    const response = await api.get(`admin/feedback`);
    return response.data;
}

export const updateAdminFeedback = async (id: number, data: AdminFeedbackUpdate): Promise<AdminFeedback> => {
    const response = await api.patch(`admin/feedback/${id}`, data);
    return response.data;
}

// Sends the feedback's author an in-app notification (shown in their bell),
// and optionally the same text by email from the no-reply address. `lang`
// picks that email's template language.
export const notifyFeedbackAuthor = async (id: number, message: string, sendEmail: boolean, lang: string): Promise<AdminFeedback> => {
    const response = await api.post(`admin/feedback/${id}/notify`, { message, sendEmail, lang });
    return response.data;
}

export const getAiUsage = async (days = 30): Promise<AiUsageStats> => {
    const response = await api.get(`admin/ai-usage`, { params: { days } });
    return response.data;
}

export const getUserStats = async (days = 30): Promise<UserStats> => {
    const response = await api.get(`admin/user-stats`, { params: { days } });
    return response.data;
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
    const response = await api.get(`admin/system`);
    return response.data;
}
