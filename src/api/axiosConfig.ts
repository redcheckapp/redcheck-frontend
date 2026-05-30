import axios from "axios";

const api = axios.create({
    // Vite reemplazará esto por tu IP/Dominio en tiempo de compilación
    baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;