import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 12000,
  headers: {
    "Content-Type": "application/json"
  }
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error || error?.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);
