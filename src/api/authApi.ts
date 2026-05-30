import api from "./axiosConfig"; // Importamos la instancia configurada
import type { AuthResponse, LoginForm } from "../types";

export const login = async (form : LoginForm): Promise<AuthResponse> => {
    // La URL base y los interceptores se aplican automáticamente
    const response = await api.post('/auth/login', form);
    return response.data;
};