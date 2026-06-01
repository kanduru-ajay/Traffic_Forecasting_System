import { create } from "zustand";
import { authAPI } from "../services/api";
import {jwtDecode} from "jwt-decode";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp > Date.now() / 1000) {
          set({ user: decoded, isAuthenticated: true });
        } else {
          localStorage.clear();
        }
      } catch {
        localStorage.clear();
      }
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const res = await authAPI.login(credentials);
      const { access, refresh } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      const user = jwtDecode(access);
      set({ user, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.detail || "Login failed", loading: false });
      return { success: false };
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
