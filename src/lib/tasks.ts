import { z } from "zod";

export const taskPriorities = ["LOW", "NORMAL", "HIGH"] as const;
export type TaskPriority = (typeof taskPriorities)[number];

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(taskPriorities).default("NORMAL"),
  dueAt: z.string().datetime().optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
  clientId: z.string().min(1).optional().nullable(),
  appointmentId: z.string().min(1).optional().nullable(),
});

export function parseTaskPriority(value: unknown): TaskPriority {
  return value === "LOW" || value === "HIGH" ? value : "NORMAL";
}

export function parseDueAt(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const CLIENT_AUTOMATION_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "mobile",
  "preferredContactMethod",
  "preferredLanguage",
  "notes",
  "internalNotes",
  "status",
] as const;

const CLIENT_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED", "VIP"] as const;

export function pickClientAutomationUpdate(
  fields: Record<string, unknown>,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const keys = Object.keys(fields ?? {});
  if (keys.length === 0) return { ok: false, error: "update_record requires fields to change" };
  const rejected = keys.filter(
    (k) => !(CLIENT_AUTOMATION_FIELDS as readonly string[]).includes(k),
  );
  if (rejected.length > 0) {
    return { ok: false, error: "Fields not allowed for automation update: " + rejected.join(", ") };
  }
  const data: Record<string, unknown> = {};
  for (const key of keys) {
    const value = fields[key];
    if (key === "status") {
      if (typeof value !== "string" || !(CLIENT_STATUSES as readonly string[]).includes(value)) {
        return { ok: false, error: "status must be one of " + CLIENT_STATUSES.join(", ") };
      }
      data.status = value;
    } else if (typeof value === "string") {
      data[key] = value.slice(0, key === "notes" || key === "internalNotes" ? 5000 : 200);
    } else {
      return { ok: false, error: "Field " + key + " must be a string" };
    }
  }
  return { ok: true, data };
}
