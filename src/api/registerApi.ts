import api from "./axiosConfig"; // Importamos la instancia configurada
import type { RegisterForm } from "../types";

export const register = async (form : RegisterForm): Promise<void> => {
    await api.post('/auth/register', form);
};