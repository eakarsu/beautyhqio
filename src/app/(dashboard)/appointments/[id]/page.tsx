"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkedInAt?: string;
  notes?: string;
  internalNotes?: string;
  noShowRisk?: number;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  clientName?: string;
  clientPhone?: string;
  staff: {
    id: string;
    displayName?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  services: Array<{
    id: string;
    price: number;
    duration: number;
    service: {
      name: string;
      price: number;
    };
  }>;
}

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-purple-100 text-purple-800",
  IN_SERVICE: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/appointments/${id}/${action}`, {
        method: "POST",
      });
      if (response.ok) {
        fetchAppointment();
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getClientName = () => {
    if (appointment?.client) {
      return `${appointment.client.firstName} ${appointment.client.lastName}`;
    }
    return appointment?.clientName || "Walk-in";
  };

  const getStaffName = () => {
    if (appointment?.staff.displayName) {
      return appointment.staff.displayName;
    }
    return `${appointment?.staff.user.firstName} ${appointment?.staff.user.lastName}`;
  };

  const getTotalPrice = () => {
    return appointment?.services.reduce((sum, s) => sum + Number(s.price), 0) || 0;
  };

  const getTotalDuration = () => {
    return appointment?.services.reduce((sum, s) => sum + s.duration, 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading appointment...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold">Appointment Not Found</h2>
          <p className="text-muted-foreground mt-2">The appointment you&apos;re looking for doesn&apos;t exist.</p>
          <Button className="mt-4" onClick={() => router.push("/appointments")}>
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Appointment Details</h1>
            <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {format(new Date(appointment.scheduledStart), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/calendar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{getClientName()}</h3>
                  {appointment.client && (
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {appointment.client.phone}
                      </div>
                      {appointment.client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {appointment.client.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {appointment.client && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/clients/${appointment.client!.id}`)}
                  >
                    View Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>with {getStaffName()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointment.services.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{svc.service.name}</div>
                      <div className="text-sm text-muted-foreground">{svc.duration} min</div>
                    </div>
                    <div className="font-semibold">${Number(svc.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="font-semibold">Total</div>
                <div className="text-xl font-bold text-rose-600">${getTotalPrice().toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(appointment.notes || appointment.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.notes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Client Notes</div>
                    <p>{appointment.notes}</p>
                  </div>
                )}
                {appointment.internalNotes && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Internal Notes</div>
                    <p>{appointment.internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Start</span>
                <span className="font-medium">
                  {format(new Date(appointment.scheduledStart), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">End</span>
                <span className="font-medium">
                  {format(new Date(appointment.scheduledEnd), "h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{getTotalDuration()} min</span>
              </div>
              {appointment.checkedInAt && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Checked In</span>
                  <span className="font-medium">
                    {format(new Date(appointment.checkedInAt), "h:mm a")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* No-Show Risk */}
          {appointment.noShowRisk && appointment.noShowRisk > 0.3 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">No-Show Risk</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-700">
                  {Math.round(Number(appointment.noShowRisk) * 100)}%
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  Consider sending a reminder or confirming
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Checkout button - available for active appointments */}
              {["BOOKED", "CONFIRMED", "CHECKED_IN", "COMPLETED"].includes(appointment.status) && (
                <Button
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  onClick={() => router.push(`/pos?appointmentId=${appointment.id}`)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              )}

              {(appointment.status === "BOOKED" || appointment.status === "CONFIRMED") && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction("check-in")}
                    disabled={actionLoading !== null}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {actionLoading === "check-in" ? "Checking in..." : "Check In"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Appointment
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the appointment for {getClientName()}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAction("cancel")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Cancel Appointment
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {appointment.status === "CHECKED_IN" && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAction("complete")}
                  disabled={actionLoading !== null}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {actionLoading === "complete" ? "Completing..." : "Mark Complete"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
