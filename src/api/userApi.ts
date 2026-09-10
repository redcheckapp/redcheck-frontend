import api from "./axiosConfig";
import type { UserResponse } from "../types";

export const getUsername = async (): Promise<UserResponse> => {
    const response = await api.get(`users/profile`);
    return response.data;
}

export const deleteUser = async (): Promise<void> => {
    await api.delete(`users/me`)
}

export const changePassword = async (currentPassword: string | null, newPassword: string): Promise<void> => {
    await api.patch(`users/me/password`, { currentPassword, newPassword });
}