import api from "./axiosConfig";
import type { AppNotification } from "../types";

// Unread replies to the user's own feedback, newest first.
export const getUnreadFeedbackReplies = async (): Promise<AppNotification[]> => {
    const response = await api.get(`notifications`, { params: { read: false, type: "FEEDBACK_REPLY" } });
    return response.data;
}

export const markNotificationRead = async (id: number): Promise<void> => {
    await api.patch(`notifications/${id}/read`);
}
