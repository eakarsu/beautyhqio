/**
 * Suppliers CRUD (apply pass 7 — backlog #2).
 *
 * The Prisma `Vendor` model already exists (used by `/api/purchase-orders`).
 * This route adds a separate `suppliers` table to capture supplier metadata
 * that does NOT belong on Vendor (lead time, preferred category, etc.) and to
 * support the predictive-supply-ordering chain without altering Prisma schema.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSuppliersTable } from "@/lib/db-pass7";

export async function GET(req: NextRequest) {
  await ensureSuppliersTable();
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  try {
    const rows: any = businessId
      ? await prisma.$queryRawUnsafe(
          `SELECT * FROM suppliers WHERE business_id = $1 ORDER BY name ASC LIMIT 500`,
          businessId
        )
      : await prisma.$queryRawUnsafe(
          `SELECT * FROM suppliers ORDER BY name ASC LIMIT 500`
        );
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: "suppliers read failed", details: e.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await ensureSuppliersTable();
  const body = await req.json().catch(() => ({}));
  const {
    businessId,
    name,
    contactName,
    email,
    phone,
    address,
    category,
    paymentTerms,
    leadTimeDays,
    notes,
  } = body || {};
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  try {
    const r: any = await prisma.$queryRawUnsafe(
      `INSERT INTO suppliers
       (business_id, name, contact_name, email, phone, address,
        category, payment_terms, lead_time_days, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      businessId || null,
      name,
      contactName || null,
      email || null,
      phone || null,
      address || null,
      category || null,
      paymentTerms || null,
      leadTimeDays ?? null,
      notes || null
    );
    return NextResponse.json(r[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "supplier create failed", details: e.message },
      { status: 500 }
    );
  }
}
