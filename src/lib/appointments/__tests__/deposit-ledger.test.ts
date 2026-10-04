import { cashDepositLiabilityCents } from '../deposit-ledger';

describe('cash deposit liability', () => {
  const collected = { kind: 'COLLECTED', amountCents: 2500 };
  test('collection remains owed until exactly one application or cash refund', () => {
    expect(cashDepositLiabilityCents(2500, [collected])).toBe(2500);
    expect(cashDepositLiabilityCents(2500, [collected, { kind: 'APPLIED', amountCents: -2500 }])).toBe(0);
    expect(cashDepositLiabilityCents(2500, [collected, { kind: 'REFUNDED', amountCents: -2500 }])).toBe(0);
  });
  test('rejects missing collection, partial or duplicate credit, and double discharge', () => {
    expect(() => cashDepositLiabilityCents(2500, [])).toThrow();
    expect(() => cashDepositLiabilityCents(2500, [collected, collected])).toThrow();
    expect(() => cashDepositLiabilityCents(2500, [collected, { kind: 'APPLIED', amountCents: -2000 }])).toThrow();
    expect(() => cashDepositLiabilityCents(2500, [collected, { kind: 'APPLIED', amountCents: -2500 }, { kind: 'REFUNDED', amountCents: -2500 }])).toThrow();
  });
});
