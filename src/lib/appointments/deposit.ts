export type DepositService = { price: { toString(): string } | number; requireDeposit: boolean; depositAmount: { toString(): string } | number | null; depositPercent: { toString(): string } | number | null };

/** Snapshot the configured obligation using cents; never trust browser totals. */
export function requiredDepositCents(services: DepositService[]) {
  return services.reduce((total, service) => {
    if (!service.requireDeposit) return total;
    const priceCents = Math.round(Number(service.price) * 100);
    const fixed = service.depositAmount === null ? null : Math.round(Number(service.depositAmount) * 100);
    const percent = service.depositPercent === null ? null : Number(service.depositPercent);
    const cents = fixed !== null && fixed > 0 ? fixed : percent !== null && percent > 0 ? Math.round(priceCents * percent / 100) : 0;
    if (!Number.isSafeInteger(priceCents) || priceCents <= 0 || !Number.isSafeInteger(cents) || cents <= 0 || cents > priceCents) throw Error('Required deposit configuration is invalid');
    return total + cents;
  }, 0);
}
