// src/lib/auth.ts
import { useAuthStore } from "@/stores/authStore";

/**
 * Returns true if a user is logged in (cookie validated via /auth/me)
 */
export const isAuthenticated = () => {
  const { user } = useAuthStore.getState();
  return !!user;
};

/**
 * Returns true if logged-in user is a doctor
 */
export const isDoctor = () => {
  const { user } = useAuthStore.getState();
  return user?.role === "doctor";
};
