import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "BOOKED", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED",
  "CANCELLED", "NO_SHOW", "RESCHEDULED",
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

const serviceLineSchema = z.object({
  serviceId: z.string().min(1).max(191),
  price: z.number().finite().nonnegative().max(100_000).optional(),
  duration: z.number().int().min(5).max(720).optional(),
});

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1).max(191).optional().nullable(),
  staffId: z.string().min(1).max(191),
  locationId: z.string().min(1).max(191),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date().optional(),
  services: z.array(serviceLineSchema).min(1).max(12).optional(),
  serviceIds: z.array(z.string().min(1).max(191)).min(1).max(12).optional(),
  notes: z.string().trim().max(1_000).optional().nullable(),
  source: z.enum(["ONLINE", "PHONE", "WALK_IN", "APP", "INSTAGRAM", "FACEBOOK", "REFERRAL", "KIOSK", "AI_VOICE", "MARKETPLACE"]).default("PHONE"),
}).superRefine((value, context) => {
  if (!value.services?.length && !value.serviceIds?.length) {
    context.addIssue({ code: "custom", message: "at least one service is required", path: ["services"] });
  }
  if (value.scheduledEnd && value.scheduledEnd <= value.scheduledStart) {
    context.addIssue({ code: "custom", message: "scheduledEnd must be after scheduledStart", path: ["scheduledEnd"] });
  }
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  BOOKED: ["CONFIRMED", "CHECKED_IN", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  CHECKED_IN: ["IN_SERVICE", "CANCELLED"],
  IN_SERVICE: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new AppointmentDomainError("INVALID_TRANSITION", 409, `${from} cannot transition to ${to}`);
  }
}

export function parseIdempotencyKey(value: string | null): string {
  if (!value || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value)) {
    throw new AppointmentDomainError("INVALID_IDEMPOTENCY_KEY", 422, "Idempotency-Key must be 8-128 safe characters");
  }
  return value;
}

export function retryDelayMs(attempt: number): number {
  return [60_000, 300_000, 1_800_000, 7_200_000, 28_800_000][Math.min(Math.max(attempt - 1, 0), 4)];
}

export class AppointmentDomainError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = "AppointmentDomainError";
  }
}
