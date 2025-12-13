"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import Link from "next/link";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ====================== TYPES ====================== */

type Appointment = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: "DEHRADUN" | "ROORKEE" | "ONLINE";
  status: string;
};

type Patient = {
  _id: string;
  name: string;
  phone: string;
  gender: "M" | "F";
  age: string;
};

type AppointmentPagination = {
  data: Appointment[];
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
};

type PatientResponse = {
  patient: Patient;
  appointments: AppointmentPagination;
};

/* ====================== TABLE COLUMNS ====================== */

const columns: ColumnDef<Appointment>[] = [
  {
    header: "Date",
    cell: ({ row }) =>
      {return (
      <span
        className="font-bold"
      >
        {new Date(row.original.date).toLocaleDateString("en-IN")},
      </span>
    );}
  },
  {
    header: "Time",
    cell: ({ row }) =>
    {return (
      <span
        className="font-bold"
      >
        {row.original.startTime}
      </span>
    );}
  },
  {
    header: "City",
    accessorKey: "city",
  },
  {
  header: "Status",
  cell: ({ row }) => {
    const status = row.original.status;

    const statusStyles: Record<string, string> = {
      confirmed: "bg-green-50 text-green-700 border-green-200",
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
          statusStyles[status] ?? "bg-gray-50 text-gray-600 border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  },
},

  {
    header: "Action",
    cell: ({ row }) => (
      <Link href={`/admin/appointments/${row.original._id}`}>
        <Button className="cursor-pointer" size="sm" variant="secondary">
          View
        </Button>
      </Link>
    ),
  },
];

/* ====================== PAGE ====================== */

export default function AdminPatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /* ====================== PAGINATION STATE ====================== */

  const [page, setPage] = useState(1);
  const limit = 10;

  /* ====================== DATA FETCH ====================== */

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["admin-patient", id, page],
    queryFn: async () => {
      const res = await api.get(
        `/admin/patients/${id}?page=${page}&limit=${limit}`
      );
      return res.data as PatientResponse;
    },
  });

  /* ====================== SAFE DERIVED DATA ====================== */

  const appointments = useMemo(
    () => data?.appointments?.data ?? [],
    [data]
  );

  const pagination = data?.appointments;

  /* ====================== TABLE INSTANCE ====================== */

  const table = useReactTable({
    data: appointments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ====================== UI STATES ====================== */

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-sm text-gray-500">
        Loading patient details…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-sm text-red-500">
        Failed to load patient details.
      </div>
    );
  }

  const { patient } = data;

  /* ====================== RENDER ====================== */

  return (
    <div className="space-y-8">

      {/* ====================== HEADER ====================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {patient.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {patient.gender === "M" ? "Male" : "Female"} ·{" "}
            {patient.age} yrs · {patient.phone}
          </p>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {/* ====================== APPOINTMENTS ====================== */}
      <Card className="p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Appointments
          </h2>
          {isFetching && (
            <span className="text-xs text-gray-400">
              Updating…
            </span>
          )}
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No appointments found for this patient.
          </p>
        ) : (
          <>
            {/* ====================== TABLE ====================== */}
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left font-medium text-gray-600"
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

                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-gray-700"
                        >
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

            {/* ====================== PAGINATION ====================== */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} ·{" "}
                  {pagination.totalCount} total appointments
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === pagination.totalPages}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
