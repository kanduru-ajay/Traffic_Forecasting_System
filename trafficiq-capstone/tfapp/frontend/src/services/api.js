import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem("access_token", res.data.access);
          err.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register/", data),
  login: (data) => api.post("/auth/login/", data),
  profile: () => api.get("/auth/profile/"),
};

export const datasetAPI = {
  list: () => api.get("/datasets/"),
  upload: (formData) => api.post("/datasets/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  detail: (id) => api.get(`/datasets/${id}/`),
  delete: (id) => api.delete(`/datasets/${id}/`),
};

export const modelAPI = {
  list: (params) => api.get("/models/", { params }),
  train: (data) => api.post("/models/train/", data),
  detail: (id) => api.get(`/models/${id}/`),
  best: (datasetId) => api.get(`/models/best/${datasetId}/`),
  delete: (id) => api.delete(`/models/${id}/`),
};

export const predictionAPI = {
  list: (params) => api.get("/predictions/", { params }),
  forecast: (data) => api.post("/predictions/forecast/", data),
  detail: (id) => api.get(`/predictions/${id}/`),
};

export const insightAPI = {
  list: (params) => api.get("/insights/", { params }),
  generate: (predictionId) => api.post(`/insights/generate/${predictionId}/`),
};

export default api;
