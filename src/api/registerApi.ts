import api from "./axiosConfig"; // We import the configured instance
import type { RegisterForm } from "../types";

export const register = async (form : RegisterForm): Promise<void> => {
    await api.post('/auth/register', form);
};