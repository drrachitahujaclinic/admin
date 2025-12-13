"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Hospital, Settings, LogOutIcon } from "lucide-react";
import clsx from "clsx";
import { Button } from "../ui/button";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: Calendar,
  },
  {
    label: "Patients",
    href: "/admin/patients",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  
  return (
    <aside className="w-64 h-screen fixed border-r bg-white hidden md:flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex flex-row items-center text-lg font-medium gap-3 text-primary">
          <Hospital/> <p>Clinic Admin</p> 
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-blue-50 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
        <div className="h-30 flex gap-2 items-center ml-4">
        <Button onClick={logout} variant="default" className="text-red-500 bg-white hover:bg-red-500 hover:text-white cursor-pointer border border-red-500 flex flex-row items-center gap-3">
          <p>Log out</p>
          <LogOutIcon className="h-4 w-4"/>
        </Button>
        
      </div>
      </nav>
      
    </aside>
  );
}
