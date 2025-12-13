"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarX, Trash2, Save, IndianRupee } from "lucide-react";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ===================== TYPES ===================== */

type PricingSettings = {
  appointmentFee: number; // paise
  currency: string;
};

type BlockedDate = {
  _id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
};

/* ===================== PAGE ===================== */

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  /* ===================== PRICING ===================== */

  const { data: pricing } = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const res = await api.get("/admin/pricing");
      return res.data.settings as PricingSettings;
    },
  });

  const [appointmentFee, setAppointmentFee] = useState(0);
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if (pricing) {
      const fee = pricing.appointmentFee / 100;
      const curr = pricing.currency;
      // Defer state updates to the next microtask to avoid synchronous setState within the effect
      queueMicrotask(() => {
        setAppointmentFee(fee);
        setCurrency(curr);
      });
    }
  }, [pricing]);

  const updatePricing = useMutation({
    mutationFn: async () =>
      api.patch("/admin/pricing", {
        appointmentFee: Math.round(appointmentFee * 100),
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      alert("Pricing updated");
    },
  });

  /* ===================== BLOCKED DATES ===================== */

  const { data: blockedDates = [] } = useQuery({
    queryKey: ["blocked-dates"],
    queryFn: async () => {
      const res = await api.get("/blocked-dates");
      return res.data.blockedDates as BlockedDate[];
    },
  });

  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const addBlockedDate = useMutation({
    mutationFn: async () =>
      api.post("/blocked-dates", { date, reason }),
    onSuccess: () => {
      setDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
    },
  });

  const removeBlockedDate = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/blocked-dates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
    },
  });

  /* ===================== UI ===================== */

  return (
    <div className="max-w-4xl space-y-10">

      {/* ===================== HEADER ===================== */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Clinic Settings
        </h1>
        <p className="text-sm text-gray-500">
          Manage pricing and availability
        </p>
      </div>

      {/* ===================== PRICING ===================== */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Consultation Fee</h2>
        </div>

        <div className="space-y-2 max-w-xs">
          <label className="text-sm font-medium">Default Fee (₹)</label>
          <Input
            type="number"
            min={0}
            value={appointmentFee}
            onChange={(e) => setAppointmentFee(Number(e.target.value))}
          />
        </div>


        <Button
          onClick={() => updatePricing.mutate()}
          disabled={updatePricing.isPending}
          className="flex gap-2"
        >
          <Save className="w-4 h-4" />
          Save Pricing
        </Button>
      </Card>

      {/* ===================== BLOCKED DATES ===================== */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CalendarX className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Blocked Dates</h2>
        </div>

        {/* Add Blocked Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            onClick={() => addBlockedDate.mutate()}
            disabled={!date || addBlockedDate.isPending}
          >
            Block Date
          </Button>
        </div>

        {/* List */}
        {blockedDates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No blocked dates
          </p>
        ) : (
          <div className="divide-y border rounded-lg">
            {blockedDates.map((bd) => (
              <div
                key={bd._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {new Date(bd.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {bd.reason && (
                    <p className="text-xs text-gray-500">
                      {bd.reason}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeBlockedDate.mutate(bd._id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
