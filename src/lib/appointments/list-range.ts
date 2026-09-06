/** ISO instants from the browser preserve its local day/week boundaries. */
export function appointmentListRange(params: URLSearchParams) {
  const start = params.get('startDate');
  const end = params.get('endDate');
  if (start !== null || end !== null) {
    if (!start || !end || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(start) || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(end)) throw new Error('INVALID_DATE_RANGE');
    const gte = new Date(start), lte = new Date(end);
    if (!Number.isFinite(gte.getTime()) || !Number.isFinite(lte.getTime()) || gte > lte) throw new Error('INVALID_DATE_RANGE');
    return { gte, lte };
  }
  const date = params.get('date');
  if (!date) return undefined;
  const gte = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(gte.getTime()) || gte.toISOString().slice(0, 10) !== date) throw new Error('INVALID_DATE');
  return { gte, lte: new Date(`${date}T23:59:59.999Z`) };
}
