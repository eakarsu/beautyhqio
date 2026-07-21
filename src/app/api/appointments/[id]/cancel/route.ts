import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { domainErrorResponse, transitionAppointment } from "@/lib/appointments/service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await transitionAppointment(prisma, user, id, "CANCELLED", String(body.reason || "")));
  } catch (error) {
    const known = domainErrorResponse(error);
    return known ? NextResponse.json(known.body, { status: known.status }) : NextResponse.json({ error: "APPOINTMENT_CANCEL_FAILED" }, { status: 500 });
  }
}
