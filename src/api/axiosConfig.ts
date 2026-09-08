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

// If a stored token gets rejected (expired/invalid), clear it and bounce to
// login. Guarded by "a token was actually sent" so a plain failed login
// attempt (no token yet) still falls through to the caller's own error
// handling instead of being redirected away before it can show its message.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && localStorage.getItem("token")) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("focusTipDismissed");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;