export type ScheduleObservation = { staffId: string; scheduledStart: Date; scheduledEnd: Date; status: string };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function schedulingEvidence(rows: ScheduleObservation[], timeZone: string) {
  const buckets = DAY_NAMES.map((name) => ({ name, completed: 0, noShows: 0, gapsMinutes: [] as number[] }));
  const byStaffDay = new Map<string, ScheduleObservation[]>();
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
  for (const row of rows) {
    if (!['COMPLETED', 'NO_SHOW'].includes(row.status)) continue;
    const parts = Object.fromEntries(formatter.formatToParts(row.scheduledStart).map((part) => [part.type, part.value]));
    const bucket = buckets.find((item) => item.name === parts.weekday);
    if (!bucket) continue;
    if (row.status === 'NO_SHOW') bucket.noShows += 1;
    else bucket.completed += 1;
    const key = `${row.staffId}:${parts.year}-${parts.month}-${parts.day}`;
    byStaffDay.set(key, [...(byStaffDay.get(key) || []), row]);
  }
  for (const appointments of byStaffDay.values()) {
    appointments.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
    for (let index = 1; index < appointments.length; index++) {
      const previous = appointments[index - 1];
      const current = appointments[index];
      const minutes = (current.scheduledStart.getTime() - previous.scheduledEnd.getTime()) / 60_000;
      if (minutes < 30 || minutes > 240) continue;
      const day = formatter.formatToParts(current.scheduledStart).find((part) => part.type === 'weekday')?.value;
      buckets.find((item) => item.name === day)?.gapsMinutes.push(minutes);
    }
  }
  const total = buckets.reduce((sum, item) => sum + item.completed + item.noShows, 0);
  const noShows = buckets.reduce((sum, item) => sum + item.noShows, 0);
  const weekdays = buckets.map((item) => {
    const count = item.completed + item.noShows;
    const rate = count >= 10 ? Number((100 * item.noShows / count).toFixed(1)) : null;
    const gapCount = item.gapsMinutes.length;
    return { weekday: item.name, finalizedAppointments: count, noShows: item.noShows, noShowPercent: rate, measuredGaps: gapCount, meanBetweenBookingGapMinutes: gapCount >= 3 ? Math.round(item.gapsMinutes.reduce((sum, value) => sum + value, 0) / gapCount) : null };
  });
  const overallPercent = total >= 20 ? Number((100 * noShows / total).toFixed(1)) : null;
  const observations = weekdays.flatMap((day) => {
    const notes: string[] = [];
    if (day.noShowPercent !== null && overallPercent !== null && day.noShowPercent >= overallPercent + 5) notes.push(`${day.weekday} had ${day.noShowPercent}% recorded no-shows across ${day.finalizedAppointments} finalized appointments, compared with ${overallPercent}% overall. This is an association, not a prediction for any client.`);
    if (day.meanBetweenBookingGapMinutes !== null) notes.push(`${day.weekday} had ${day.measuredGaps} gaps of 30–240 minutes between recorded appointments; mean ${day.meanBetweenBookingGapMinutes} minutes. Opening and closing gaps are not included.`);
    return notes;
  });
  return { finalizedAppointments: total, noShows, overallNoShowPercent: overallPercent, weekdays, observations, limitations: ['Only completed and no-show appointments are included; unfinalized and cancelled appointments are excluded.', 'A rate is hidden below 10 appointments per weekday or 20 overall; a gap mean is hidden below three observed gaps.', 'Historical associations do not predict an individual client and do not change any appointment.', 'The analysis does not account for holidays, staff absences, pricing, reminders or booking-channel changes.'] };
}
