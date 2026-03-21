import axios from "axios";
import type { AuthResponse, LoginForm } from "../types";

const API_URL = "http://localhost:8080";

export const login = async (form : LoginForm): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, form);
    return response.data;
};