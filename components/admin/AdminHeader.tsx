"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export default function AdminHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <header className="z-50 h-16 fixed w-screen ml-64 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-light text-gray-800">
        Welcome, <span className="font-medium">Dr. Rachit Ahuja</span>
      </h1>

      <Button
        variant="ghost"
        size="sm"
        onClick={logout}
        className="flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </header>
  );
}
