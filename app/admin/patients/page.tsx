"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, Users, Phone, Eye, Calendar } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ======================= TYPES ======================= */

type Patient = {
  _id: string;
  name: string;
  phone: string;
  gender: "M" | "F";
  age: string;
  totalAppointments: number;
  createdAt: string;
};

type PatientsResponse = {
  patients: Patient[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/* ======================= PAGE ======================= */

export default function AdminPatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-patients", page, search],
    queryFn: async () => {
      const res = await api.get("/admin/patients", {
        params: { page, limit, search },
      });
      return res.data as PatientsResponse;
    },
  });

  const patients = data?.patients ?? [];

  /* ======================= TABLE ======================= */

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: "Patient",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
              {p.name.charAt(0)}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium text-gray-900">
                {p.name}
              </p>
              <p className="text-xs text-gray-500">
                {p.gender === "M" ? "M" : "F"} · {p.age}y
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <Phone className="h-3.5 w-3.5" />
          {row.original.phone}
        </a>
      ),
    },
    {
      accessorKey: "totalAppointments",
      header: "Visits",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {row.original.totalAppointments}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-gray-600">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link href={`/admin/patients/${row.original._id}`}>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer h-7 px-2 text-xs gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: patients,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /* ======================= UI ======================= */

  return (
    <div className="space-y-5">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">
            Patients
          </h1>
        </div>

        {data && (
          <span className="text-xs text-gray-500">
            {data.total} total
          </span>
        )}
      </div>

      {/* ===== Search ===== */}
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-8 text-sm"
        />
      </div>

      {/* ===== Table ===== */}
      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">
            Loading…
          </div>
        ) : patients.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No patients found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600"
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

              <tbody className="divide-y">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
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

      {/* ===== Pagination ===== */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Page {data.page} / {data.totalPages}
          </span>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-7 px-2"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-7 px-2"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
