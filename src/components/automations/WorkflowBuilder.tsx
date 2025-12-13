"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TriggerConfig, TriggerType } from "./TriggerConfig";
import { ActionConfig, ActionType } from "./ActionConfig";
import {
  Zap,
  Plus,
  ArrowRight,
  Trash2,
  Save,
  Play,
  GripVertical,
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  config: Record<string, unknown>;
}

interface Workflow {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    type: TriggerType;
    config: Record<string, unknown>;
  };
  actions: Array<{
    id: string;
    type: ActionType;
    config: Record<string, unknown>;
    delay?: number;
  }>;
}

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
}

export function WorkflowBuilder({ workflow, onSave, onCancel }: WorkflowBuilderProps) {
  const [workflowData, setWorkflowData] = useState<Workflow>(
    workflow || {
      name: "",
      description: "",
      isActive: true,
      trigger: {
        type: "appointment_booked",
        config: {},
      },
      actions: [],
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const addAction = () => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          id: `action-${Date.now()}`,
          type: "send_email",
          config: {},
        },
      ],
    }));
  };

  const updateAction = (index: number, updates: Partial<Workflow["actions"][0]>) => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, ...updates } : action
      ),
    }));
  };

  const removeAction = (index: number) => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(workflowData);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = workflowData.name && workflowData.trigger.type && workflowData.actions.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {workflow ? "Edit Workflow" : "Create Workflow"}
          </CardTitle>
          <CardDescription>
            Build automated workflows that trigger based on events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={workflowData.name}
                onChange={(e) =>
                  setWorkflowData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Welcome Email for New Clients"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={workflowData.description || ""}
                onChange={(e) =>
                  setWorkflowData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="What does this workflow do?"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {/* Trigger */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">WHEN</Badge>
                <span className="font-medium">Trigger</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TriggerConfig
              type={workflowData.trigger.type}
              config={workflowData.trigger.config}
              onChange={(type, config) =>
                setWorkflowData((prev) => ({
                  ...prev,
                  trigger: { type, config },
                }))
              }
            />
          </CardContent>
        </Card>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Actions */}
        {workflowData.actions.map((action, index) => (
          <div key={action.id}>
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <Badge className="bg-green-600">THEN</Badge>
                    <span className="font-medium">Action {index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ActionConfig
                  type={action.type}
                  config={action.config}
                  delay={action.delay}
                  onChange={(type, config, delay) =>
                    updateAction(index, { type, config, delay })
                  }
                />
              </CardContent>
            </Card>

            {/* Arrow between actions */}
            {index < workflowData.actions.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
              </div>
            )}
          </div>
        ))}

        {/* Add Action Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={addAction}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Action
        </Button>
      </div>

      {/* Preview */}
      {workflowData.name && workflowData.actions.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Workflow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <strong>When</strong> {getTriggerLabel(workflowData.trigger.type)},{" "}
              <strong>then</strong>{" "}
              {workflowData.actions
                .map((a, i) => `${i > 0 ? "and " : ""}${getActionLabel(a.type)}`)
                .join(", ")}
              .
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Separator />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!isValid}>
            <Play className="h-4 w-4 mr-2" />
            Test Workflow
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTriggerLabel(type: TriggerType): string {
  const labels: Record<TriggerType, string> = {
    appointment_booked: "an appointment is booked",
    appointment_completed: "an appointment is completed",
    appointment_cancelled: "an appointment is cancelled",
    no_show: "a client no-shows",
    new_client: "a new client signs up",
    client_birthday: "it's a client's birthday",
    inactive_client: "a client becomes inactive",
    review_received: "a review is received",
    payment_received: "a payment is received",
  };
  return labels[type] || type;
}

function getActionLabel(type: ActionType): string {
  const labels: Record<ActionType, string> = {
    send_email: "send an email",
    send_sms: "send an SMS",
    add_points: "add loyalty points",
    apply_discount: "apply a discount",
    create_task: "create a task",
    update_client: "update client info",
    send_notification: "send a notification",
    webhook: "call a webhook",
  };
  return labels[type] || type;
}
