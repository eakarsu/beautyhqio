/**
 * Salon reimbursement + POS register.
 *
 * Replaces the `gap-nonai` placeholders for insurance/HSA reimbursement and
 * hardware POS (cash drawer, barcode). Deterministic domain logic — no model
 * calls, and no invented eligibility: where plan rules are unknown the
 * response says so instead of promising a reimbursement.
 *
 *   GET  /api/salon-ops?type=claims             claim register with totals
 *   POST /api/salon-ops { action: "eligibility" }  covered-service check
 *   POST /api/salon-ops { action: "claim" }        create a reimbursement claim
 *   POST /api/salon-ops { action: "pos-txn" }      till transaction (cash/card/barcode)
 *   POST /api/salon-ops { action: "drawer" }       drawer open/close with variance
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";

const DEFAULT_RULES: Record<string, string[]> = {
  hsa: ["massage", "chiropractic", "acupuncture", "physical therapy", "therapeutic"],
  fsa: ["massage", "chiropractic", "acupuncture", "therapeutic"],
  insurance: ["physical therapy", "occupational therapy", "chiropractic"],
  none: [],
};

const TENDER_TYPES = ["cash", "card", "mobile", "other"];

function matchPlan(plan: string, serviceName: string, serviceCode?: string) {
  const rules = DEFAULT_RULES[plan] ?? [];
  const text = `${serviceName} ${serviceCode ?? ""}`.toLowerCase();
  const matched = rules.filter((t) => text.includes(t.toLowerCase()));
  return { rules, matched };
}

export async function GET(request: Request) {
  try {
    const auth = await requireRoles(["PLATFORM_ADMIN", "OWNER", "STAFF"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "claims";

    if (type === "claims") {
      const claims = await prisma.salonClaim.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      const totals = claims.reduce(
        (a, c) => ({
          count: a.count + 1,
          amount: a.amount + Number(c.amount ?? 0),
          reimbursed: a.reimbursed + Number(c.reimbursedAmount ?? 0),
        }),
        { count: 0, amount: 0, reimbursed: 0 },
      );
      return NextResponse.json({
        claims,
        totals: {
          count: totals.count,
          submittedAmount: Number(totals.amount.toFixed(2)),
          reimbursedAmount: Number(totals.reimbursed.toFixed(2)),
        },
        assumptions: [
          "reimbursedAmount reflects recorded payments only; nothing is forecast.",
          "A claim in draft has not been submitted to any payer.",
        ],
      });
    }

    return NextResponse.json({ error: `unknown type: ${type}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Request failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRoles(["PLATFORM_ADMIN", "OWNER", "STAFF"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "");

    /* --------------------------- eligibility --------------------------- */
    if (action === "eligibility") {
      const { planType, serviceName, serviceCode, planRules } = body;
      if (!serviceName || !String(serviceName).trim()) {
        return NextResponse.json({ error: "serviceName is required" }, { status: 400 });
      }
      const plan = String(planType ?? "none").toLowerCase();

      if (!DEFAULT_RULES[plan] && !Array.isArray(planRules)) {
        return NextResponse.json({
          planType: plan,
          serviceName,
          eligible: null,
          status: "unknown",
          reason:
            "No plan rules are configured for this plan type; supply planRules to check eligibility.",
          matchedTerms: [],
          assumptions: [
            "Eligibility is matched against the supplied plan rules only.",
            "A match does not guarantee reimbursement — the payer decides.",
          ],
        });
      }

      const rules: string[] = Array.isArray(planRules) && planRules.length
        ? planRules.map(String)
        : DEFAULT_RULES[plan];
      const text = `${serviceName} ${serviceCode ?? ""}`.toLowerCase();
      const matched = rules.filter((t) => text.includes(t.toLowerCase()));

      return NextResponse.json({
        planType: plan,
        serviceName,
        serviceCode: serviceCode ?? null,
        eligible: matched.length > 0,
        status: matched.length ? "likely_covered" : "not_covered",
        reason: matched.length
          ? `Matched plan terms: ${matched.join(", ")}.`
          : plan === "none"
            ? "No reimbursement plan supplied."
            : "No plan term matched this service name.",
        matchedTerms: matched,
        assumptions: [
          "Eligibility is matched against the supplied plan rules only.",
          "A match does not guarantee reimbursement — the payer decides.",
          "No plan documents are read; rules are supplied by the operator.",
        ],
      });
    }

    /* ------------------------------ claim ------------------------------ */
    if (action === "claim") {
      const { clientId, appointmentId, planType, serviceCode, serviceName, amount } = body;
      if (!serviceName || !String(serviceName).trim()) {
        return NextResponse.json({ error: "serviceName is required" }, { status: 400 });
      }
      const amt = Number(amount ?? 0);
      if (!Number.isFinite(amt) || amt < 0) {
        return NextResponse.json({ error: "amount must be >= 0" }, { status: 400 });
      }

      const plan = String(planType ?? "none").toLowerCase();
      const { rules, matched } = matchPlan(plan, String(serviceName), serviceCode);

      const claim = await prisma.salonClaim.create({
        data: {
          clientId: clientId ?? null,
          appointmentId: appointmentId ?? null,
          planType: plan,
          serviceCode: serviceCode ?? null,
          serviceName: String(serviceName).trim(),
          amount: amt,
          eligibilityStatus: matched.length
            ? "likely_covered"
            : rules.length
              ? "not_covered"
              : "unknown",
          eligibilityReason: matched.length
            ? `Matched plan terms: ${matched.join(", ")}.`
            : rules.length
              ? "No plan term matched this service name."
              : "No plan rules configured for this plan type.",
          claimStatus: "draft",
        },
      });
      return NextResponse.json({ claim }, { status: 201 });
    }

    /* ---------------------------- pos transaction ---------------------- */
    if (action === "pos-txn") {
      const { registerId, barcode, itemName, qty, unitPrice, tenderType } = body;
      if (!registerId || !String(registerId).trim()) {
        return NextResponse.json({ error: "registerId is required" }, { status: 400 });
      }
      const q = Number(qty ?? 1);
      const unit = Number(unitPrice ?? 0);
      if (!Number.isFinite(q) || q <= 0) {
        return NextResponse.json({ error: "qty must be > 0" }, { status: 400 });
      }
      if (!Number.isFinite(unit) || unit < 0) {
        return NextResponse.json({ error: "unitPrice must be >= 0" }, { status: 400 });
      }
      const tender = TENDER_TYPES.includes(tenderType) ? tenderType : "cash";
      const total = Number((q * unit).toFixed(2));

      const transaction = await prisma.salonPosTransaction.create({
        data: {
          registerId: String(registerId).trim(),
          barcode: barcode ?? null,
          itemName: itemName ? String(itemName).trim() : null,
          qty: q,
          unitPrice: unit,
          total,
          tenderType: tender,
          status: "completed",
        },
      });

      return NextResponse.json(
        {
          transaction,
          totals: { qty: q, unitPrice: unit, total },
          note: "Barcode capture is recorded verbatim; item lookup is the caller's catalogue concern.",
        },
        { status: 201 },
      );
    }

    /* ------------------------------ drawer ----------------------------- */
    if (action === "drawer") {
      const { registerId, eventType, countedAmount, note } = body;
      if (!registerId) return NextResponse.json({ error: "registerId is required" }, { status: 400 });
      if (!["open", "close"].includes(eventType)) {
        return NextResponse.json({ error: "eventType must be open or close" }, { status: 400 });
      }
      const counted = Number(countedAmount ?? 0);
      if (!Number.isFinite(counted)) {
        return NextResponse.json({ error: "countedAmount must be a number" }, { status: 400 });
      }

      // Expected = cash tendered since the previous drawer event on this register.
      const last = await prisma.salonDrawerEvent.findFirst({
        where: { registerId: String(registerId).trim() },
        orderBy: { recordedAt: "desc" },
        select: { recordedAt: true },
      });
      const from = last?.recordedAt ?? new Date(0);

      const cashAgg = await prisma.salonPosTransaction.aggregate({
        where: {
          registerId: String(registerId).trim(),
          tenderType: "cash",
          createdAt: { gt: from },
        },
        _sum: { total: true },
      });

      const expected = Number(cashAgg._sum.total ?? 0);
      const variance = Number((counted - expected).toFixed(2));

      const drawer = await prisma.salonDrawerEvent.create({
        data: {
          registerId: String(registerId).trim(),
          eventType,
          expectedAmount: expected,
          countedAmount: counted,
          variance,
          note: note ?? null,
        },
      });

      return NextResponse.json(
        {
          drawer,
          variance,
          status: variance === 0 ? "balanced" : variance > 0 ? "over" : "short",
          assumptions: [
            "Expected cash is the sum of cash-tendered transactions since the previous drawer event on this register.",
            "Variance is counted minus expected; a non-zero variance is reported, never adjusted silently.",
          ],
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { error: "action must be one of: eligibility, claim, pos-txn, drawer" },
      { status: 400 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Request failed" }, { status: 500 });
  }
}