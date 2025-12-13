"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageSquare,
  Gift,
  Tag,
  ClipboardList,
  User,
  Bell,
  Webhook,
  Clock,
} from "lucide-react";

export type ActionType =
  | "send_email"
  | "send_sms"
  | "add_points"
  | "apply_discount"
  | "create_task"
  | "update_client"
  | "send_notification"
  | "webhook";

interface ActionConfigProps {
  type: ActionType;
  config: Record<string, unknown>;
  delay?: number;
  onChange: (type: ActionType, config: Record<string, unknown>, delay?: number) => void;
}

const ACTION_TYPES: { value: ActionType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "send_email",
    label: "Send Email",
    icon: <Mail className="h-4 w-4" />,
    description: "Send an email to the client",
  },
  {
    value: "send_sms",
    label: "Send SMS",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Send a text message to the client",
  },
  {
    value: "add_points",
    label: "Add Loyalty Points",
    icon: <Gift className="h-4 w-4" />,
    description: "Add points to client's loyalty account",
  },
  {
    value: "apply_discount",
    label: "Apply Discount",
    icon: <Tag className="h-4 w-4" />,
    description: "Create a discount code for the client",
  },
  {
    value: "create_task",
    label: "Create Task",
    icon: <ClipboardList className="h-4 w-4" />,
    description: "Create a task for staff to follow up",
  },
  {
    value: "update_client",
    label: "Update Client",
    icon: <User className="h-4 w-4" />,
    description: "Update client tags or notes",
  },
  {
    value: "send_notification",
    label: "Send Notification",
    icon: <Bell className="h-4 w-4" />,
    description: "Send an in-app notification to staff",
  },
  {
    value: "webhook",
    label: "Webhook",
    icon: <Webhook className="h-4 w-4" />,
    description: "Call an external URL with data",
  },
];

const TEMPLATE_VARIABLES = [
  "{{client.firstName}}",
  "{{client.lastName}}",
  "{{client.email}}",
  "{{appointment.date}}",
  "{{appointment.time}}",
  "{{appointment.service}}",
  "{{staff.name}}",
  "{{business.name}}",
];

export function ActionConfig({ type, config, delay, onChange }: ActionConfigProps) {
  const updateConfig = (key: string, value: unknown) => {
    onChange(type, { ...config, [key]: value }, delay);
  };

  const updateDelay = (minutes: number) => {
    onChange(type, config, minutes);
  };

  return (
    <div className="space-y-4">
      {/* Action Type Selection */}
      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select
          value={type}
          onValueChange={(value) => onChange(value as ActionType, {}, delay)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                <div className="flex items-center gap-2">
                  {action.icon}
                  <span>{action.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {ACTION_TYPES.find((a) => a.value === type)?.description}
        </p>
      </div>

      {/* Delay Configuration */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Delay
          </Label>
          <Switch
            checked={(delay || 0) > 0}
            onCheckedChange={(checked) => updateDelay(checked ? 60 : 0)}
          />
        </div>
        {(delay || 0) > 0 && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              className="w-24"
              value={delay || 60}
              onChange={(e) => updateDelay(parseInt(e.target.value))}
            />
            <Select
              value={(config.delayUnit as string) || "minutes"}
              onValueChange={(v) => updateConfig("delayUnit", v)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">after trigger</span>
          </div>
        )}
      </div>

      {/* Action-specific configuration */}
      {type === "send_email" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select
              value={(config.templateId as string) || "custom"}
              onValueChange={(v) => updateConfig("templateId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Message</SelectItem>
                <SelectItem value="appointment_confirmation">Appointment Confirmation</SelectItem>
                <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
                <SelectItem value="birthday">Birthday Greeting</SelectItem>
                <SelectItem value="we_miss_you">We Miss You</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(config.templateId as string) === "custom" && (
            <>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={(config.subject as string) || ""}
                  onChange={(e) => updateConfig("subject", e.target.value)}
                  placeholder="e.g., Your appointment is confirmed!"
                />
              </div>
              <div className="space-y-2">
                <Label>Message Body</Label>
                <Textarea
                  value={(config.body as string) || ""}
                  onChange={(e) => updateConfig("body", e.target.value)}
                  placeholder="Write your email message here..."
                  rows={4}
                />
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Variables:</span>
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => updateConfig("body", (config.body || "") + " " + v)}
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {type === "send_sms" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>SMS Template</Label>
            <Select
              value={(config.templateId as string) || "custom"}
              onValueChange={(v) => updateConfig("templateId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Message</SelectItem>
                <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                <SelectItem value="confirmation">Confirmation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(config.templateId as string) === "custom" && (
            <div className="space-y-2">
              <Label>Message (160 characters max)</Label>
              <Textarea
                value={(config.message as string) || ""}
                onChange={(e) => updateConfig("message", e.target.value)}
                placeholder="Write your SMS message here..."
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {((config.message as string) || "").length}/160 characters
              </p>
            </div>
          )}
        </div>
      )}

      {type === "add_points" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Points to Add</Label>
            <Input
              type="number"
              min="1"
              value={(config.points as number) || 100}
              onChange={(e) => updateConfig("points", parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason (shown to client)</Label>
            <Input
              value={(config.reason as string) || ""}
              onChange={(e) => updateConfig("reason", e.target.value)}
              placeholder="e.g., Birthday bonus!"
            />
          </div>
        </div>
      )}

      {type === "apply_discount" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <Select
              value={(config.discountType as string) || "percentage"}
              onValueChange={(v) => updateConfig("discountType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage Off</SelectItem>
                <SelectItem value="fixed">Fixed Amount Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              {(config.discountType as string) === "fixed" ? "Amount ($)" : "Percentage (%)"}
            </Label>
            <Input
              type="number"
              min="1"
              max={(config.discountType as string) === "percentage" ? 100 : undefined}
              value={(config.discountValue as number) || 10}
              onChange={(e) => updateConfig("discountValue", parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Valid For (days)</Label>
            <Input
              type="number"
              min="1"
              value={(config.validDays as number) || 30}
              onChange={(e) => updateConfig("validDays", parseInt(e.target.value))}
            />
          </div>
        </div>
      )}

      {type === "create_task" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Task Title</Label>
            <Input
              value={(config.title as string) || ""}
              onChange={(e) => updateConfig("title", e.target.value)}
              placeholder="e.g., Follow up with client"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={(config.description as string) || ""}
              onChange={(e) => updateConfig("description", e.target.value)}
              placeholder="Task details..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select
              value={(config.assignTo as string) || "owner"}
              onValueChange={(v) => updateConfig("assignTo", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Business Owner</SelectItem>
                <SelectItem value="staff">Assigned Staff</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {type === "webhook" && (
        <div className="space-y-4 pt-2 border-t">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              type="url"
              value={(config.url as string) || ""}
              onChange={(e) => updateConfig("url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>HTTP Method</Label>
            <Select
              value={(config.method as string) || "POST"}
              onValueChange={(v) => updateConfig("method", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
