"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Trash2, Zap, Calendar, Clock, Gift, Star, Mail, MessageSquare } from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig?: {
    delayMinutes?: number;
  };
  actions?: {
    type: string;
    content?: string;
  }[];
  isActive: boolean;
  timesTriggered?: number;
  lastTriggered?: string;
}

const TRIGGER_TYPES = [
  { value: "appointment_booked", label: "Appointment Booked", icon: Calendar },
  { value: "appointment_completed", label: "Appointment Completed", icon: Calendar },
  { value: "no_show", label: "No Show", icon: Clock },
  { value: "birthday", label: "Client Birthday", icon: Gift },
  { value: "inactive_client", label: "Inactive Client (Days)", icon: Clock },
  { value: "new_client", label: "New Client", icon: Star },
  { value: "review_received", label: "Review Received", icon: Star },
];

const ACTION_TYPES = [
  { value: "send_sms", label: "Send SMS", icon: MessageSquare },
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "add_points", label: "Add Loyalty Points", icon: Gift },
  { value: "apply_discount", label: "Apply Discount", icon: Gift },
  { value: "create_task", label: "Create Task", icon: Calendar },
];

export default function AutomationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  const [automation, setAutomation] = useState<Automation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("");
  const [actionType, setActionType] = useState("");
  const [actionContent, setActionContent] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchAutomation() {
      try {
        const response = await fetch(`/api/automations/${automationId}`);
        if (response.ok) {
          const data = await response.json();
          setAutomation(data);
          setName(data.name || "");
          setDescription(data.description || "");
          setTriggerType(data.triggerType || "");
          setDelayMinutes(data.triggerConfig?.delayMinutes?.toString() || "");
          setIsActive(data.isActive);
          if (data.actions && data.actions.length > 0) {
            setActionType(data.actions[0].type || "");
            setActionContent(data.actions[0].content || "");
          }
        } else {
          router.push("/settings/automations");
        }
      } catch (error) {
        console.error("Error fetching automation:", error);
        router.push("/settings/automations");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAutomation();
  }, [automationId, router]);

  const handleSave = async () => {
    if (!name || !triggerType || !actionType) {
      alert("Please fill in required fields: Name, Trigger, and Action");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          triggerConfig: {
            delayMinutes: delayMinutes ? parseInt(delayMinutes) : 0,
          },
          actions: [
            {
              type: actionType,
              content: actionContent,
            },
          ],
          isActive,
        }),
      });

      if (response.ok) {
        router.push("/settings/automations");
      } else {
        alert("Failed to update automation");
      }
    } catch (error) {
      console.error("Error updating automation:", error);
      alert("Failed to update automation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/settings/automations");
      } else {
        alert("Failed to delete automation");
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
      alert("Failed to delete automation");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Loading automation...</p>
      </div>
    );
  }

  if (!automation) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings/automations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Automation</h1>
            <p className="text-slate-500 mt-1">Update automation settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Appointment Reminder"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this automation does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger *</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select when this automation runs" />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">Delay (minutes)</Label>
              <Input
                id="delay"
                type="number"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-slate-500">
                Wait time before executing the action (0 = immediate)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action *</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select what happens" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(actionType === "send_sms" || actionType === "send_email") && (
              <div className="space-y-2">
                <Label htmlFor="content">
                  {actionType === "send_sms" ? "SMS Message" : "Email Content"}
                </Label>
                <Textarea
                  id="content"
                  value={actionContent}
                  onChange={(e) => setActionContent(e.target.value)}
                  placeholder={
                    actionType === "send_sms"
                      ? "Hi {client_name}, your appointment is tomorrow at {time}..."
                      : "Write your email message here..."
                  }
                  rows={4}
                />
                <p className="text-xs text-slate-500">
                  Variables: {"{client_name}"}, {"{service}"}, {"{date}"}, {"{time}"}, {"{staff}"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-slate-500">
                  {isActive ? "Automation will run" : "Automation is paused"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500 mb-2">Current Status</p>
              <Badge variant={isActive ? "success" : "secondary"}>
                {isActive ? "Active" : "Paused"}
              </Badge>
            </div>

            {automation.timesTriggered !== undefined && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Statistics</h4>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>
                    <strong>Times Triggered:</strong> {automation.timesTriggered}
                  </p>
                  {automation.lastTriggered && (
                    <p>
                      <strong>Last Run:</strong>{" "}
                      {new Date(automation.lastTriggered).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="text-sm text-slate-500 space-y-1">
                <p>
                  <strong>When:</strong>{" "}
                  {triggerType
                    ? TRIGGER_TYPES.find((t) => t.value === triggerType)?.label
                    : "Not selected"}
                </p>
                <p>
                  <strong>Delay:</strong>{" "}
                  {delayMinutes ? `${delayMinutes} minutes` : "Immediate"}
                </p>
                <p>
                  <strong>Then:</strong>{" "}
                  {actionType
                    ? ACTION_TYPES.find((a) => a.value === actionType)?.label
                    : "Not selected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Automation</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this automation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
