"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  XCircle,
  Edit,
  CheckCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  notes: string | null;
  salon: {
    name: string;
    phone: string | null;
    address: string;
    city: string;
    state: string;
  };
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
  staff: {
    id: string;
    displayName: string;
    photo: string | null;
  };
  locationId: string;
}

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated" && !session?.user?.isClient) {
      router.push("/dashboard");
      return;
    }
    if (sessionStatus === "authenticated") {
      fetchAppointment();
    }
  }, [session, sessionStatus, router, id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/client/appointments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data.appointment);
      } else {
        router.push("/client/appointments");
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      router.push("/client/appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Use existing appointments delete endpoint
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/client/appointments");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete appointment");
      }
    } catch (error) {
      alert("Failed to delete appointment");
    } finally {
      setDeleting(false);
    }
  };

  const handleReschedule = () => {
    if (!appointment) return;
    // Navigate to booking flow with service IDs
    const serviceIds = appointment.services.map((s) => s.id).join(",");
    router.push(
      `/book/${appointment.locationId}/datetime?services=${serviceIds}&reschedule=${id}`
    );
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const scheduledDate = new Date(appointment.scheduledStart);
  const isUpcoming = scheduledDate > new Date();
  const isCancelled = appointment.status === "CANCELLED";
  const isCompleted = appointment.status === "COMPLETED";
  const canModify = isUpcoming && !isCancelled && !isCompleted;

  const totalDuration = appointment.services.reduce(
    (sum, s) => sum + s.duration,
    0
  );
  const totalPrice = appointment.services.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.push("/client/appointments")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appointments
      </button>

      {/* Status Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 font-medium">
            This appointment has been cancelled
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700 font-medium">
            This appointment has been completed
          </span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-8 text-white">
          <h1 className="text-2xl font-bold mb-2">{appointment.salon.name}</h1>
          <div className="flex items-center gap-2 text-rose-100">
            <MapPin className="h-4 w-4" />
            <span>
              {appointment.salon.address}, {appointment.salon.city},{" "}
              {appointment.salon.state}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {scheduledDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-slate-600">
                {scheduledDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}{" "}
                - {totalDuration} minutes
              </p>
            </div>
          </div>

          {/* Staff */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
              {appointment.staff.photo ? (
                <img
                  src={appointment.staff.photo}
                  alt=""
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {appointment.staff.displayName}
              </p>
              <p className="text-slate-600">Your Stylist</p>
            </div>
          </div>

          {/* Services */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Services</h3>
            <div className="space-y-3">
              {appointment.services.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">
                      {service.duration} min
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ${service.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-lg text-rose-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-slate-600">{appointment.notes}</p>
            </div>
          )}

          {/* Contact */}
          {appointment.salon.phone && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-3">
                Need to Contact?
              </h3>
              <a
                href={`tel:${appointment.salon.phone}`}
                className="flex items-center gap-3 text-rose-600 hover:text-rose-700"
              >
                <Phone className="h-5 w-5" />
                <span>{appointment.salon.phone}</span>
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-6 bg-slate-50">
          <div className="flex gap-3">
            {canModify && (
              <button
                onClick={handleReschedule}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Reschedule
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Cancel Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Cancel Appointment?
            </h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to cancel your appointment on{" "}
              {scheduledDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {scheduledDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                disabled={deleting}
              >
                Keep Appointment
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
