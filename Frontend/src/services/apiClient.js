import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for token injection
apiClient.interceptors.request.use(
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

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Directly return the success response body
  },
  (error) => {
    // Normalize error shape
    const normalizedError = {
      message: "An unexpected error occurred. Please try again.",
      errorCode: "UNKNOWN_ERROR",
      status: error.response?.status || 500,
    };

    if (error.response?.data) {
      normalizedError.message = error.response.data.message || normalizedError.message;
      normalizedError.errorCode = error.response.data.errorCode || normalizedError.errorCode;
    } else if (error.message) {
      normalizedError.message = error.message;
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
