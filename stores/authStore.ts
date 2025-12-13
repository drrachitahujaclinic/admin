// src/stores/authStore.ts
import { create } from "zustand";
import { api } from "@/lib/api";

export type UserRole = "doctor" | "patient";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;

  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const res = await api.get("/auth/me"); // cookie-based
      set({ user: res.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await api.post("/auth/logout");
    set({ user: null });
    window.location.href = "/login";
  },
}));
