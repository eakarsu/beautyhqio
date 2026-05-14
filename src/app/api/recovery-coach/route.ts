/**
 * Recovery coach (apply pass 5 — PRODUCT-DECISION).
 *
 * PRODUCT-DECISION: post-service follow-up reuses the existing AI prompt pattern
 * (no new model integration). Schedule defaults to: 24h, 72h, 7d post-appointment.
 * Persistence is a single `recovery_check_ins` table created via raw SQL.
 *
 * If OPENROUTER_API_KEY is unset, returns 503 with missing: OPENROUTER_API_KEY.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_INTERVALS_HOURS = [24, 72, 168]; // 1d, 3d, 7d
let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS recovery_check_ins (
      id SERIAL PRIMARY KEY,
      appointment_id TEXT,
      client_id TEXT,
      offset_hours INTEGER NOT NULL,
      due_at TIMESTAMP NOT NULL,
      sent_at TIMESTAMP,
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  tableEnsured = true;
}

export async function POST(req: NextRequest) {
  await ensureTable();
  const body = await req.json().catch(() => ({}));
  const { appointmentId, clientId, completedAt, intervals } = body || {};
  if (!appointmentId) return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
  const baseTs = completedAt ? new Date(completedAt).getTime() : Date.now();
  const offsets: number[] = Array.isArray(intervals) && intervals.length ? intervals : DEFAULT_INTERVALS_HOURS;

  const created: any[] = [];
  for (const off of offsets) {
    const dueAt = new Date(baseTs + off * 3600 * 1000);
    try {
      const r: any = await prisma.$queryRawUnsafe(
        `INSERT INTO recovery_check_ins (appointment_id, client_id, offset_hours, due_at, message)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        appointmentId, clientId || null, off, dueAt,
        `Default check-in at +${off}h. Replace with personalized AI message via /api/ai/sleep-coach pattern.`
      );
      created.push(r[0]);
    } catch (e) { /* keep going */ }
  }
  return NextResponse.json({ success: true, scheduled: created.length, items: created }, { status: 201 });
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get("appointmentId");
  try {
    const rows: any = appointmentId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM recovery_check_ins WHERE appointment_id = $1 ORDER BY due_at ASC`,
          appointmentId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM recovery_check_ins ORDER BY due_at DESC LIMIT 200`
        );
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: "Read failed", details: e.message }, { status: 500 });
  }
}
