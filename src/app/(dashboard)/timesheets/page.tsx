'use client';
import { useState } from 'react';
import { useOperation } from '@/components/operations/use-operation';
import { Button } from '@/components/ui/button';
type Staff = { id: string; displayName: string | null; user: { firstName: string; lastName: string } };
type Entry = { id: string; staff: Staff; clockIn: string; clockOut: string | null; minutes: number | null; breakMinutes: number; status: string; version: number };
export default function TimesheetsPage() {
  const { data, error, busy, save, load } = useOperation<{ entries: Entry[]; staff: Staff[]; canApprove: boolean; truncated: boolean }>('/api/operations/timesheets');
  const [staffId, setStaffId] = useState('');
  const [breaks, setBreaks] = useState<Record<string, string>>({});
  return <main className="p-6 space-y-6">
    <h1 className="text-2xl font-bold">Timesheets</h1>
    <p>Clock in and out, record unpaid breaks, and approve completed shifts. The export contains approved base hourly pay; commissions, overtime and tax calculations are separate.</p>
    {error && <div role="alert" className="text-red-700">{error} <Button onClick={load} variant="outline">Retry loading</Button></div>}
    {!data && !error && <p role="status">Loading timesheets…</p>}
    {data && <>
      <div className="flex flex-wrap gap-3 items-center">
        <label>Staff <select className="border rounded p-2" value={staffId} onChange={e => setStaffId(e.target.value)}><option value="">Choose staff</option>{data.staff.map(s => <option key={s.id} value={s.id}>{s.displayName || `${s.user.firstName} ${s.user.lastName}`}</option>)}</select></label>
        <Button disabled={busy || !staffId} onClick={() => save({ action: 'clock-in', staffId })}>Clock in</Button>
        <a className="underline" href="/api/operations/timesheets?format=csv">Export approved shifts (last 31 days)</a>
      </div>
      {!data.entries.length && <p>No time entries yet.</p>}
      {data.truncated && <p>Showing the most recent 1,000 entries. Use a shorter date range when exporting.</p>}
      <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{['Staff', 'In', 'Out', 'Paid hours', 'Status', 'Action'].map(t => <th className="p-3" key={t}>{t}</th>)}</tr></thead><tbody>{data.entries.map(e => <tr className="border-t" key={e.id}>
        <td className="p-3">{e.staff.displayName || `${e.staff.user.firstName} ${e.staff.user.lastName}`}</td><td className="p-3">{new Date(e.clockIn).toLocaleString()}</td><td className="p-3">{e.clockOut ? new Date(e.clockOut).toLocaleString() : 'Working'}</td><td className="p-3">{e.minutes === null ? '—' : (e.minutes / 60).toFixed(2)}</td><td className="p-3">{e.status}</td>
        <td className="p-3">{e.status === 'OPEN' && <div className="flex gap-2"><label className="text-sm">Break minutes<input className="border p-2 w-20 block" aria-label={`Break minutes for ${e.staff.displayName || 'staff'}`} type="number" min="0" value={breaks[e.id] || '0'} onChange={v => setBreaks({ ...breaks, [e.id]: v.target.value })}/></label><Button disabled={busy} onClick={() => save({ action: 'clock-out', id: e.id, breakMinutes: Number(breaks[e.id] || 0) })}>Clock out</Button></div>}{e.status === 'SUBMITTED' && data.canApprove && <Button disabled={busy} onClick={() => save({ action: 'approve', id: e.id, version: e.version })}>Approve</Button>}</td>
      </tr>)}</tbody></table></div>
    </>}
  </main>;
}
