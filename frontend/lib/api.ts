import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to attach token to every request
api.interceptors.request.use(
  (config) => {
    // Check localStorage or sessionStorage for token
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token")
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
