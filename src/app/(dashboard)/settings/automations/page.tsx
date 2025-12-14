"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Plus,
  Calendar,
  Gift,
  Star,
  Clock,
  Trash2,
  ArrowLeft,
} from "lucide-react";

interface Automation {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  isActive: boolean;
  timesTriggered: number;
  lastTriggered?: string;
}

const TRIGGER_TYPES = [
  { value: "appointment_booked", label: "Appointment Booked", icon: Calendar },
  { value: "appointment_completed", label: "Appointment Completed", icon: Calendar },
  { value: "no_show", label: "No Show", icon: Clock },
  { value: "birthday", label: "Client Birthday", icon: Gift },
  { value: "inactive_client", label: "Inactive Client", icon: Clock },
  { value: "new_client", label: "New Client", icon: Star },
  { value: "review_received", label: "Review Received", icon: Star },
];


export default function AutomationsSettingsPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await fetch("/api/automations");
      if (response.ok) {
        const data = await response.json();
        setAutomations(data);
      }
    } catch (error) {
      console.error("Error fetching automations:", error);
      // Demo data
      setAutomations([
        {
          id: "1",
          name: "Appointment Reminder",
          description: "Send SMS reminder 24 hours before appointment",
          triggerType: "appointment_booked",
          isActive: true,
          timesTriggered: 156,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: "2",
          name: "Post-Visit Thank You",
          description: "Send thank you email after appointment completion",
          triggerType: "appointment_completed",
          isActive: true,
          timesTriggered: 89,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: "3",
          name: "Birthday Special",
          description: "Send birthday discount code on client's birthday",
          triggerType: "birthday",
          isActive: true,
          timesTriggered: 23,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: "4",
          name: "No-Show Follow-Up",
          description: "Send SMS after a no-show to reschedule",
          triggerType: "no_show",
          isActive: false,
          timesTriggered: 12,
        },
        {
          id: "5",
          name: "Win-Back Campaign",
          description: "Email clients who haven't visited in 60 days",
          triggerType: "inactive_client",
          isActive: true,
          timesTriggered: 45,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive } : a))
      );
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id));
        setDeleteId(null);
      } else {
        alert("Failed to delete automation");
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
      alert("Failed to delete automation");
    } finally {
      setIsDeleting(false);
    }
  };

  const getTriggerLabel = (type: string) => {
    return TRIGGER_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTriggerIcon = (type: string) => {
    const Icon = TRIGGER_TYPES.find((t) => t.value === type)?.icon || Zap;
    return Icon;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/marketing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Workflow Automations</h1>
            <p className="text-muted-foreground">
              Automate repetitive tasks and client communications
            </p>
          </div>
        </div>
        <Button
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() => router.push("/settings/automations/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Automations</CardTitle>
          <CardDescription>
            Automations run automatically when their trigger conditions are met
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading automations...
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No automations set up yet</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => router.push("/settings/automations/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first automation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {automations.map((automation) => {
                const TriggerIcon = getTriggerIcon(automation.triggerType);
                return (
                  <div
                    key={automation.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-rose-300 transition-colors ${
                      automation.isActive ? "bg-white" : "bg-muted/50"
                    }`}
                    onClick={() => router.push(`/settings/automations/${automation.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          automation.isActive ? "bg-rose-100" : "bg-gray-100"
                        }`}
                      >
                        <TriggerIcon
                          className={`h-5 w-5 ${
                            automation.isActive ? "text-rose-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{automation.name}</span>
                          <Badge variant={automation.isActive ? "default" : "secondary"}>
                            {automation.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        {automation.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {automation.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Trigger: {getTriggerLabel(automation.triggerType)}</span>
                          <span>Runs: {automation.timesTriggered}</span>
                          {automation.lastTriggered && (
                            <span>
                              Last run:{" "}
                              {new Date(automation.lastTriggered).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={(checked) =>
                          toggleAutomation(automation.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteId(automation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Automation</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this automation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
