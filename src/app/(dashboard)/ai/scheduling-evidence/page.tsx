'use client';
import { useState } from 'react';

type Day = { weekday: string; finalizedAppointments: number; noShows: number; noShowPercent: number | null; measuredGaps: number; meanBetweenBookingGapMinutes: number | null };
type Result = { finalizedAppointments: number; noShows: number; overallNoShowPercent: number | null; weekdays: Day[]; observations: string[]; limitations: string[]; historyStart: string; historyEnd: string; timeZone: string; recordsTruncated: boolean };

export default function SchedulingEvidencePage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function analyze() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/ai/scheduling-evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ historyUseAcknowledged: acknowledged }) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Analysis unavailable');
      setResult(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Analysis unavailable'); }
    finally { setBusy(false); }
  }
  return <main className="max-w-5xl mx-auto p-6 space-y-5"><h1 className="text-2xl font-semibold">Measured scheduling patterns</h1>
    <p>This analysis uses de-identified appointment timing and final status from your business. It does not score clients or change bookings.</p>
    <label className="flex gap-2"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)}/> I am authorized to analyze this salon&apos;s historical scheduling records.</label>
    <button className="rounded bg-rose-600 text-white px-4 py-2 disabled:opacity-50" disabled={!acknowledged || busy} onClick={() => void analyze()}>{busy ? 'Analyzing…' : 'Analyze history'}</button>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {result && <><section className="rounded border p-4 space-y-2"><h2 className="font-semibold">Evidence window</h2><p>{new Date(result.historyStart).toLocaleDateString()} – {new Date(result.historyEnd).toLocaleDateString()} · {result.timeZone}</p>
      <p>{result.finalizedAppointments} finalized appointments · {result.noShows} no-shows · Overall rate: {result.overallNoShowPercent === null ? 'insufficient sample' : `${result.overallNoShowPercent}%`}</p>
      {result.recordsTruncated && <p className="text-amber-700">Record limit reached; results may omit older appointments.</p>}</section>
      <section className="rounded border p-4 overflow-x-auto"><h2 className="font-semibold mb-2">By weekday</h2><table className="w-full text-left"><thead><tr><th>Day</th><th>Finalized</th><th>No-shows</th><th>No-show rate</th><th>Between-booking gaps</th><th>Mean gap</th></tr></thead><tbody>{result.weekdays.map((day) => <tr key={day.weekday} className="border-t"><td>{day.weekday}</td><td>{day.finalizedAppointments}</td><td>{day.noShows}</td><td>{day.noShowPercent === null ? 'Insufficient sample' : `${day.noShowPercent}%`}</td><td>{day.measuredGaps}</td><td>{day.meanBetweenBookingGapMinutes === null ? 'Insufficient sample' : `${day.meanBetweenBookingGapMinutes} min`}</td></tr>)}</tbody></table></section>
      <section className="rounded border p-4"><h2 className="font-semibold">What the history shows</h2>{result.observations.length ? <ul className="list-disc pl-5">{result.observations.map((note) => <li key={note}>{note}</li>)}</ul> : <p>No weekday pattern meets the evidence thresholds.</p>}</section>
      <section className="rounded border p-4"><h2 className="font-semibold">Limits</h2><ul className="list-disc pl-5">{result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </>}
  </main>;
}
