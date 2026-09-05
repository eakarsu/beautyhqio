export interface BookingForm {
  clientId: string; staffId: string; serviceId: string; date: string; time: string; notes: string;
}
export function bookingBody(form: BookingForm, locationId: string) {
  if (!locationId || !form.staffId || !form.serviceId || !form.date || !form.time) throw new Error("Choose a staff member, service, date and time");
  return { clientId: form.clientId === "walk-in" ? null : form.clientId || null, staffId: form.staffId, locationId,
    scheduledStart: new Date(`${form.date}T${form.time}`).toISOString(),
    serviceIds: [form.serviceId], notes: form.notes, source: "PHONE" as const };
}
export function bookingRequest(body: ReturnType<typeof bookingBody>, previous: { body: string; key: string } | null) {
  const json = JSON.stringify(body);
  const attempt = previous?.body === json ? previous : { body: json, key: crypto.randomUUID() };
  return { attempt, init: { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key }, body: json } };
}
