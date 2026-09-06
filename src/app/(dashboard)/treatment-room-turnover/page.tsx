'use client';
import { useState } from 'react';
import { useOperation } from '@/components/operations/use-operation';
import { Button } from '@/components/ui/button';
type Room = { id: string; name: string; status: string; version: number; checklist: string[]; completedChecklist: string[]; location: { name: string }; reservations: { id: string; appointmentId: string; start: string; end: string }[] };
export default function TreatmentRoomTurnoverPage() {
  const { data, error, busy, save, load } = useOperation<{ rooms: Room[]; locations: { id: string; name: string }[]; canCreate: boolean }>('/api/treatment-room-turnover');
  const [name, setName] = useState(''); const [locationId, setLocationId] = useState('');
  const [checked, setChecked] = useState<Record<string, string[]>>({});
  const [appointments, setAppointments] = useState<Record<string, string>>({});
  return <main className="p-6 space-y-6"><h1 className="text-2xl font-bold">Treatment room turnover</h1><p>Track cleaning, room readiness and appointment reservations.</p>
    {error && <div role="alert" className="text-red-700">{error} <Button variant="outline" onClick={load}>Retry loading</Button></div>}
    {!data && !error && <p role="status">Loading rooms…</p>}
    {data?.canCreate && <form className="flex gap-3 flex-wrap" onSubmit={async e => { e.preventDefault(); if (await save({ action: 'create', name, locationId })) setName(''); }}><label>Room name<input required className="block border rounded p-2" value={name} onChange={e => setName(e.target.value)} maxLength={100}/></label><label>Location<select required className="block border rounded p-2" value={locationId} onChange={e => setLocationId(e.target.value)}><option value="">Choose location</option>{data.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label><Button disabled={busy} type="submit">Add room</Button></form>}
    {data && !data.rooms.length && <p>No rooms configured. Add a room to begin tracking turnover.</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.rooms.map(room => <section className="rounded-xl border p-5 space-y-3 bg-white" key={room.id}><h2 className="font-semibold text-lg">{room.name}</h2><p>{room.location.name} · {room.status}</p>
      <fieldset><legend className="font-medium">Cleaning checklist</legend>{room.checklist.map(item => <label className="flex items-center gap-2 mt-2" key={item}><input type="checkbox" checked={(checked[room.id] || room.completedChecklist).includes(item)} onChange={e => setChecked({ ...checked, [room.id]: e.target.checked ? [...(checked[room.id] || room.completedChecklist), item] : (checked[room.id] || room.completedChecklist).filter(s => s !== item) })}/>{item}</label>)}</fieldset>
      <div className="flex flex-wrap gap-2">{['READY', 'OCCUPIED', 'DIRTY', 'CLEANING', 'BLOCKED'].map(status => <Button variant="outline" size="sm" key={status} disabled={busy || status === room.status} onClick={async () => { if (await save({ action: 'status', id: room.id, version: room.version, status, completedChecklist: checked[room.id] || room.completedChecklist })) setChecked(c => { const n = { ...c }; delete n[room.id]; return n; }); }}>{status.toLowerCase()}</Button>)}</div>
      <form onSubmit={e => { e.preventDefault(); void save({ action: 'reserve', id: room.id, appointmentId: appointments[room.id] }); }}><label className="text-sm">Appointment ID<input required className="border rounded p-2 w-full" value={appointments[room.id] || ''} onChange={e => setAppointments({ ...appointments, [room.id]: e.target.value })}/></label><Button className="mt-2" size="sm" disabled={busy}>Reserve room</Button></form>
      {room.reservations.map(r => <div className="border-t pt-2 text-sm" key={r.id}>{new Date(r.start).toLocaleString()}–{new Date(r.end).toLocaleTimeString()}<Button variant="ghost" size="sm" disabled={busy} onClick={() => save({ action: 'release', id: room.id, appointmentId: r.appointmentId })}>Release</Button></div>)}
    </section>)}</div>
  </main>;
}
