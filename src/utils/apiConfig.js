import axios from "axios";

export const API_BASE_URL =
  "https://fall25-swp-be-production-9b48.up.railway.app";
  // "http://localhost:8080";

const getAuthToken = () =>
  JSON.parse(localStorage.getItem("currentUser") || "{}")?.token || null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("currentUser");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const handleAPIError = (err) => {
  const s = err.response?.status;
  const msg =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.response?.data?.details ||
    err.message;

  if (s === 401) {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
    return msg || "Session expired.";
  }
  if (s === 403) return msg || "Access denied.";
  if (s === 404) return msg || "Not found.";
  if (s === 500) return msg || "Server error.";
  return msg || "Unexpected error.";
};
