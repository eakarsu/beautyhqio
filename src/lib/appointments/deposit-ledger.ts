export type DepositLedgerEntry = { kind: string; amountCents: number };

/** Cash deposits are a liability until the full amount is applied or returned. */
export function cashDepositLiabilityCents(amountCents: number, entries: DepositLedgerEntry[]) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw Error('Invalid deposit amount');
  const seen = new Set<string>();
  let balance = 0;
  for (const entry of entries) {
    if (seen.has(entry.kind)) throw Error('Duplicate deposit ledger event');
    seen.add(entry.kind);
    if (entry.kind === 'COLLECTED' && entry.amountCents === amountCents) balance += entry.amountCents;
    else if (['APPLIED', 'REFUNDED'].includes(entry.kind) && entry.amountCents === -amountCents) balance += entry.amountCents;
    else throw Error('Invalid deposit ledger event');
  }
  if (!seen.has('COLLECTED') || (seen.has('APPLIED') && seen.has('REFUNDED')) || ![0, amountCents].includes(balance))
    throw Error('Deposit liability does not reconcile');
  return balance;
}
