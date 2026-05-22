"use client";

import { useEffect, useState } from "react";

type Data = {
  summary: Record<string, number>;
  rooms: Array<{ room: string; service: string; status: string; nextAppointment: string; action: string }>;
  supplies: Array<{ item: string; roomsLow: number }>;
};

export default function TreatmentRoomTurnoverPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/treatment-room-turnover")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div className="p-6">Loading treatment room turnover...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Treatment Room Turnover</h1>
        <p className="text-slate-600">Coordinate room readiness, cleaning blockers, and service-specific supplies between appointments.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(data.summary).map(([key, value]) => (
          <div key={key} className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-semibold text-rose-600">{value}</div>
            <div className="text-sm text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold mb-3">Room Queue</h2>
          {data.rooms.map((room) => (
            <div key={room.room} className="border-t py-3">
              <div className="font-medium">{room.room} - {room.service}</div>
              <div className="text-sm text-slate-600">{room.status} for {room.nextAppointment}</div>
              <div className="text-sm text-rose-600">{room.action}</div>
            </div>
          ))}
        </section>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold mb-3">Supply Restock</h2>
          {data.supplies.map((item) => (
            <div key={item.item} className="border-t py-3">
              <div className="font-medium">{item.item}</div>
              <div className="text-sm text-slate-600">{item.roomsLow} rooms low</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
