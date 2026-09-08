import axios from "axios";

const api = axios.create({
    // Vite will replace this with your IP/Domain at build time
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