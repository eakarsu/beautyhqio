import { schedulingEvidence } from '../scheduling-evidence';

test('measured weekday counts and between-booking gaps use the business timezone', () => {
  // Use one Monday with three consecutive appointments to measure two gaps.
  const measured = schedulingEvidence([
    { staffId: 'a', scheduledStart: new Date('2026-06-01T14:00:00Z'), scheduledEnd: new Date('2026-06-01T14:30:00Z'), status: 'COMPLETED' },
    { staffId: 'a', scheduledStart: new Date('2026-06-01T15:00:00Z'), scheduledEnd: new Date('2026-06-01T15:30:00Z'), status: 'NO_SHOW' },
    { staffId: 'a', scheduledStart: new Date('2026-06-01T16:00:00Z'), scheduledEnd: new Date('2026-06-01T16:30:00Z'), status: 'COMPLETED' },
    { staffId: 'b', scheduledStart: new Date('2026-06-01T15:00:00Z'), scheduledEnd: new Date('2026-06-01T15:30:00Z'), status: 'CANCELLED' },
  ], 'America/New_York');
  expect(measured.finalizedAppointments).toBe(3);
  expect(measured.noShows).toBe(1);
  expect(measured.overallNoShowPercent).toBeNull();
  expect(measured.weekdays.find((day) => day.weekday === 'Monday')).toMatchObject({ finalizedAppointments: 3, measuredGaps: 2, noShowPercent: null, meanBetweenBookingGapMinutes: null });
});
