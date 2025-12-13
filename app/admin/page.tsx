"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { Calendar, Users, Clock, CheckCircle, XCircle, Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

/* ================= TYPES ================= */

type Appointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: "DEHRADUN" | "ROORKEE" | "ONLINE";
  status: string;
  gender: "M" | "F";
  name: string; // appointment owner (optional use)
  age: string;
  patientName: string;
  patientPhone: string;
};

type DashboardResponse = {
  stats: {
    todaysAppointments: number;
    upcomingAppointments: number;
    totalPatients: number;
  };
  todaysAppointmentsTable: Appointment[];
};

/* ================= PAGE ================= */

export default function AdminDashboardPage() {
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data;
    },
  });

  /* ================= TABLE ================= */
  const statusConfig: Record<
    string,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  > = {
    confirmed: {
      label: "Confirmed",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: <Check className="h-4 w-4" />,
    },
    completed: {
      label: "Completed",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border border-red-200",
      icon: <XCircle className="h-4 w-4" />,
    },
  };

  const columns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      {
        header: "Time",
        accessorFn: (row) => `${row.startTime} – ${row.endTime}`,
      },
      {
        header: "Patient",
        accessorKey: "patientName",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.patientName}</p>
            <p className="text-xs text-gray-500">
              {row.original.gender}, {row.original.age} yrs
            </p>
          </div>
        ),
      },
      {
        header: "Phone",
        accessorKey: "patientPhone",
      },
      {
        header: "Mode",
        accessorKey: "city",
        cell: ({ row }) => (
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${
              row.original.city === "ONLINE"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {row.original.city}
          </span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.original.status?.toLowerCase();
          const config = statusConfig[status] ?? {
            label: status || "Unknown",
            className: "bg-gray-100 text-gray-600 border border-gray-200",
            icon: <Clock className="h-4 w-4" />,
          };

          return (
            <span
              className={`
          inline-flex items-center gap-1.5
          rounded-full px-3 py-1
          text-xs font-medium
          ${config.className}
        `}
            >
              {config.icon}
              {config.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/admin/appointments/${row.original.id}`}
            className="text-primary font-medium"
          >
            <Button variant={"secondary"} className="rounded-full h-fit py-2 px-6 text-xs cursor-pointer">View</Button>
            
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.todaysAppointmentsTable ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ================= STATES ================= */

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  if (!data) return null;

  /* ================= UI ================= */

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="text-sm text-gray-500">
          Operational overview for{" "}
          <span className="font-medium text-gray-700">{todayLabel}</span>
        </p>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Today’s Appointments"
          value={data.stats.todaysAppointments}
          icon={<Calendar className="w-5 h-5" />}
          accent="blue"
        />

        <StatCard
          title="Upcoming Appointments"
          value={data.stats.upcomingAppointments}
          icon={<Clock className="w-5 h-5" />}
          accent="indigo"
        />

        <StatCard
          title="Total Patients"
          value={data.stats.totalPatients}
          icon={<Users className="w-5 h-5" />}
          accent="emerald"
        />
      </section>

      {/* Appointments Table */}
      <section>
        <Card className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold text-gray-900">
                Today’s Appointments
              </h2>
              <p className="text-sm text-gray-500">
                All consultations scheduled for today
              </p>
            </div>

            <Link
              href="/admin/appointments"
              className="
              text-sm font-medium text-primary
              hover:underline underline-offset-4
              bg-blue-800 rounded-full text-white px-6 py-2 border-gray-200
            "
            >
              View all
            </Link>
          </div>

          {/* Card Content */}
          <div className="p-6">
            {table.getRowModel().rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>

                <p className="text-sm font-medium text-gray-700">
                  No appointments today
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  You have no scheduled consultations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="
                            px-4 py-3 text-left
                            text-xs font-semibold uppercase tracking-wide
                            text-gray-600
                          "
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="
                        transition-colors
                        hover:bg-gray-50/70
                      "
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-gray-700">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );

  function StatCard({
    title,
    value,
    icon,
    accent,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    accent: "blue" | "indigo" | "emerald";
  }) {
    const accentMap = {
      blue: "bg-blue-50 text-blue-600",
      indigo: "bg-indigo-50 text-indigo-600",
      emerald: "bg-emerald-50 text-emerald-600",
    };

    return (
      <Card
        className="
      group relative overflow-hidden
      rounded-2xl border border-gray-200/70
      bg-white
      p-6
      shadow-sm
      transition-all duration-300
      hover:shadow-md hover:border-gray-300
    "
      >
        <div className="flex items-center gap-5">
          {/* Icon Container */}
          <div
            className={`
          relative flex h-12 w-12 items-center justify-center
          rounded-xl
          ring-1 ring-black/5
          transition-transform duration-300
          group-hover:scale-105
          ${accentMap[accent]}
        `}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 leading-tight">
              {title}
            </span>

            <span className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              {value}
            </span>
          </div>
        </div>

        {/* Subtle bottom accent */}
        <div
          className="
        pointer-events-none absolute inset-x-0 bottom-0 h-0.5
        bg-linear-to-r from-transparent via-black/5 to-transparent
      "
        />
      </Card>
    );
  }
}
