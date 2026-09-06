jest.mock('@/lib/prisma', () => ({ prisma: {} }));
jest.mock('@/lib/api-auth', () => ({ getAuthenticatedUser: jest.fn() }));
import { giftRedemptionSchema, receiveSchema } from '../balances';
import { csv } from '../core';
import { workedMinutes } from '../time';
import { validateImage } from '../ai';
import { localDateTime } from '@/lib/appointments/availability';
import { recurringDates } from '@/lib/appointments/recurrence';

describe('operation boundaries', () => {
  test.each([-10, 0, 1.001, NaN, Infinity])('rejects invalid gift redemption %s', amount => {
    expect(giftRedemptionSchema.safeParse({ code: 'CARD', amount }).success).toBe(false);
  });
  test('accepts cent-precise redemption', () => expect(giftRedemptionSchema.parse({ code: 'CARD', amount: 1.15 }).amount).toBe(1.15));
  test('rejects duplicate and negative receiving lines', () => {
    expect(receiveSchema.safeParse({ items: [{ itemId: 'a', quantityReceived: 2 }, { itemId: 'a', quantityReceived: 2 }] }).success).toBe(false);
    expect(receiveSchema.safeParse({ items: [{ itemId: 'a', quantityReceived: -1 }] }).success).toBe(false);
  });
  test('calculates paid time and rejects impossible breaks', () => {
    const start = new Date('2026-09-06T09:00Z'); const end = new Date('2026-09-06T17:00Z');
    expect(workedMinutes(start, end, 30)).toBe(450);
    expect(() => workedMinutes(start, end, 500)).toThrow();
  });
  test('escapes spreadsheet formula injection and quotes', () => {
    expect(csv([['=HYPERLINK("bad")', 'normal, cell']])).toBe('"\'=HYPERLINK(""bad"")","normal, cell"');
  });
  test('rejects mislabeled image payloads and remote image URLs', () => {
    expect(() => validateImage('data:image/png;base64,' + Buffer.from('not a png').toString('base64'))).toThrow();
    expect(() => validateImage('https://example.com/photo.jpg')).toThrow();
  });
  test('converts local time across DST and rejects nonexistent times', () => {
    expect(localDateTime('2026-11-02', '09:00', 'America/New_York').toISOString()).toBe('2026-11-02T14:00:00.000Z');
    expect(() => localDateTime('2026-03-08', '02:30', 'America/New_York')).toThrow();
  });
  test('recurrences retain local time across DST and clamp month ends', () => {
    const weekly = recurringDates(new Date('2026-03-01T14:00Z'), { frequency: 'weekly', interval: 1, occurrences: 2 }, 'America/New_York');
    expect(weekly[0].toISOString()).toBe('2026-03-08T13:00:00.000Z');
    const monthly = recurringDates(new Date('2026-01-31T14:00Z'), { frequency: 'monthly', interval: 1, occurrences: 2 }, 'America/New_York');
    expect(monthly.map(d => d.toISOString().slice(0, 10))).toEqual(['2026-02-28', '2026-03-31']);
  });
});
