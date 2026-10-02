/**
 * Corporate wellness programs.
 *
 * PRODUCT-DECISION: a corporate wellness "program" is modelled as a parent record
 * with N member clients. It is scoped to the caller's business via `business_id`.
 *
 * Schema: `corporate_wellness_programs`, `corporate_wellness_members`. Both via
 * raw `CREATE TABLE IF NOT EXISTS`.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { context, endpoint } from "@/lib/operations/core";

let ensured = false;
async function ensure() {
  if (ensured) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS corporate_wellness_programs (
      id SERIAL PRIMARY KEY,
      business_id TEXT,
      name TEXT NOT NULL,
      sponsor_company TEXT,
      starts_at TIMESTAMP,
      ends_at TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS corporate_wellness_members (
      id SERIAL PRIMARY KEY,
      program_id INTEGER NOT NULL,
      client_id TEXT NOT NULL,
      joined_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  ensured = true;
}

const programInput = z.object({
  name: z.string().trim().min(1).max(200),
  sponsorCompany: z.string().trim().max(200).optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

// GET /api/corporate-wellness - List programs for the caller's business
export async function GET() {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensure();
    const rows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM corporate_wellness_programs WHERE business_id = $1 ORDER BY created_at DESC LIMIT 200`,
      ctx.businessId
    );
    return rows;
  });
}

// POST /api/corporate-wellness - Create a program in the caller's business
export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const ctx = await context(["OWNER", "MANAGER"]);
    await ensure();
    const input = programInput.parse(await req.json().catch(() => ({})));
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO corporate_wellness_programs (business_id, name, sponsor_company, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      ctx.businessId,
      input.name,
      input.sponsorCompany || null,
      input.startsAt ?? null,
      input.endsAt ?? null
    );
    return r[0];
  });
}
