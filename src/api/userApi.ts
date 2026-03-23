import api from "./axiosConfig";
import type { UserResponse } from "../types";

export const getUsername = async (): Promise<UserResponse> => {
    const response = await api.get(`users/profile`);
    return response.data;
}