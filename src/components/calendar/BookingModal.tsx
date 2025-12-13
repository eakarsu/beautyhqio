"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Clock, DollarSign } from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
}

interface Staff {
  id: string;
  displayName?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  serviceIds?: string[];
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BookingData) => Promise<void>;
  clients: Client[];
  services: Service[];
  staff: Staff[];
  initialDate?: Date;
  initialStaffId?: string;
  existingAppointment?: {
    id: string;
    clientId?: string;
    staffId: string;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    services: Array<{ serviceId: string }>;
    notes?: string;
  };
}

interface BookingData {
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  staffId: string;
  serviceIds: string[];
  scheduledStart: Date;
  notes?: string;
  sendReminder: boolean;
}

export function BookingModal({
  open,
  onClose,
  onSubmit,
  clients,
  services,
  staff,
  initialDate,
  initialStaffId,
  existingAppointment,
}: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId || "");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate ? initialDate.toISOString().split("T")[0] : "");
  const [time, setTime] = useState(initialDate ? initialDate.toTimeString().slice(0, 5) : "09:00");
  const [notes, setNotes] = useState("");
  const [sendReminder, setSendReminder] = useState(true);

  useEffect(() => {
    if (existingAppointment) {
      const client = clients.find((c) => c.id === existingAppointment.clientId);
      if (client) {
        setSelectedClient(client);
      } else {
        setIsWalkIn(true);
      }
      setSelectedStaffId(existingAppointment.staffId);
      setSelectedServiceIds(existingAppointment.services.map((s) => s.serviceId));
      const startDate = new Date(existingAppointment.scheduledStart);
      setDate(startDate.toISOString().split("T")[0]);
      setTime(startDate.toTimeString().slice(0, 5));
      setNotes(existingAppointment.notes || "");
    }
  }, [existingAppointment, clients]);

  const filteredClients = clients.filter((client) => {
    const search = clientSearch.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(search) ||
      client.lastName.toLowerCase().includes(search) ||
      client.phone?.includes(search) ||
      client.email?.toLowerCase().includes(search)
    );
  });

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || selectedServiceIds.length === 0 || !date || !time) return;

    setIsLoading(true);
    try {
      const scheduledStart = new Date(`${date}T${time}`);
      await onSubmit({
        clientId: selectedClient?.id,
        clientName: isWalkIn ? walkInName : undefined,
        clientPhone: isWalkIn ? walkInPhone : undefined,
        staffId: selectedStaffId,
        serviceIds: selectedServiceIds,
        scheduledStart,
        notes: notes || undefined,
        sendReminder,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const availableStaff = staff.filter(
    (s) =>
      selectedServiceIds.length === 0 ||
      selectedServiceIds.every((id) => s.serviceIds?.includes(id))
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingAppointment ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Client Selection */}
            <div className="space-y-3">
              <Label>Client</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="walkIn"
                  checked={isWalkIn}
                  onCheckedChange={(checked) => {
                    setIsWalkIn(!!checked);
                    if (checked) setSelectedClient(null);
                  }}
                />
                <label htmlFor="walkIn" className="text-sm">Walk-in</label>
              </div>

              {isWalkIn ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="walkInName">Name</Label>
                    <Input
                      id="walkInName"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Client name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="walkInPhone">Phone</Label>
                    <Input
                      id="walkInPhone"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedClient ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {selectedClient.firstName} {selectedClient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedClient.phone || selectedClient.email}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search clients..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {clientSearch && (
                        <div className="border rounded-lg max-h-40 overflow-y-auto">
                          {filteredClients.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground">No clients found</p>
                          ) : (
                            filteredClients.slice(0, 5).map((client) => (
                              <button
                                key={client.id}
                                className="w-full p-3 text-left hover:bg-muted border-b last:border-0"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setClientSearch("");
                                }}
                              >
                                <p className="font-medium">{client.firstName} {client.lastName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {client.phone || client.email}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="space-y-3">
              <Label>Services</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-muted ${
                      selectedServiceIds.includes(service.id) ? "bg-primary/10 border-primary" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.duration}min • ${Number(service.price).toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedServiceIds.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{totalDuration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Staff & Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName || `${s.user?.firstName} ${s.user?.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={2}
              />
            </div>

            {/* Reminder */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendReminder"
                checked={sendReminder}
                onCheckedChange={(checked) => setSendReminder(!!checked)}
              />
              <label htmlFor="sendReminder" className="text-sm">
                Send appointment reminder
              </label>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !selectedStaffId ||
              selectedServiceIds.length === 0 ||
              !date ||
              !time ||
              (!selectedClient && !isWalkIn) ||
              (isWalkIn && !walkInName)
            }
          >
            {isLoading ? "Saving..." : existingAppointment ? "Update" : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
