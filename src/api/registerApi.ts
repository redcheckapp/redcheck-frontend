import axios from "axios";
import type { RegisterForm } from "../types";

const API_URL = "http://localhost:8080";

export const register = async (form : RegisterForm): Promise<void> => {
    await axios.post(`${API_URL}/auth/register`, form);
}