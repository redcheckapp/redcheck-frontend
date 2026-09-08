import api from "./axiosConfig"; // We import the configured instance
import type { AuthResponse, LoginForm } from "../types";

export const login = async (form : LoginForm): Promise<AuthResponse> => {
    // The base URL and interceptors are applied automatically
    const response = await api.post('/auth/login', form);
    return response.data;
};