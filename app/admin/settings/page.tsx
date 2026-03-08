"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarX, Trash2, Save, IndianRupee } from "lucide-react";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ===================== TYPES ===================== */

type ClinicPrice = {
  cutoffFee: number;
  discountedFee: number;
};

type PricingSettings = {
  currency: string;
  pricingByCity: Record<string, ClinicPrice>;
};

type BlockedDate = {
  _id: string;
  date: string; // YYYY-MM-DD
  reason?: string;
};

type BlockedSlot = {
  _id: string;
  date: string;
  startTime: string;
  city: "DEHRADUN" | "ROORKEE" | "ONLINE";
};

type Slot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

/* ===================== PAGE ===================== */

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [slotCity, setSlotCity] = useState("DEHRADUN");

  /* ===================== PRICING ===================== */

  const { data: pricing } = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const res = await api.get("/admin/pricing");
      return res.data.settings as PricingSettings;
    },
  });

  const [pricingMap, setPricingMap] = useState<Record<string, ClinicPrice>>({
    DEHRADUN: { cutoffFee: 0, discountedFee: 0 },
    ROORKEE: { cutoffFee: 0, discountedFee: 0 },
    ONLINE: { cutoffFee: 0, discountedFee: 0 },
  });
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    if (pricing?.pricingByCity) {
      const map: any = {};

      Object.entries(pricing.pricingByCity).forEach(([city, value]: any) => {
        map[city] = {
          cutoffFee: value.cutoffFee / 100,
          discountedFee: value.discountedFee / 100,
        };
      });

      setPricingMap(map);
    }
  }, [pricing]);

  const updatePricing = useMutation({
    mutationFn: async (data: any) => api.patch("/admin/pricing", data),

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
    mutationFn: async () => api.post("/blocked-dates", { date, reason }),
    onSuccess: () => {
      setDate("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
    },
  });

  const removeBlockedDate = useMutation({
    mutationFn: async (id: string) => api.delete(`/blocked-dates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates"] });
    },
  });

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ["blocked-slots"],
    queryFn: async () => {
      const res = await api.get("/admin/blocked-slots");
      return res.data.blockedSlots as BlockedSlot[];
    },
  });

  const { data: adminSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["admin-slots", slotDate, slotCity],
    queryFn: async () => {
      if (!slotDate || !slotCity) return [];

      const res = await api.get(`/slots?date=${slotDate}&clinic=${slotCity}`);

      return res.data.slots as Slot[];
    },
    enabled: !!slotDate && !!slotCity,
  });

  const removeBlockedSlot = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/blocked-slots/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
    },
  });

  const addBlockedSlot = useMutation({
    mutationFn: async (slot: Slot) =>
      api.post("/admin/blocked-slots", {
        date: slotDate,
        city: slotCity,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-slots"] });
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
        <p className="text-sm text-gray-500">Manage pricing and availability</p>
      </div>

      {/* ===================== PRICING ===================== */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Clinic Pricing</h2>
        </div>

        <div className="space-y-6">
          {["DEHRADUN", "ROORKEE", "ONLINE"].map((city) => (
            <div key={city} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">{city}</h3>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="text-xs">Original Price (₹)</label>
                  <Input
                    type="number"
                    value={pricingMap[city]?.cutoffFee || 0}
                    onChange={(e) => {
                      setPricingMap((prev) => ({
                        ...prev,
                        [city]: {
                          ...prev[city],
                          cutoffFee: Number(e.target.value),
                        },
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs">Discounted Price (₹)</label>
                  <Input
                    type="number"
                    value={pricingMap[city]?.discountedFee || 0}
                    onChange={(e) => {
                      setPricingMap((prev) => ({
                        ...prev,
                        [city]: {
                          ...prev[city],
                          discountedFee: Number(e.target.value),
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            updatePricing.mutate({
              pricingByCity: Object.fromEntries(
                Object.entries(pricingMap).map(([city, val]) => [
                  city,
                  {
                    cutoffFee: Math.round(val.cutoffFee * 100),
                    discountedFee: Math.round(val.discountedFee * 100),
                  },
                ]),
              ),
            });
          }}
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
          <p className="text-sm text-gray-500">No blocked dates</p>
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
                    <p className="text-xs text-gray-500">{bd.reason}</p>
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

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <CalendarX className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Blocked Slots</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-4">
          <div className="flex w-full gap-4">
            <Input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="w-40"
            />

            <select
              className="border rounded-lg px-3"
              value={slotCity}
              onChange={(e) => setSlotCity(e.target.value)}
            >
              <option value="DEHRADUN">Dehradun</option>
              <option value="ROORKEE">Roorkee</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {slotDate && slotCity && (
            <div className="space-y-2">
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Loading slots...</p>
              ) : adminSlots.length === 0 ? (
                <p className="text-sm text-gray-500">No slots available</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {adminSlots.map((slot) => (
                    <Button
                      key={slot.startTime}
                      variant="outline"
                      className="text-xs"
                      disabled={!slot.available}
                      onClick={() => addBlockedSlot.mutate(slot)}
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {blockedSlots.length === 0 ? (
          <p className="text-sm text-gray-500">No blocked slots</p>
        ) : (
          <div className="divide-y border rounded-lg">
            {blockedSlots.map((slot: any) => (
              <div
                key={slot._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {slot.city} • {slot.date} • {slot.startTime}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeBlockedSlot.mutate(slot._id)}
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
