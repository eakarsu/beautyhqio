/**
 * Apply pass 7 schema bootstrap (raw SQL, additive only).
 *
 * The audit's backlog items 1-7 introduce tables that do NOT exist in the Prisma
 * schema. Rather than mutate `prisma/schema.prisma` (which would require a real
 * migration), this module exposes idempotent `CREATE TABLE IF NOT EXISTS` SQL
 * gated by an in-memory flag per table family. Tables created here:
 *
 *  - inventory                       (backlog #1)
 *  - suppliers                       (backlog #2)
 *  - facility_maintenance            (backlog #3)
 *  - corporate_wellness_programs     (backlog #5)
 *  - corporate_wellness_enrollments  (backlog #5)
 *  - recovery_coach_sessions         (backlog #6)
 *  - pass7_purchase_orders           (backlog #7 advisory drafts; does NOT
 *                                     touch the canonical `PurchaseOrder`
 *                                     Prisma model used by /api/purchase-orders)
 *
 * Notes:
 *  - All decision/AI outputs that route through these tables include the
 *    `disclaimer` + `requires_human_review: true` envelope at the route layer.
 *  - Apple Health / Fitbit integrations have no table — they return 503 stubs.
 */
import { prisma } from "@/lib/prisma";

const ensured = {
  inventory: false,
  suppliers: false,
  facilityMaintenance: false,
  corporateWellnessPrograms: false,
  corporateWellnessEnrollments: false,
  recoveryCoachSessions: false,
  purchaseOrdersPass7: false,
};

export async function ensureInventoryTable() {
  if (ensured.inventory) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        business_id TEXT,
        sku TEXT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        unit TEXT,
        quantity_on_hand NUMERIC(12,3) DEFAULT 0,
        reorder_level NUMERIC(12,3),
        reorder_quantity NUMERIC(12,3),
        unit_cost NUMERIC(12,2),
        supplier_id INTEGER,
        location TEXT,
        notes TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    )
    .catch(() => {});
  ensured.inventory = true;
}

export async function ensureSuppliersTable() {
  if (ensured.suppliers) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        business_id TEXT,
        name TEXT NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        category TEXT,
        payment_terms TEXT,
        lead_time_days INTEGER,
        notes TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    )
    .catch(() => {});
  ensured.suppliers = true;
}

export async function ensureFacilityMaintenanceTable() {
  if (ensured.facilityMaintenance) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS facility_maintenance (
        id SERIAL PRIMARY KEY,
        business_id TEXT,
        location_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        priority TEXT DEFAULT 'normal',
        scheduled_date TIMESTAMP,
        completed_at TIMESTAMP,
        recurrence TEXT,
        assignee TEXT,
        vendor TEXT,
        estimated_cost NUMERIC(12,2),
        actual_cost NUMERIC(12,2),
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    )
    .catch(() => {});
  ensured.facilityMaintenance = true;
}

export async function ensureCorporateWellnessProgramsTable() {
  if (ensured.corporateWellnessPrograms) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS corporate_wellness_programs (
        id SERIAL PRIMARY KEY,
        business_id TEXT,
        client_org_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        starts_at TIMESTAMP,
        ends_at TIMESTAMP,
        budget NUMERIC(12,2),
        seat_count INTEGER,
        contact_email TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    )
    .catch(() => {});
  ensured.corporateWellnessPrograms = true;
}

export async function ensureCorporateWellnessEnrollmentsTable() {
  if (ensured.corporateWellnessEnrollments) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS corporate_wellness_enrollments (
        id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL,
        client_org_id TEXT,
        client_id TEXT,
        member_email TEXT,
        member_name TEXT,
        enrolled_at TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'enrolled',
        notes TEXT
      )`
    )
    .catch(() => {});
  ensured.corporateWellnessEnrollments = true;
}

export async function ensureRecoveryCoachSessionsTable() {
  if (ensured.recoveryCoachSessions) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS recovery_coach_sessions (
        id SERIAL PRIMARY KEY,
        client_id TEXT,
        appointment_id TEXT,
        service_name TEXT,
        post_service_context TEXT,
        guidance JSONB,
        disclaimer TEXT,
        requires_human_review BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    )
    .catch(() => {});
  ensured.recoveryCoachSessions = true;
}

export async function ensurePurchaseOrdersPass7Table() {
  if (ensured.purchaseOrdersPass7) return;
  await prisma
    .$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS pass7_purchase_orders (
        id SERIAL PRIMARY KEY,
        business_id TEXT,
        supplier_id INTEGER,
        source TEXT DEFAULT 'predictive-supply',
        status TEXT DEFAULT 'draft',
        items JSONB,
        estimated_total NUMERIC(12,2),
        requires_approval BOOLEAN DEFAULT TRUE,
        disclaimer TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        approved_by TEXT
      )`
    )
    .catch(() => {});
  ensured.purchaseOrdersPass7 = true;
}

export const PASS7_DISCLAIMER =
  "Advisory output only. This recommendation is generated programmatically and must be reviewed by a qualified human operator before any action is taken (e.g. dispatching a supplier order, contacting a client, or modifying inventory).";
