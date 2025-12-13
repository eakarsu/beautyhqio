"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap,
  Plus,
  Calendar,
  MessageSquare,
  Mail,
  Gift,
  Star,
  Clock,
  Edit,
  Trash2,
  Play,
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

const ACTION_TYPES = [
  { value: "send_sms", label: "Send SMS", icon: MessageSquare },
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "add_points", label: "Add Loyalty Points", icon: Gift },
  { value: "apply_discount", label: "Apply Discount", icon: Gift },
  { value: "create_task", label: "Create Task", icon: Calendar },
];

export default function AutomationsSettingsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    triggerType: "",
    actionType: "",
  });

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
        method: "PATCH",
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

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAutomation),
      });
      if (response.ok) {
        setIsDialogOpen(false);
        setNewAutomation({ name: "", triggerType: "", actionType: "" });
        fetchAutomations();
      }
    } catch (error) {
      console.error("Error creating automation:", error);
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
        <div>
          <h1 className="text-2xl font-bold">Workflow Automations</h1>
          <p className="text-muted-foreground">
            Automate repetitive tasks and client communications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Automation</DialogTitle>
              <DialogDescription>
                Set up a new automated workflow for your business
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newAutomation.name}
                  onChange={(e) =>
                    setNewAutomation({ ...newAutomation, name: e.target.value })
                  }
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={newAutomation.triggerType}
                  onValueChange={(v) =>
                    setNewAutomation({ ...newAutomation, triggerType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
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
                <Label>Action</Label>
                <Select
                  value={newAutomation.actionType}
                  onValueChange={(v) =>
                    setNewAutomation({ ...newAutomation, actionType: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newAutomation.name || !newAutomation.triggerType}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Create Automation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                onClick={() => setIsDialogOpen(true)}
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
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      automation.isActive ? "bg-white" : "bg-muted/50"
                    }`}
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.isActive}
                        onCheckedChange={(checked) =>
                          toggleAutomation(automation.id, checked)
                        }
                      />
                      <Button variant="ghost" size="icon" onClick={() => alert(`Edit automation: ${automation.name}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => {
                        if (confirm(`Delete automation "${automation.name}"?`)) {
                          setAutomations(prev => prev.filter(a => a.id !== automation.id));
                        }
                      }}>
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
    </div>
  );
}
