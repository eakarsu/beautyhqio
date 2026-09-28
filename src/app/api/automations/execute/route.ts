import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";

async function findTenantClient(businessId: string, clientId: unknown) {
  if (typeof clientId !== "string" || !clientId) return null;
  return prisma.client.findFirst({
    where: { id: clientId, businessId },
    select: { id: true, tags: true },
  });
}

// POST /api/automations/execute - Execute this business's automation actions
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoles(["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const { trigger } = body;
    const data: Record<string, unknown> =
      body.data && typeof body.data === "object" ? body.data : {};

    if (typeof trigger !== "string" || !trigger.trim()) {
      return NextResponse.json({ error: "trigger is required" }, { status: 400 });
    }

    const businessId = auth.isPlatformAdmin
      ? typeof body.businessId === "string"
        ? body.businessId
        : null
      : auth.businessId;
    if (!businessId) {
      return NextResponse.json(
        { error: "A businessId is required to execute automations" },
        { status: auth.isPlatformAdmin ? 400 : 403 },
      );
    }

    // Only automations owned by this business run.
    const automations = await prisma.automation.findMany({
      where: { triggerType: trigger, isActive: true, businessId },
    });

    const results = [];

    for (const automation of automations) {
      const triggerConfig = automation.triggerConfig as Record<string, unknown> | null;
      const actions = Array.isArray(automation.actions) ? (automation.actions as any[]) : [];

      // Evaluate trigger config conditions
      let conditionsMet = true;
      if (triggerConfig) {
        for (const [field, expected] of Object.entries(triggerConfig)) {
          if (data[field] !== expected) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (!conditionsMet) continue;

      // Execute actions. Email/SMS go through the real providers and report
      // only what the provider accepted; unimplemented actions fail honestly.
      const actionResults: Record<string, unknown>[] = [];
      for (const action of actions) {
        try {
          switch (action.type) {
            case "send_email": {
              const recipient = action.to || data.clientEmail;
              const subject = typeof action.subject === "string" ? action.subject : "Notification";
              const html =
                typeof action.html === "string"
                  ? action.html
                  : typeof action.message === "string"
                    ? `<p>${action.message}</p>`
                    : "";
              if (typeof recipient !== "string" || !recipient || !html) {
                actionResults.push({
                  type: "email",
                  recipient: recipient ?? null,
                  status: "failed",
                  error: "Email action requires a recipient and content",
                });
                break;
              }
              const delivered = await sendEmail({ to: recipient, subject, html });
              actionResults.push(
                delivered.success
                  ? { type: "email", recipient, status: "queued", providerRef: delivered.messageId ?? null }
                  : { type: "email", recipient, status: "failed", error: delivered.error || "Email provider rejected the message" },
              );
              break;
            }

            case "send_sms": {
              const recipient = action.to || data.clientPhone;
              const message = typeof action.message === "string" ? action.message : "";
              if (typeof recipient !== "string" || !recipient || !message) {
                actionResults.push({
                  type: "sms",
                  recipient: recipient ?? null,
                  status: "failed",
                  error: "SMS action requires a recipient and a message",
                });
                break;
              }
              const delivered = await sendSMS({ to: recipient, message });
              actionResults.push(
                delivered.success
                  ? { type: "sms", recipient, status: "queued", providerRef: delivered.messageId ?? null }
                  : { type: "sms", recipient, status: "failed", error: delivered.error || "SMS provider rejected the message" },
              );
              break;
            }

            case "create_task":
              // No task store exists, so nothing is created; say so instead of
              // reporting a simulated task.
              actionResults.push({
                type: "task",
                title: action.title ?? null,
                status: "failed",
                error: "create_task is not implemented; no task was created",
              });
              break;

            case "update_record":
              actionResults.push({
                type: "update",
                model: action.model ?? null,
                id: action.recordId ?? data.id ?? null,
                status: "failed",
                error: "update_record is not implemented; no record was changed",
              });
              break;

            case "add_tag": {
              const client = await findTenantClient(businessId, data.clientId);
              if (!client) {
                actionResults.push({
                  type: "add_tag",
                  clientId: data.clientId ?? null,
                  status: "failed",
                  error: "Client not found in this business",
                });
                break;
              }
              const currentTags = (client.tags as string[]) || [];
              if (typeof action.tag === "string" && action.tag && !currentTags.includes(action.tag)) {
                await prisma.client.update({
                  where: { id: client.id },
                  data: { tags: [...currentTags, action.tag] },
                });
              }
              actionResults.push({
                type: "add_tag",
                clientId: client.id,
                tag: action.tag ?? null,
                status: "added",
              });
              break;
            }

            case "create_activity": {
              const client = await findTenantClient(businessId, data.clientId);
              if (!client) {
                actionResults.push({
                  type: "activity",
                  clientId: data.clientId ?? null,
                  status: "failed",
                  error: "Client not found in this business",
                });
                break;
              }
              await prisma.activity.create({
                data: {
                  clientId: client.id,
                  type: action.activityType || "AUTOMATION",
                  title: action.title,
                  description: action.description,
                  metadata: { automationId: automation.id, trigger },
                },
              });
              actionResults.push({ type: "activity", clientId: client.id, status: "created" });
              break;
            }

            default:
              actionResults.push({
                type: action.type ?? "unknown",
                status: "failed",
                error: "Unknown action type",
              });
          }
        } catch (actionError) {
          actionResults.push({
            type: action.type,
            status: "failed",
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
