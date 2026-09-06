import { appointmentListRange } from '../list-range';

test('preserves local day and seven-day ranges as absolute instants', () => {
  const range = appointmentListRange(new URLSearchParams({startDate:'2026-09-05T04:00:00.000Z',endDate:'2026-09-12T03:59:59.999Z'}));
  expect(range?.gte.toISOString()).toBe('2026-09-05T04:00:00.000Z');
  expect(range?.lte.toISOString()).toBe('2026-09-12T03:59:59.999Z');
});
test('accepts the legacy date filter and rejects invalid ranges', () => {
  expect(appointmentListRange(new URLSearchParams('date=2026-09-05'))?.gte.toISOString()).toBe('2026-09-05T00:00:00.000Z');
  expect(appointmentListRange(new URLSearchParams())).toBeUndefined();
  for (const query of ['date=2026-02-30','startDate=2026-09-05','startDate=2026-09-06T00:00:00Z&endDate=2026-09-05T00:00:00Z']) {
    expect(() => appointmentListRange(new URLSearchParams(query))).toThrow(/INVALID_DATE/);
  }
});
