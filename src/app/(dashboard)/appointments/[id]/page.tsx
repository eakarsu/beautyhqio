"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';
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
  transaction?: { id: string } | null;
  depositIntent?: { amountCents: number; currency: string; status: string; collectionMethod?: string | null; reference?: string | null; reason?: string | null; cardCheckouts?: Array<{status:string;providerRef:string|null}>; cardRefunds?: Array<{status:string;providerRef:string|null}> } | null;
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
  const { data: session } = useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [depositReason, setDepositReason] = useState("");
  const [depositError, setDepositError] = useState("");
  const [depositProviderRef, setDepositProviderRef] = useState('');

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
    setActionError("");
    try {
      const response = await fetch(`/api/appointments/${id}/${action}`, {
        method: "POST",
      });
      if (response.ok) {
        fetchAppointment();
      } else { const result = await response.json().catch(() => ({})); setActionError(result.message || result.error || 'Could not update appointment'); }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      setActionError('Could not update appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const settleDeposit = async (action: 'cash-collected' | 'waive' | 'cash-refund') => {
    setActionLoading(action); setDepositError('');
    try {
      const response = await fetch(`/api/appointments/${id}/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ action, reason: depositReason, ...(action !== 'waive' ? { reference: depositReference } : {}), ...(action === 'cash-refund' ? { cashReturnedConfirmed: true } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Could not settle deposit');
      await fetchAppointment();
    } catch (error) { setDepositError(error instanceof Error ? error.message : 'Could not settle deposit'); }
    finally { setActionLoading(null); }
  };

  const cardDepositAction = async (action: 'card-checkout' | 'card-refund') => {
    setActionLoading(action); setDepositError('');
    try {
      const response = await fetch(`/api/appointments/${id}/deposit/${action}`, { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID(), ...(action === 'card-refund' ? { 'Content-Type': 'application/json' } : {}) }, ...(action === 'card-refund' ? { body: JSON.stringify({ reason: depositReason }) } : {}) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Card deposit action failed');
      if (result.url) { window.location.assign(result.url); return; }
      if (action === 'card-checkout' && result.status !== 'PAID') setDepositError('This checkout is already open under another account. Reconcile or expire it before creating another.');
      await fetchAppointment();
    } catch (error) { setDepositError(error instanceof Error ? error.message : 'Card deposit action failed'); }
    finally { setActionLoading(null); }
  };

  const reconcileCardDeposit = async (expire = false) => {
    setActionLoading('card-reconcile'); setDepositError('');
    try {
      const reference = depositProviderRef.trim();
      const kind = reference.startsWith('cs_') ? 'checkout' : reference.startsWith('re_') ? 'refund' : null;
      if (!kind) throw Error('Enter a Stripe checkout (cs_) or refund (re_) receipt');
      const response = await fetch(`/api/appointments/${id}/deposit/card-reconcile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, reference, expire }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Provider receipt could not be reconciled');
      await fetchAppointment();
    } catch (error) { setDepositError(error instanceof Error ? error.message : 'Provider receipt could not be reconciled'); }
    finally { setActionLoading(null); }
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
          {appointment.depositIntent && <Card>
            <CardHeader><CardTitle>Deposit obligation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p>{(appointment.depositIntent.amountCents / 100).toLocaleString(undefined, { style: 'currency', currency: appointment.depositIntent.currency })} · {appointment.depositIntent.status}</p>
              {appointment.depositIntent.status === 'PENDING' && <><p className="text-sm text-amber-700">Confirmation and check-in require verified card capture, a recorded cash collection, or an approved waiver.</p>
                <Button variant="outline" className="w-full" disabled={actionLoading !== null} onClick={() => void cardDepositAction('card-checkout')}>Open card deposit checkout (Stripe test mode)</Button>
                <label className="block text-sm">Cash receipt reference<input className="mt-1 w-full rounded border p-2" value={depositReference} onChange={event => setDepositReference(event.target.value)} maxLength={120}/></label>
                <label className="block text-sm">Collection or waiver reason<textarea className="mt-1 w-full rounded border p-2" value={depositReason} onChange={event => setDepositReason(event.target.value)} maxLength={500}/></label>
                {depositError && <p role="alert" className="text-red-700">{depositError}</p>}
                <Button className="w-full" disabled={actionLoading !== null || depositReference.trim().length < 4 || depositReason.trim().length < 5} onClick={() => void settleDeposit('cash-collected')}>Record cash collected</Button>
                <Button variant="outline" className="w-full" disabled={actionLoading !== null || depositReason.trim().length < 5} onClick={() => void settleDeposit('waive')}>Waive with reason</Button>
              </>}
              {appointment.depositIntent.status === 'PAID' && <><p className="text-sm">{appointment.depositIntent.collectionMethod === 'CARD' ? 'Verified card capture' : 'Cash receipt'}: {appointment.depositIntent.reference}. This amount remains a deposit liability until applied to the linked sale or returned.</p>
                {!appointment.transaction && ['OWNER', 'MANAGER'].includes(String(session?.user?.role)) && <>{appointment.depositIntent.collectionMethod === 'CASH' && <label className="block text-sm">Cash refund receipt reference<input className="mt-1 w-full rounded border p-2" value={depositReference} onChange={event => setDepositReference(event.target.value)} maxLength={120}/></label>}
                  <label className="block text-sm">Deposit refund reason<textarea className="mt-1 w-full rounded border p-2" value={depositReason} onChange={event => setDepositReason(event.target.value)} maxLength={500}/></label>
                  {depositError && <p role="alert" className="text-red-700">{depositError}</p>}
                  {appointment.depositIntent.collectionMethod === 'CASH' ? <Button variant="outline" className="w-full" disabled={actionLoading !== null || depositReference.trim().length < 4 || depositReason.trim().length < 5} onClick={() => { if (window.confirm('Confirm that the full cash deposit has been returned to the client?')) void settleDeposit('cash-refund'); }}>Record full cash refund</Button> : <Button variant="outline" className="w-full" disabled={actionLoading !== null || depositReason.trim().length < 5} onClick={() => { if (window.confirm('Request a full refund to the original test card?')) void cardDepositAction('card-refund'); }}>Refund original card deposit</Button>}
                </>}
              </>}
              {appointment.depositIntent.status === 'APPLIED' && <p className="text-sm">Deposit applied once to the linked POS sale. Any refund must use that sale&apos;s original payment credit.</p>}
              {appointment.depositIntent.status === 'REFUNDED' && <p className="text-sm">Deposit refunded. The return is recorded in the deposit ledger.</p>}
              {appointment.depositIntent.status === 'WAIVED' && <p className="text-sm">Waiver reason: {appointment.depositIntent.reason}</p>}
              {appointment.depositIntent.cardCheckouts?.[0] && <p className="text-xs text-muted-foreground">Latest card checkout: {appointment.depositIntent.cardCheckouts[0].status}{appointment.depositIntent.cardCheckouts[0].providerRef ? ` · ${appointment.depositIntent.cardCheckouts[0].providerRef}` : ''}</p>}
              {appointment.depositIntent.cardRefunds?.[0] && <p className="text-xs text-muted-foreground">Latest card refund: {appointment.depositIntent.cardRefunds[0].status}{appointment.depositIntent.cardRefunds[0].providerRef ? ` · ${appointment.depositIntent.cardRefunds[0].providerRef}` : ''}</p>}
              {['OWNER', 'MANAGER'].includes(String(session?.user?.role)) && <div className="space-y-2 border-t pt-3"><label className="block text-sm">Stripe test receipt for reconciliation<input className="mt-1 w-full rounded border p-2" placeholder="cs_… or re_…" value={depositProviderRef} onChange={event => setDepositProviderRef(event.target.value)} maxLength={190}/></label><Button variant="outline" className="w-full" disabled={actionLoading !== null || depositProviderRef.trim().length < 7} onClick={() => void reconcileCardDeposit()}>Reconcile provider receipt</Button>{depositProviderRef.trim().startsWith('cs_') && <Button variant="outline" className="w-full" disabled={actionLoading !== null} onClick={() => { if (window.confirm('Expire this open Stripe test checkout?')) void reconcileCardDeposit(true); }}>Expire open checkout</Button>}</div>}
              {depositError && <p role="alert" className="text-red-700">{depositError}</p>}
            </CardContent>
          </Card>}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
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
