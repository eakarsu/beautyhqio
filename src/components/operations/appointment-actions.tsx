'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
const nextSteps: Record<string, [string, string][]> = { BOOKED: [['confirm', 'Confirm'], ['check-in', 'Check in'], ['no-show', 'Mark no-show']], CONFIRMED: [['check-in', 'Check in'], ['no-show', 'Mark no-show']], CHECKED_IN: [['start', 'Start service']], IN_SERVICE: [['complete', 'Complete service']] };
export function AppointmentActions({ appointment, role, onChanged }: { appointment: { id: string; version: number; status: string; isRecurring?: boolean }; role: string; onChanged: () => void }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [date, setDate] = useState(''); const [reason, setReason] = useState(''); const [frequency, setFrequency] = useState('weekly'); const [occurrences, setOccurrences] = useState(6);
  const retry = useRef<{ body: string; key: string } | null>(null);
  const office = ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role);
  async function send(action: string, data: unknown = {}) {
    if (busy) return; setBusy(true); setError('');
    const body = JSON.stringify(data); const signature = action + body;
    if (retry.current?.body !== signature) retry.current = { body: signature, key: crypto.randomUUID() };
    try {
      const url = action === 'recurring' ? '/api/appointments/recurring' : `/api/appointments/${appointment.id}/${action}`;
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': retry.current.key }, body });
      const result = await r.json(); if (!r.ok) throw new Error(result.message || result.error || 'Unable to update appointment');
      retry.current = null; onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update appointment'); } finally { setBusy(false); }
  }
  return <section className="space-y-4 pt-4 border-t"><h3 className="font-semibold">Appointment actions</h3>{error && <p role="alert" className="text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2">{(nextSteps[appointment.status] || []).filter(([key]) => office || (role === 'STAFF' && ['check-in', 'start', 'complete'].includes(key))).map(([action, label]) => <Button key={action} disabled={busy} size="sm" onClick={() => send(action)}>{label}</Button>)}</div>
    {(office || role === 'CLIENT') && ['BOOKED', 'CONFIRMED'].includes(appointment.status) && <>
      <label className="block">Reason for change<input className="block border rounded p-2 w-full" value={reason} maxLength={1000} onChange={e => setReason(e.target.value)}/></label>
      <Button variant="destructive" disabled={busy || reason.trim().length < 3} onClick={() => send('cancel', { reason })}>Cancel appointment</Button>
      <form className="space-y-2" onSubmit={e => { e.preventDefault(); void send('reschedule', { scheduledStart: new Date(date).toISOString(), version: appointment.version, reason }); }}><label className="block">New date and time (your timezone)<input required type="datetime-local" className="block border rounded p-2 w-full" value={date} onChange={e => setDate(e.target.value)}/></label><Button variant="outline" disabled={busy || reason.trim().length < 3}>Reschedule</Button></form>
      {office && !appointment.isRecurring && <form className="space-y-2" onSubmit={e => { e.preventDefault(); void send('recurring', { appointmentId: appointment.id, recurrenceRule: { frequency, occurrences, interval: 1 } }); }}><label className="block">Repeat<select className="block border rounded p-2 w-full" value={frequency} onChange={e => setFrequency(e.target.value)}>{['daily', 'weekly', 'biweekly', 'monthly'].map(f => <option key={f}>{f}</option>)}</select></label><label className="block">Additional appointments<input required type="number" className="block border rounded p-2 w-full" min={1} max={24} value={occurrences} onChange={e => setOccurrences(Number(e.target.value))}/></label><Button variant="outline" disabled={busy}>Create recurring series</Button></form>}
    </>}
  </section>;
}
