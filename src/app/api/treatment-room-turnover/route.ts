import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    feature: "Treatment Room Turnover",
    summary: { roomsTracked: 8, readyNow: 5, cleaningBlocked: 2, averageTurnoverMinutes: 11 },
    rooms: [
      { room: "Spa 1", service: "Hydrafacial", status: "ready", nextAppointment: "10:30 AM", action: "Stock serum tray" },
      { room: "Treatment 3", service: "Laser", status: "blocked", nextAppointment: "10:45 AM", action: "Complete safety checklist" },
      { room: "Massage 2", service: "Deep tissue", status: "cleaning", nextAppointment: "11:00 AM", action: "Replace linens and aromatherapy kit" },
    ],
    supplies: [
      { item: "Sterile gauze", roomsLow: 2 },
      { item: "Facial serum set", roomsLow: 1 },
      { item: "Disposable headbands", roomsLow: 3 },
    ],
  });
}
