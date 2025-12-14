// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,

      /** Restore user from backend using cookie */
      fetchMe: async () => {
        try {
          const res = await api.get("/auth/me"); // cookie-based
          set({ user: res.data.user, loading: false });
        } catch {
          set({ user: null, loading: false });
        }
      },

      /** Logout clears cookie + state */
      logout: async () => {
        await api.post("/auth/logout");
        set({ user: null, loading: false });
        window.location.href = "/login";
      },
    }),
    {
      name: "admin-auth", // localStorage key
      partialize: (state) => ({
        user: state.user, // only persist user
      }),
    }
  )
);
