// components/admin/appointments/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

export type Appointment = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: "DEHRADUN" | "ROORKEE" | "ONLINE";
  status: "confirmed" | "cancelled" | "completed" | string;
  gender: "M" | "F";
  name?: string;
  age: string;
  patientName: string;
  patientPhone: string;
};

const statusStyles: Record<string, string> = {
  confirmed:
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed:
    "bg-blue-50 text-blue-700 border border-blue-200",
  cancelled:
    "bg-red-50 text-red-700 border border-red-200",
};

const cityStyles: Record<string, string> = {
  DEHRADUN:
    "bg-gray-100 text-gray-700 border border-gray-200",
  ROORKEE:
    "bg-gray-100 text-gray-700 border border-gray-200",
  ONLINE:
    "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

export const appointmentColumns: ColumnDef<Appointment>[] = [
  /* Date */
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {getValue() as string}
        </span>
      </div>
    ),
  },

  /* Time */
  {
    header: "Time",
    cell: ({ row }) => (
      <span className="text-sm text-gray-700">
        {row.original.startTime} – {row.original.endTime}
      </span>
    ),
  },

  /* Patient */
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {row.original.patientName}
        </span>
        <span className="text-xs text-gray-500">
          {row.original.patientPhone}
        </span>
      </div>
    ),
  },

  /* City */
  {
    accessorKey: "city",
    header: "City",
    cell: ({ getValue }) => {
      const city = getValue() as string;

      return (
        <span
          className={`
            inline-flex rounded-full px-3 py-1
            text-xs font-medium
            ${cityStyles[city] ?? "bg-gray-100 text-gray-600 border border-gray-200"}
          `}
        >
          {city}
        </span>
      );
    },
  },

  /* Status */
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = (getValue() as string)?.toLowerCase();

      return (
        <span
          className={`
            inline-flex rounded-full px-3 py-1
            text-xs font-medium capitalize
            ${statusStyles[status] ?? "bg-gray-100 text-gray-600 border border-gray-200"}
          `}
        >
          {status}
        </span>
      );
    },
  },

  /* Action */
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link
        href={`/admin/appointments/${row.original._id}`}
        className="
          inline-flex items-center justify-center
          rounded-lg border border-gray-200
          px-3 py-1.5
          text-xs font-medium text-gray-700
          transition
          hover:bg-gray-50 hover:border-gray-300
        "
      >
        View
      </Link>
    ),
  },
];
