import api from "./axiosConfig"; // We import the configured instance
import type { AuthResponse, LoginForm } from "../types";

export const login = async (form : LoginForm): Promise<AuthResponse> => {
    // The base URL and interceptors are applied automatically
    const response = await api.post('/auth/login', form);
    return response.data;
};

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
};

export const forgotPassword = async (email: string, lang: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email, lang });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
};