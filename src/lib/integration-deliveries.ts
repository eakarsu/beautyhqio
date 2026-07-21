import { prisma } from "@/lib/prisma";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { sendAppointmentConfirmationSMS } from "@/lib/twilio";
import { syncAppointmentToCalendars } from "@/lib/calendar-sync";
import { retryDelayMs } from "@/lib/appointments/domain";

async function dispatch(delivery: { kind: string; appointmentId: string }) {
  if (delivery.kind.startsWith("CALENDAR_")) {
    const action: "create" | "update" = delivery.kind === "CALENDAR_CREATE" ? "create" : "update";
    const results = await syncAppointmentToCalendars(delivery.appointmentId, action);
    const failed = results.find((result) => !result.success);
    if (failed) throw new Error("CALENDAR_PROVIDER_REJECTED");
    return results.map((result) => result.eventId).filter(Boolean).join(",") || "no-connected-calendar";
  }
  const appointment = await prisma.appointment.findUnique({
    where: { id: delivery.appointmentId },
    include: { client: true, staff: { include: { user: true } }, services: { include: { service: true } }, business: true, location: true },
  });
  if (!appointment?.client) throw new Error("APPOINTMENT_RECIPIENT_MISSING");
  if (!appointment.business) throw new Error("APPOINTMENT_BUSINESS_MISSING");
  const date = appointment.scheduledStart.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = appointment.scheduledStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const service = appointment.services[0]?.service.name || "Appointment";
  const staff = appointment.staff.displayName || `${appointment.staff.user.firstName} ${appointment.staff.user.lastName}`.trim();
  if (delivery.kind === "CONFIRMATION_EMAIL") {
    if (!appointment.client.email || appointment.client.allowEmail === false) return "suppressed";
    const result = await sendAppointmentConfirmationEmail(appointment.client.email, `${appointment.client.firstName} ${appointment.client.lastName}`.trim(), date, time, service, staff, appointment.business.name, appointment.business.phone || "", appointment.business.address || appointment.location.address, appointment.client.preferredLanguage || "en");
    if (!result.success) throw new Error("EMAIL_PROVIDER_REJECTED");
    return result.messageId || "accepted";
  }
  if (delivery.kind === "CONFIRMATION_SMS") {
    if (!appointment.client.phone || appointment.client.allowSms === false) return "suppressed";
    const result = await sendAppointmentConfirmationSMS(appointment.client.phone, appointment.client.firstName, date, time, service, appointment.business.name, appointment.client.preferredLanguage || "en");
    if (!result.success) throw new Error("SMS_PROVIDER_REJECTED");
    return result.messageId || "accepted";
  }
  throw new Error("UNSUPPORTED_DELIVERY_KIND");
}

export async function processIntegrationDeliveries(limit = 20) {
  const processed: { id: string; status: string }[] = [];
  for (let index = 0; index < Math.min(Math.max(limit, 1), 100); index += 1) {
    const delivery = await prisma.$transaction(async (tx) => {
      const candidate = await tx.integrationDelivery.findFirst({
        where: { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: new Date() } },
        orderBy: { createdAt: "asc" },
      });
      if (!candidate) return null;
      const claimed = await tx.integrationDelivery.updateMany({
        where: { id: candidate.id, status: candidate.status, attempts: candidate.attempts },
        data: { status: "PROCESSING", attempts: { increment: 1 } },
      });
      return claimed.count === 1 ? { ...candidate, attempts: candidate.attempts + 1 } : null;
    });
    if (!delivery) break;
    try {
      const providerRef = await dispatch(delivery);
      await prisma.integrationDelivery.update({ where: { id: delivery.id }, data: { status: "DELIVERED", deliveredAt: new Date(), providerRef, lastErrorCode: null } });
      processed.push({ id: delivery.id, status: "DELIVERED" });
    } catch (error) {
      const terminal = delivery.attempts >= 5;
      await prisma.integrationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: terminal ? "DEAD_LETTER" : "RETRY",
          nextAttemptAt: new Date(Date.now() + retryDelayMs(delivery.attempts)),
          lastErrorAt: new Date(),
          lastErrorCode: error instanceof Error ? error.message.slice(0, 80) : "UNKNOWN_PROVIDER_ERROR",
        },
      });
      processed.push({ id: delivery.id, status: terminal ? "DEAD_LETTER" : "RETRY" });
    }
  }
  return processed;
}
