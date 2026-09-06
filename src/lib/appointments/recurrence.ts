import { z } from 'zod';
import { localDateTime, zonedParts } from './availability';
export const recurrenceSchema = z.object({ frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']), interval: z.number().int().min(1).max(12).default(1), occurrences: z.number().int().min(1).max(24).default(6) });
export function recurringDates(start: Date, rule: z.infer<typeof recurrenceSchema>, timeZone: string) {
  const p = zonedParts(start, timeZone);
  const time = `${String(Math.floor(p.minutes / 60)).padStart(2, '0')}:${String(p.minutes % 60).padStart(2, '0')}`;
  const base = new Date(`${p.date}T12:00:00Z`);
  return Array.from({ length: rule.occurrences }, (_, i) => {
    const date = new Date(base);
    if (rule.frequency === 'monthly') {
      date.setUTCDate(1); date.setUTCMonth(base.getUTCMonth() + (i + 1) * rule.interval);
      const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
      date.setUTCDate(Math.min(base.getUTCDate(), last));
    } else date.setUTCDate(base.getUTCDate() + (i + 1) * rule.interval * (rule.frequency === 'daily' ? 1 : rule.frequency === 'weekly' ? 7 : 14));
    return localDateTime(date.toISOString().slice(0, 10), time, timeZone);
  });
}
