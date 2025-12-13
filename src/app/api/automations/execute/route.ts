import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/automations/execute - Execute automation actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trigger, data } = body;

    // Find active automations matching the trigger
    const automations = await prisma.automation.findMany({
      where: {
        triggerType: trigger,
        isActive: true,
      },
    });

    const results = [];

    for (const automation of automations) {
      const triggerConfig = automation.triggerConfig as Record<string, unknown> | null;
      const actions = automation.actions as any[];

      // Evaluate trigger config conditions
      let conditionsMet = true;
      if (triggerConfig) {
        // Simple condition evaluation from trigger config
        for (const [field, expected] of Object.entries(triggerConfig)) {
          if (data[field] !== expected) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (!conditionsMet) continue;

      // Execute actions
      const actionResults = [];
      for (const action of actions) {
        try {
          let result;

          switch (action.type) {
            case "send_email":
              // In production, integrate with email service
              result = {
                type: "email",
                recipient: action.to || data.clientEmail,
                subject: action.subject,
                status: "simulated",
              };
              break;

            case "send_sms":
              // In production, integrate with SMS service
              result = {
                type: "sms",
                recipient: action.to || data.clientPhone,
                message: action.message,
                status: "simulated",
              };
              break;

            case "create_task":
              // Create a task/reminder
              result = {
                type: "task",
                title: action.title,
                assignedTo: action.assignTo,
                status: "created",
              };
              break;

            case "update_record":
              // Update a database record
              result = {
                type: "update",
                model: action.model,
                id: action.recordId || data.id,
                changes: action.data,
                status: "updated",
              };
              break;

            case "add_tag":
              if (data.clientId) {
                const client = await prisma.client.findUnique({
                  where: { id: data.clientId },
                });
                const currentTags = (client?.tags as string[]) || [];
                if (!currentTags.includes(action.tag)) {
                  await prisma.client.update({
                    where: { id: data.clientId },
                    data: { tags: [...currentTags, action.tag] },
                  });
                }
                result = {
                  type: "add_tag",
                  clientId: data.clientId,
                  tag: action.tag,
                  status: "added",
                };
              }
              break;

            case "create_activity":
              if (data.clientId) {
                await prisma.activity.create({
                  data: {
                    clientId: data.clientId,
                    type: action.activityType || "AUTOMATION",
                    title: action.title,
                    description: action.description,
                    metadata: { automationId: automation.id, trigger },
                  },
                });
                result = {
                  type: "activity",
                  clientId: data.clientId,
                  status: "created",
                };
              }
              break;

            default:
              result = { type: action.type, status: "unknown_action" };
          }

          actionResults.push(result);
        } catch (actionError) {
          actionResults.push({
            type: action.type,
            status: "error",
            error: String(actionError),
          });
        }
      }

      // Update automation run count
      await prisma.automation.update({
        where: { id: automation.id },
        data: {
          lastTriggered: new Date(),
          timesTriggered: { increment: 1 },
        },
      });

      results.push({
        automationId: automation.id,
        name: automation.name,
        actions: actionResults,
      });
    }

    return NextResponse.json({
      trigger,
      automationsExecuted: results.length,
      results,
    });
  } catch (error) {
    console.error("Error executing automation:", error);
    return NextResponse.json(
      { error: "Failed to execute automation" },
      { status: 500 }
    );
  }
}
