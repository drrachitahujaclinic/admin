"use client";

import { useState } from "react";
import { useAdminAppointments } from "@/hooks/useAdminAppointments";
import { appointmentColumns } from "@/components/admin/AppointmentsTable";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AdminAppointmentsPage() {
  const [view, setView] = useState("today");
  const [date, setDate] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading } = useAdminAppointments({
    view,
    date,
    q: search || undefined,
    page,
    limit,
  });

  const table = useReactTable({
    data: data?.appointments || [],
    columns: appointmentColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Appointments
        </h1>
        <p className="text-sm text-gray-500">
          Manage and review all patient appointments
        </p>
      </div>

      {/* FILTER BAR */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Tabs value={view} onValueChange={(v) => {
            setView(v);
            setPage(1);
            setDate(undefined);
          }}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />

          <Input
            type="date"
            value={date || ""}
            onChange={(e) => {
              setDate(e.target.value || undefined);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">
            Loading appointments…
          </p>
        ) : table.getRowModel().rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            No appointments found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left font-medium text-gray-600"
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
                    className="border-b hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3">
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

        {/* PAGINATION */}
        {data && (
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages} • {data.total} total
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
