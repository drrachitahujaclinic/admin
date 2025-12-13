// hooks/useAdminAppointments.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Appointment = {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: "DEHRADUN" | "ROORKEE" | "ONLINE";
  status: string;
  gender: "M" | "F";
  name?: string;
  age: string;
  patientName: string;
  patientPhone: string;
};

export type AppointmentsResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  appointments: Appointment[];
};

type Params = {
  view: string;
  date?: string;
  q?: string;
  page: number;
  limit: number;
};

export const useAdminAppointments = (params: Params) => {
  return useQuery<AppointmentsResponse>({
    queryKey: ["admin-appointments", params],
    queryFn: async () => {
      const res = await api.get("/admin/appointments", { params });
      return res.data;
    },
  });
};
