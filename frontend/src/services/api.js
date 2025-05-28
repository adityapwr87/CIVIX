import axios from "axios";

// Set up the base URL for the backend API
const API = axios.create({ baseURL: "http://localhost:4000/api" });

// Add a request interceptor to include the token in headers if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication routes
export const login = (credentials) => API.post("/auth/login", credentials);
export const register = (userData) => API.post("/auth/register", userData);

export default {

};
