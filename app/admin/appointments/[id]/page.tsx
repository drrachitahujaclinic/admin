"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  IndianRupee,
  FileText,
  Paperclip,
} from "lucide-react";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

/* ---------------------------- TYPES ---------------------------- */

type AppointmentResponse = {
  appointment: {
    _id: string;
    city: "DEHRADUN" | "ROORKEE" | "ONLINE";
    date: string;
    startTime: string;
    endTime: string;
    status: "confirmed" | "cancelled" | "completed";
    createdAt: string;

    patientId: {
      _id: string;
      name: string;
      gender: "M" | "F";
      phone: string;
    };

    payment?: {
      amount: number;
      razorpayPaymentId?: string;
      status: "PAID" | "FAILED" | "PENDING";

      method?: "ONLINE" | "PAY_ON_ARRIVAL";
      paidAt?: string;
    };

    meet?: {
      status: "scheduled" | "cancelled" | "ended";
      link?: string;
    };

    documents: {
      _id: string;
      filename: string;
      s3Key: string;
      mimeType: string;
    }[];

    notes: {
      _id: string;
      text?: string;
      createdAt: string;
    }[];
  };
};

type Prescription = {
  _id: string;
  version: number;
  createdAt: string;
  pdfDocumentId: {
    _id: string;
    filename: string;
    s3Key: string;
  };
};

type Note = {
  _id: string;
  text?: string;
  documents?: {
    _id: string;
    filename: string;
    s3Key: string;
    mimeType: string;
  }[];
  createdAt: string;
};

type UploadedDoc = {
  _id: string;
  filename: string;
  mimeType: string;
  s3Key: string;
};

/* ---------------------------- PAGE ---------------------------- */

export default function AdminAppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [markingPaid, setMarkingPaid] = useState(false);

  const {
    data,
    isLoading,
    refetch: refetchAppointment,
  } = useQuery({
    queryKey: ["admin-appointment", id],
    queryFn: async () => {
      const res = await api.get(`/appointments/${id}`);
      return res.data as AppointmentResponse;
    },
  });

  const {
    data: notesData,
    refetch: refetchNotes,
    isLoading: notesLoading,
  } = useQuery({
    queryKey: ["appointment-notes", id],
    queryFn: async () => {
      const res = await api.get(`/appointments/${id}/notes`);
      return res.data.notes as Note[];
    },
  });

  const addNoteMutation = async (payload: {
    text?: string;
    documentIds?: string[];
  }) => {
    await api.post(`/appointments/${id}/notes`, payload);
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    await api.delete(`/appointments/${id}/notes/${noteId}`);
    refetchNotes();
  };

  const markPaymentAsPaid = async () => {
    if (!confirm("Mark this appointment as PAID?")) return;

    try {
      setMarkingPaid(true);
      await api.post(`/appointments/${id}/mark-paid`);

      toast.success("Payment marked as PAID");
      await refetchAppointment();
    } catch (err: any) {
      console.error("markPaymentAsPaid error:", err);
      toast.error(
        err?.response?.data?.error || "Failed to mark payment as paid",
      );
    } finally {
      setMarkingPaid(false);
    }
  };

  const appointment = data?.appointment;
  const patient = appointment?.patientId;
  const isOnline = appointment?.city === "ONLINE";
  const meetLink = appointment?.meet?.link;

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [newDate, setNewDate] = useState("");
  const [newClinic, setNewClinic] = useState(appointment?.city);
  const [newSlot, setNewSlot] = useState<string | null>(null);

  const { data: slotData, isLoading: slotsLoading } = useQuery({
    queryKey: ["admin-slots", newDate, newClinic],
    queryFn: async () => {
      if (!newDate) return { slots: [] };

      const res = await api.get(`/slots?date=${newDate}&clinic=${newClinic}`);
      return res.data;
    },
    enabled: !!newDate,
  });

  function getEndTime(start: string) {
    const [hh, mm] = start.split(":").map(Number);

    const d = new Date();
    d.setHours(hh);
    d.setMinutes(mm + 30);

    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  const rescheduleMutation = async () => {
    if (!newDate || !newSlot) {
      toast.error("Select date and slot");
      return;
    }

    const endTime = getEndTime(newSlot);

    await api.patch(`/appointments/${appointment?._id}`, {
      date: newDate,
      startTime: newSlot,
      endTime,
    });

    toast.success("Appointment rescheduled");

    setShowRescheduleModal(false);

    await refetchAppointment();
  };

  const formattedDate = new Date(
    appointment?.date as string,
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hh = h % 12 || 12;
    const suffix = h >= 12 ? "PM" : "AM";
    return `${hh}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  const awsBase = process.env.NEXT_PUBLIC_AWS_URL;

  const paymentStatus = appointment?.payment?.status || "PENDING";
  const paymentMethod = appointment?.payment?.method || "ONLINE";

  const showMarkPaidButton =
    paymentStatus === "PENDING" && paymentMethod === "PAY_ON_ARRIVAL";

  const [showPrescriptionModal, setShowPrescriptionModal] =
    useState<boolean>(false);

  const {
    data: prescriptionData,
    refetch: refetchPrescriptions,
    isLoading: prescriptionsLoading,
  } = useQuery({
    queryKey: ["appointment-prescriptions", id],
    queryFn: async () => {
      const res = await api.get(`/appointments/${id}/prescriptions`);
      return res.data.prescriptions as Prescription[];
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading appointment…
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="h-screen flex items-center justify-center">
        Appointment not found
      </div>
    );
  }
  /* ============================ UI ============================ */

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Appointment Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Appointment ID:{" "}
            <span className="font-mono text-gray-700">{appointment._id}</span>
          </p>
          <Button
            variant="outline"
            onClick={() => setShowRescheduleModal(true)}
            className="mt-4 cursor-pointer"
          >
            Reschedule Appointment
          </Button>
          <Button
            onClick={() => setShowPrescriptionModal(true)}
            className="cursor-pointer ml-4"
          >
            Create Prescription
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/admin/appointments")}
          >
            All Appointments
          </Button>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---------- PATIENT ---------- */}
          <Card className="p-6">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="h-7 w-7 text-blue-600" />
              </div>

              <div
                onClick={() => router.push("/admin/patients/" + patient?._id)}
                className="flex-1 cursor-pointer"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Patient
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {patient?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {patient?.gender === "M" ? "Male" : "Female"}
                </p>
              </div>

              <a
                href={`tel:${patient?.phone}`}
                className="cursor-pointer inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                <Phone className="h-4 w-4" />
                {patient?.phone}
              </a>
            </div>
          </Card>

          {/* ---------- APPOINTMENT ---------- */}
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-4">
              Appointment
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-800">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-gray-800">
                  {formatTime(appointment.startTime)} –{" "}
                  {formatTime(appointment.endTime)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Video className="h-5 w-5 text-blue-500" />
                ) : (
                  <MapPin className="h-5 w-5 text-red-500" />
                )}
                <span className="text-gray-800">{appointment.city}</span>
              </div>
            </div>
          </Card>

          {/* ---------- PAYMENT ---------- */}
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
              Payment
            </p>

            <p className="text-xs text-gray-600">
              Method:{" "}
              <span className="font-semibold text-gray-800">
                {paymentMethod === "PAY_ON_ARRIVAL"
                  ? "Pay on Arrival"
                  : "Online"}
              </span>
            </p>

            <p className="text-xs text-gray-600 mt-1">
              Razorpay ID:{" "}
              <span className="font-mono">
                {appointment.payment?.razorpayPaymentId || "—"}
              </span>
            </p>

            <div className="flex items-center gap-4 mt-3">
              <IndianRupee className="h-6 w-6 text-gray-400" />
              <span className="text-2xl font-semibold text-gray-900">
                ₹{(appointment.payment?.amount || 0) / 100}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  paymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : paymentStatus === "FAILED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {paymentStatus}
              </span>
            </div>

            {showMarkPaidButton && (
              <div className="mt-5">
                <Button
                  onClick={markPaymentAsPaid}
                  disabled={markingPaid}
                  className="cursor-pointer"
                >
                  {markingPaid ? "Marking…" : "Mark Payment as PAID"}
                </Button>

                <p className="text-xs text-gray-500 mt-2">
                  Use this after receiving cash/UPI at the clinic.
                </p>
              </div>
            )}
          </Card>

          {/* ---------- DOCUMENTS ---------- */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Documents
            </h3>

            {appointment.documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {appointment.documents.map((doc) => (
                  <a
                    key={doc.s3Key}
                    href={`${awsBase}/${doc.s3Key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer min-w-55 rounded-xl border bg-gray-50 p-4 hover:bg-gray-100 transition"
                  >
                    <FileText className="h-5 w-5 text-gray-500 mb-2" />
                    <p className="text-sm font-medium truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-500">{doc.mimeType}</p>
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* ---------- PRESCRIPTIONS ---------- */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prescriptions
            </h3>

            {prescriptionsLoading ? (
              <p className="text-sm text-gray-500">Loading prescriptions...</p>
            ) : prescriptionData?.length === 0 ? (
              <p className="text-sm text-gray-500">
                No prescriptions generated yet
              </p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {prescriptionData?.map((pres) => (
                  <a
                    key={pres._id}
                    href={`${awsBase}/${pres.pdfDocumentId.s3Key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-55 rounded-xl border bg-gray-50 p-4 hover:bg-gray-100 transition"
                  >
                    <FileText className="h-5 w-5 text-gray-500 mb-2" />

                    <p className="text-sm font-medium">
                      Prescription v{pres.version}
                    </p>

                    <p className="text-xs text-gray-500">
                      {new Date(pres.createdAt).toLocaleString("en-IN")}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* ---------- DOCTOR NOTES ---------- */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Doctor Notes
            </h3>

            <AddNoteForm
              appointmentId={appointment._id}
              onSubmit={async (data) => {
                await addNoteMutation(data);
                refetchNotes();
              }}
            />

            <div className="mt-6 space-y-4">
              {notesLoading ? (
                <p className="text-sm text-gray-500">Loading notes…</p>
              ) : notesData?.length === 0 ? (
                <p className="text-sm text-gray-500">No notes added yet.</p>
              ) : (
                notesData?.map((note) => (
                  <div
                    key={note._id}
                    className="rounded-xl border bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {note.text}
                    </p>

                    <div className="flex flex-row gap-1 mt-2">
                      {note?.documents?.map((doc) => {
                        return (
                          <a
                            key={doc._id}
                            target="_blank"
                            href={`${process.env.NEXT_PUBLIC_AWS_URL}/${doc.s3Key}`}
                          >
                            <div className="w-fit flex flex-row items-center gap-1 text-sm rounded-md bg-gray-100 border border-gray-300 px-4 py-2 cursor-pointer">
                              <Paperclip className="font-light w-3 h-3" />{" "}
                              {doc.filename}
                            </div>
                          </a>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleString("en-IN")}
                      </span>

                      <button
                        onClick={() => deleteNote(note._id)}
                        className="cursor-pointer text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ================= RIGHT ================= */}
        <aside className="space-y-6 sticky z-10 top-24">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Status
            </p>
            <span className="mt-3 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
              {appointment.status.toUpperCase()}
            </span>
          </Card>

          {isOnline && meetLink && appointment.meet?.status === "scheduled" && (
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                Online Consultation
              </p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full cursor-pointer flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Join Google Meet
                </Button>
              </a>
            </Card>
          )}

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Created
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {new Date(appointment.createdAt).toLocaleString("en-IN")}
            </p>
          </Card>
        </aside>
      </div>
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold">Reschedule Appointment</h2>

            {/* DATE */}
            <div>
              <label className="text-sm font-medium">New Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setNewSlot(null);
                }}
              />
            </div>

            {/* CLINIC */}
            <div>
              <label className="text-sm font-medium">Clinic</label>

              <select
                value={newClinic}
                onChange={(e) => {
                  setNewClinic(e.target.value as any);
                  setNewSlot(null);
                }}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="DEHRADUN">Dehradun</option>
                <option value="ROORKEE">Roorkee</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            {/* SLOTS */}
            <div>
              <label className="text-sm font-medium">Available Slots</label>

              {slotsLoading ? (
                <p className="text-sm text-gray-500 mt-2">Loading slots...</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {slotData?.slots?.map((slot: any) => (
                    <button
                      key={slot.startTime}
                      disabled={!slot.available}
                      onClick={() => setNewSlot(slot.startTime)}
                      className={`
                  p-2 rounded border text-sm
                  ${
                    newSlot === slot.startTime
                      ? "bg-blue-100 border-blue-400"
                      : "border-gray-300"
                  }
                  ${!slot.available && "opacity-40 cursor-not-allowed"}
                `}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </Button>

              <Button onClick={rescheduleMutation}>Confirm Reschedule</Button>
            </div>
          </div>
        </div>
      )}
      {showPrescriptionModal && (
        <PrescriptionModal
          appointmentId={appointment._id}
          onClose={() => setShowPrescriptionModal(false)}
          onSuccess={() => {
            refetchPrescriptions();
            setShowPrescriptionModal(false);
          }}
        />
      )}
    </div>
  );
}

async function uploadWithPresign(
  file: File,
  appointmentId: string,
  onProgress?: (p: number) => void,
): Promise<UploadedDoc> {
  // 1. Get presigned URL
  const presignRes = await api.post("/uploads/presign", {
    filename: file.name,
    contentType: file.type,
    size: file.size,
    appointmentId,
  });

  const { uploadUrl, documentId } = presignRes.data;

  // 2. Upload to S3 (XHR for progress)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject("Upload failed");

    xhr.onerror = () => reject("Upload failed");
    xhr.send(file);
  });

  return {
    _id: documentId,
    filename: file.name,
    mimeType: file.type,
    s3Key: uploadUrl.split("?")[0].split("/").slice(-2).join("/"),
  };
}

function AddNoteForm({
  appointmentId,
  onSubmit,
}: {
  appointmentId: string;
  onSubmit: (data: { text?: string; documentIds?: string[] }) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [noteDocs, setNoteDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  /* ================= FILE PICKER ================= */
  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const tempId = `temp-${Date.now()}`;

      try {
        setBusy(true);
        setUploading((u) => ({ ...u, [tempId]: 0 }));

        const doc = await uploadWithPresign(file, appointmentId, (p) =>
          setUploading((u) => ({ ...u, [tempId]: p })),
        );

        setNoteDocs((d) => [doc, ...d]);
      } catch {
        alert("Upload failed");
      } finally {
        setUploading({});
        setBusy(false);
      }
    };

    input.click();
  };

  /* ================= SUBMIT ================= */
  const submit = async () => {
    if (!text.trim() && noteDocs.length === 0) return;

    setBusy(true);

    await onSubmit({
      text,
      documentIds: noteDocs.map((d) => d._id),
    });

    setText("");
    setNoteDocs([]);
    setUploading({});
    setBusy(false);
  };

  /* ================= HELPERS ================= */
  const isImage = (m?: string) => m?.startsWith("image/");
  const isPDF = (m?: string) => m?.includes("pdf");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-5">
      {/* ---------- HEADER ---------- */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Add Clinical Note</p>
        <span className="text-xs text-gray-500">Visible to doctors</span>
      </div>

      {/* ---------- TEXT INPUT ---------- */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write clinical observations, diagnosis notes, or follow-ups…"
        rows={4}
        className="
          w-full resize-none
          rounded-xl border border-gray-300
          px-4 py-3 text-sm text-gray-900
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary
        "
      />

      {/* ---------- ACTION BAR ---------- */}
      <div className="flex items-center justify-between">
        <button
          onClick={pickFile}
          disabled={busy}
          className="
            cursor-pointer inline-flex items-center gap-2
            rounded-lg border border-gray-300
            px-3 py-2 text-sm font-medium text-gray-700
            hover:bg-gray-50 disabled:opacity-50
          "
        >
          Upload document
        </button>

        <span className="text-xs text-gray-500">Images or PDFs</span>
      </div>

      {/* ---------- ATTACHMENTS ---------- */}
      {noteDocs.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pt-2">
          {noteDocs.map((doc) => {
            const url = `${process.env.NEXT_PUBLIC_AWS_URL}/${doc.s3Key}`;

            return (
              <div
                key={doc._id}
                className="
                  min-w-[220px] max-w-[260px]
                  rounded-xl border bg-gray-50 p-3
                "
              >
                <p className="truncate text-sm font-medium text-gray-800">
                  {doc.filename}
                </p>

                <div className="mt-2 h-36 rounded-lg border bg-white overflow-hidden flex items-center justify-center">
                  {isImage(doc.mimeType) ? (
                    <Image
                      height={100}
                      width={100}
                      src={url}
                      alt={doc.filename}
                      className="h-full w-full object-cover"
                    />
                  ) : isPDF(doc.mimeType) ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:underline"
                    >
                      Open PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">
                      Preview unavailable
                    </span>
                  )}
                </div>

                {/* Progress */}
                {uploading[doc._id] !== undefined && (
                  <div className="mt-2 h-1.5 rounded bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploading[doc._id]}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- SUBMIT ---------- */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={submit}
          disabled={busy || (!text.trim() && noteDocs.length === 0)}
          className="cursor-pointer"
        >
          Add Note
        </Button>
      </div>
    </div>
  );
}

function PrescriptionModal({
  appointmentId,
  onClose,
  onSuccess,
}: {
  appointmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  /* ================= STATES ================= */

  const [vitals, setVitals] = useState({
    bp: "",
    temperature: "",
    spo2: "",
    pulse: "",
    rbs: "",
    height: "",
    weight: "",
    bmi: "",
  });

  const [history, setHistory] = useState({
    allergies: "",
    personalHistory: "",
    pastMedicalHistory: "",
    familyHistory: "",
  });

  const [complaints, setComplaints] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  const [medicines, setMedicines] = useState([
    {
      name: "",
      dosage: "",
      timing: "",
      frequency: "Daily",
      duration: "",
    },
  ]);

  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState("");
  const [nextVisit, setNextVisit] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= MEDICINE ================= */

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        timing: "",
        frequency: "Daily",
        duration: "",
      },
    ]);
  };

  const removeMedicine = (i: number) => {
    setMedicines(medicines.filter((_, index) => index !== i));
  };

  const updateMedicine = (i: number, field: string, value: string) => {
    const copy = [...medicines];
    // @ts-ignore
    copy[i][field] = value;
    setMedicines(copy);
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    try {
      setLoading(true);

      await api.post(`/appointments/${appointmentId}/prescriptions`, {
        vitals,
        history,
        complaints,
        diagnosis,

        medicines: medicines
          .filter((m) => m.name.trim() !== "")
          .map((m) => ({
            name: m.name,
            dosage: m.dosage,
            timing: m.timing,
            frequency: m.frequency,
            duration: m.duration,
          })),

        advice,
        tests,
        nextVisit,
      });

      toast.success("Prescription generated");

      onSuccess();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Failed to create prescription",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <h2 className="text-lg font-semibold">Create Prescription</h2>

        {/* ================= VITALS ================= */}

        <div>
          <p className="font-medium mb-2">Vitals</p>

          <div className="grid grid-cols-4 gap-2">
            <Input
              placeholder="BP"
              value={vitals.bp}
              onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
            />

            <Input
              placeholder="Temp"
              value={vitals.temperature}
              onChange={(e) =>
                setVitals({ ...vitals, temperature: e.target.value })
              }
            />

            <Input
              placeholder="SpO2"
              value={vitals.spo2}
              onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
            />

            <Input
              placeholder="Pulse"
              value={vitals.pulse}
              onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
            />

            <Input
              placeholder="RBS"
              value={vitals.rbs}
              onChange={(e) => setVitals({ ...vitals, rbs: e.target.value })}
            />

            <Input
              placeholder="Height"
              value={vitals.height}
              onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
            />

            <Input
              placeholder="Weight"
              value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
            />

            <Input
              placeholder="BMI"
              value={vitals.bmi}
              onChange={(e) => setVitals({ ...vitals, bmi: e.target.value })}
            />
          </div>
        </div>

        {/* ================= HISTORY ================= */}

        <div>
          <p className="font-medium mb-2">History</p>

          <textarea
            placeholder="Allergies"
            className="w-full border rounded-lg p-2 mb-2"
            value={history.allergies}
            onChange={(e) =>
              setHistory({ ...history, allergies: e.target.value })
            }
          />

          <textarea
            placeholder="Personal History"
            className="w-full border rounded-lg p-2 mb-2"
            value={history.personalHistory}
            onChange={(e) =>
              setHistory({ ...history, personalHistory: e.target.value })
            }
          />

          <textarea
            placeholder="Past Medical History"
            className="w-full border rounded-lg p-2 mb-2"
            value={history.pastMedicalHistory}
            onChange={(e) =>
              setHistory({ ...history, pastMedicalHistory: e.target.value })
            }
          />

          <textarea
            placeholder="Family History"
            className="w-full border rounded-lg p-2"
            value={history.familyHistory}
            onChange={(e) =>
              setHistory({ ...history, familyHistory: e.target.value })
            }
          />
        </div>

        {/* ================= COMPLAINTS ================= */}

        <div>
          <p className="font-medium mb-2">Complaints</p>

          <textarea
            className="w-full border rounded-lg p-2"
            value={complaints}
            onChange={(e) => setComplaints(e.target.value)}
          />
        </div>

        {/* ================= DIAGNOSIS ================= */}

        <div>
          <p className="font-medium mb-2">Diagnosis</p>

          <textarea
            className="w-full border rounded-lg p-2"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        {/* ================= MEDICINES ================= */}

<div>
  <div className="flex items-center justify-between mb-3">
    <p className="font-medium">Medicines</p>

    <Button variant="outline" onClick={addMedicine}>
      Add Medicine
    </Button>
  </div>

  <div className="space-y-4">

    {medicines.map((m, i) => (
      <div
        key={i}
        className="border rounded-xl p-4 space-y-3 bg-gray-50"
      >

        {/* Medicine name full width */}

        <Input
          placeholder="Medicine name"
          value={m.name}
          onChange={(e) =>
            updateMedicine(i, "name", e.target.value)
          }
        />

        {/* dosage / timing / frequency / duration */}

        <div className="grid grid-cols-4 gap-2">

          <Input
            placeholder="Dosage (1-0-1)"
            value={m.dosage}
            onChange={(e) =>
              updateMedicine(i, "dosage", e.target.value)
            }
          />

          <select
            value={m.timing}
            onChange={(e) =>
              updateMedicine(i, "timing", e.target.value)
            }
            className="border rounded-lg p-2"
          >
            <option value="">Timing</option>
            <option value="After Food">After Food</option>
            <option value="Before Food">Before Food</option>
            <option value="Empty Stomach">Empty Stomach</option>
          </select>

          <select
            value={m.frequency}
            onChange={(e) =>
              updateMedicine(i, "frequency", e.target.value)
            }
            className="border rounded-lg p-2"
          >
            <option value="Daily">Daily</option>
            <option value="SOS">SOS</option>
            <option value="Alternate Day">Alternate Day</option>
          </select>

          <Input
            placeholder="Duration (5 days)"
            value={m.duration}
            onChange={(e) =>
              updateMedicine(i, "duration", e.target.value)
            }
          />

        </div>

        {/* remove button */}

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeMedicine(i)}
          >
            Remove
          </Button>
        </div>

      </div>
    ))}

  </div>
</div>
        {/* ================= ADVICE ================= */}

        <div>
          <p className="font-medium mb-2">Advice</p>

          <textarea
            className="w-full border rounded-lg p-2"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
          />
        </div>

        {/* ================= TESTS ================= */}

        <div>
          <p className="font-medium mb-2">Tests</p>

          <textarea
            className="w-full border rounded-lg p-2"
            value={tests}
            onChange={(e) => setTests(e.target.value)}
          />
        </div>

        {/* ================= NEXT VISIT ================= */}

        <div>
          <p className="font-medium mb-2">Next Visit</p>

          <Input
            placeholder="e.g 2 weeks"
            value={nextVisit}
            onChange={(e) => setNextVisit(e.target.value)}
          />
        </div>

        {/* ================= ACTIONS ================= */}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={submit} disabled={loading}>
            {loading ? "Generating..." : "Generate Prescription"}
          </Button>
        </div>
      </div>
    </div>
  );
}
