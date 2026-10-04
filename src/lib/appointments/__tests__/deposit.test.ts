import { requiredDepositCents } from '../deposit';

describe('required deposit snapshot', () => {
  it('uses fixed or percent per service in cents', () => {
    expect(requiredDepositCents([{ price: 75, requireDeposit: true, depositAmount: 20, depositPercent: null }, { price: 45, requireDeposit: true, depositAmount: null, depositPercent: 25 }, { price: 50, requireDeposit: false, depositAmount: null, depositPercent: null }])).toBe(3125);
  });
  it('rejects missing and excessive configuration', () => {
    expect(() => requiredDepositCents([{ price: 50, requireDeposit: true, depositAmount: null, depositPercent: null }])).toThrow();
    expect(() => requiredDepositCents([{ price: 50, requireDeposit: true, depositAmount: 75, depositPercent: null }])).toThrow();
  });
});
