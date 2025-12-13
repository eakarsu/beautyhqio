"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Gift,
  Star,
  User,
  UserPlus,
  XCircle,
  DollarSign,
} from "lucide-react";

export type TriggerType =
  | "appointment_booked"
  | "appointment_completed"
  | "appointment_cancelled"
  | "no_show"
  | "new_client"
  | "client_birthday"
  | "inactive_client"
  | "review_received"
  | "payment_received";

interface TriggerConfigProps {
  type: TriggerType;
  config: Record<string, unknown>;
  onChange: (type: TriggerType, config: Record<string, unknown>) => void;
}

const TRIGGER_TYPES: { value: TriggerType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "appointment_booked",
    label: "Appointment Booked",
    icon: <Calendar className="h-4 w-4" />,
    description: "When a new appointment is booked",
  },
  {
    value: "appointment_completed",
    label: "Appointment Completed",
    icon: <Calendar className="h-4 w-4" />,
    description: "When an appointment is marked as complete",
  },
  {
    value: "appointment_cancelled",
    label: "Appointment Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    description: "When an appointment is cancelled",
  },
  {
    value: "no_show",
    label: "No Show",
    icon: <Clock className="h-4 w-4" />,
    description: "When a client doesn't show up",
  },
  {
    value: "new_client",
    label: "New Client",
    icon: <UserPlus className="h-4 w-4" />,
    description: "When a new client is added",
  },
  {
    value: "client_birthday",
    label: "Client Birthday",
    icon: <Gift className="h-4 w-4" />,
    description: "On a client's birthday",
  },
  {
    value: "inactive_client",
    label: "Inactive Client",
    icon: <User className="h-4 w-4" />,
    description: "When a client hasn't visited in a while",
  },
  {
    value: "review_received",
    label: "Review Received",
    icon: <Star className="h-4 w-4" />,
    description: "When a new review is submitted",
  },
  {
    value: "payment_received",
    label: "Payment Received",
    icon: <DollarSign className="h-4 w-4" />,
    description: "When a payment is processed",
  },
];

export function TriggerConfig({ type, config, onChange }: TriggerConfigProps) {
  const updateConfig = (key: string, value: unknown) => {
    onChange(type, { ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Trigger Type Selection */}
      <div className="space-y-2">
        <Label>Trigger Type</Label>
        <Select
          value={type}
          onValueChange={(value) => onChange(value as TriggerType, {})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trigger" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                <div className="flex items-center gap-2">
                  {trigger.icon}
                  <span>{trigger.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {TRIGGER_TYPES.find((t) => t.value === type)?.description}
        </p>
      </div>

      {/* Trigger-specific configuration */}
      {type === "appointment_booked" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Service Filter (optional)</Label>
            <Select
              value={(config.serviceFilter as string) || "all"}
              onValueChange={(v) => updateConfig("serviceFilter", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="color">Color Services Only</SelectItem>
                <SelectItem value="haircut">Haircuts Only</SelectItem>
                <SelectItem value="treatment">Treatments Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Client Type Filter</Label>
            <Select
              value={(config.clientFilter as string) || "all"}
              onValueChange={(v) => updateConfig("clientFilter", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="new">New Clients Only</SelectItem>
                <SelectItem value="returning">Returning Clients Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "inactive_client" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Days Since Last Visit</Label>
            <Input
              type="number"
              min="1"
              value={(config.daysSinceVisit as number) || 60}
              onChange={(e) => updateConfig("daysSinceVisit", parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Trigger when a client hasn't visited for this many days
            </p>
          </div>
        </div>
      )}

      {type === "client_birthday" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Days Before Birthday</Label>
            <Select
              value={(config.daysBefore as string) || "0"}
              onValueChange={(v) => updateConfig("daysBefore", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On birthday</SelectItem>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "review_received" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Rating Filter</Label>
            <Select
              value={(config.ratingFilter as string) || "all"}
              onValueChange={(v) => updateConfig("ratingFilter", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="positive">4-5 Stars Only</SelectItem>
                <SelectItem value="negative">1-3 Stars Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "payment_received" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Minimum Amount ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={(config.minAmount as number) || 0}
              onChange={(e) => updateConfig("minAmount", parseFloat(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Only trigger for payments above this amount (0 = all payments)
            </p>
          </div>
        </div>
      )}

      {type === "no_show" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Grace Period (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={(config.gracePeriod as number) || 15}
              onChange={(e) => updateConfig("gracePeriod", parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Wait this long after appointment time before marking as no-show
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
