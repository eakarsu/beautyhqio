"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
type Row = { id: string; [key: string]: any };
type Data = {
  role: string;
  business: Row;
  locations: Row[];
  staff: Row[];
  clients: Row[];
  products: Row[];
  services: Row[];
  sales: Row[];
  checkouts: Row[];
  refunds: Row[];
};
const usd = (v: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(v),
  );
const inputClass = "block w-full border rounded-md bg-white p-2";
export default function Page() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [location, setLocation] = useState(""),
    [staff, setStaff] = useState(""),
    [client, setClient] = useState(""),
    [appointmentId, setAppointmentId] = useState(""),
    [cart, setCart] = useState<
      {
        id: string;
        type: "SERVICE" | "PRODUCT";
        quantity: number;
        unitPrice?: number;
      }[]
    >([]),
    [pick, setPick] = useState(""),
    [discount, setDiscount] = useState(0),
    [reason, setReason] = useState(""),
    [tip, setTip] = useState(0),
    [tax, setTax] = useState(0),
    [servicesTaxable, setServicesTaxable] = useState(false),
    [taxReviewed, setTaxReviewed] = useState(false),
    [selected, setSelected] = useState("");
  const appointmentLoaded = useRef(false);
  const retry = useRef<{ body: string; key: string } | null>(null);
  async function load() {
    try {
      const r = await fetch("/api/operations/sales"),
        j = await r.json();
      if (!r.ok) throw Error(j.error);
      setData(j);
      setTax(Number(j.business.taxRate) * 100);
      setServicesTaxable(j.business.servicesTaxable);
      setLocation((v) => v || j.locations[0]?.id || "");
      setStaff((v) => v || j.staff[0]?.id || "");
      const linked = new URLSearchParams(window.location.search).get("appointmentId");
      if (linked && !appointmentLoaded.current) {
        const response = await fetch(`/api/appointments/${encodeURIComponent(linked)}`), appointment = await response.json();
        if (!response.ok) throw Error(appointment.error || "Appointment unavailable");
        if (appointment.transaction) { setSelected(appointment.transaction.id); appointmentLoaded.current = true; }
        else {
          if (appointment.status !== "COMPLETED") throw Error("Complete the appointment before creating its sale.");
          if (appointment.services.some((line:Row) => line.addOns?.length)) throw Error("This appointment includes add-ons. A manager must price and review them in a separate sale; automatic import is unavailable.");
          setAppointmentId(appointment.id); setClient(appointment.clientId); setStaff(appointment.staffId); setLocation(appointment.locationId);
          setCart(appointment.services.map((line:Row)=>({id:line.serviceId,type:"SERVICE",quantity:1})));
          setNotice("Appointment services loaded at current catalog prices. Review any agreed price changes before payment.");
          appointmentLoaded.current = true;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load POS");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function act(body: Record<string, unknown>) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    const raw = JSON.stringify(body);
    if (retry.current?.body !== raw)
      retry.current = { body: raw, key: crypto.randomUUID() };
    try {
      const r = await fetch("/api/operations/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": retry.current.key,
          },
          body: raw,
        }),
        j = await r.json();
      if (!r.ok) throw Error(j.error || "Operation failed");
      retry.current = null;
      if (j.url) {
        const u = new URL(j.url);
        if (u.protocol !== "https:" || u.hostname !== "checkout.stripe.com")
          throw Error("Unexpected payment destination");
        window.location.assign(u.href);
      } else {
        if (body.action === "create") {
          setSelected(j.id);
          setCart([]);
          setAppointmentId("");
        }
        setNotice(
          j.changeCents
            ? `Saved. Cash change: ${usd(j.changeCents / 100)}.`
            : "Saved.",
        );
        await load();
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <p role={error ? "alert" : undefined}>{error || "Loading sales…"}</p>
        <Button onClick={load}>Reload</Button>
      </main>
    );
  const manager = ["OWNER", "MANAGER"].includes(data.role),
    catalog: Row[] = [
      ...data.services.map((s) => ({ ...s, type: "SERVICE" })),
      ...data.products.map((p) => ({ ...p, type: "PRODUCT" })),
    ],
    sale = data.sales.find((s) => s.id === selected);
  return (
    <main className="p-6 max-w-7xl space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p>
            Create a sale, review saved prices and tax, then record actual
            payments.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          Refresh receipts
        </Button>
      </div>
      {error && (
        <p role="alert" className="bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="bg-green-50 p-4 text-green-800">
          {notice}
        </p>
      )}
      {manager && (
        <details className="border rounded p-4">
          <summary className="font-semibold cursor-pointer">
            Sales-tax settings{" "}
            {data.business.taxReviewedAt ? "— reviewed" : "— review required"}
          </summary>
          <div className="space-y-3 mt-3">
            <label>
              Tax rate (%)
              <input
                className={inputClass}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
              />
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={servicesTaxable}
                onChange={(e) => setServicesTaxable(e.target.checked)}
              />
              Tax salon services at this rate. Products use their own taxable
              flag.
            </label>
            <p>
              Discounts are allocated proportionally across taxable and
              non-taxable lines before tax. Tips are excluded from this
              calculation. Review applicability for the business before saving.
            </p>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={taxReviewed}
                onChange={(e) => setTaxReviewed(e.target.checked)}
              />
              I reviewed the rate and taxable items.
            </label>
            <Button
              disabled={busy || !taxReviewed}
              onClick={() =>
                act({
                  action: "tax",
                  taxRate: tax / 100,
                  servicesTaxable,
                  reviewConfirmed: true,
                })
              }
            >
              Save reviewed tax settings
            </Button>
          </div>
        </details>
      )}
      <Card>
        <CardHeader>
          <CardTitle>New sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointmentId && <p>Linked appointment: {appointmentId} <button type="button" className="underline" onClick={()=>setAppointmentId("")}>Unlink</button></p>}
          <div className="grid md:grid-cols-3 gap-3">
            <label>
              Location
              <select
                className={inputClass}
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setStaff("");
                }}
              >
                {data.locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Staff
              <select
                className={inputClass}
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
              >
                <option value="">Choose staff</option>
                {data.staff
                  .filter((s) => s.locationId === location)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName ||
                        `${s.user.firstName} ${s.user.lastName}`}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Client
              <select
                className={inputClass}
                value={client}
                onChange={(e) => setClient(e.target.value)}
              >
                <option value="">Walk-in</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <label className="grow">
              Service or product
              <select
                className={inputClass}
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Choose item</option>
                {catalog.map((c) => (
                  <option key={c.type + ":" + c.id} value={c.type + ":" + c.id}>
                    {c.name} · {usd(c.price)}
                    {c.trackInventory ? ` · ${c.quantityOnHand} available` : ""}
                    {c.priceType && c.priceType !== "FIXED"
                      ? " · manager price required"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="self-end"
              disabled={!pick}
              onClick={() => {
                const [type, id] = pick.split(":");
                setCart((v) =>
                  v.some((i) => i.id === id && i.type === type)
                    ? v.map((i) =>
                        i.id === id && i.type === type
                          ? { ...i, quantity: i.quantity + 1 }
                          : i,
                      )
                    : [...v, { id, type: type as "SERVICE", quantity: 1 }],
                );
              }}
            >
              Add
            </Button>
          </div>
          {cart.map((line, index) => {
            const item = catalog.find(
              (c) => c.id === line.id && c.type === line.type,
            );
            return (
              <div
                className="grid md:grid-cols-4 gap-3 items-end border-b pb-3"
                key={line.type + line.id}
              >
                <p>
                  {item?.name} · {usd(item?.price)}
                </p>
                <label>
                  Quantity
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="100"
                    value={line.quantity}
                    onChange={(e) =>
                      setCart(
                        cart.map((l, n) =>
                          n === index
                            ? { ...l, quantity: Number(e.target.value) }
                            : l,
                        ),
                      )
                    }
                  />
                </label>
                {manager && (
                  <label>
                    Override price (optional)
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice ?? ""}
                      onChange={(e) =>
                        setCart(
                          cart.map((l, n) =>
                            n === index
                              ? {
                                  ...l,
                                  unitPrice:
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
                                }
                              : l,
                          ),
                        )
                      }
                    />
                  </label>
                )}
                <Button
                  variant="outline"
                  onClick={() => setCart(cart.filter((_, n) => n !== index))}
                >
                  Remove
                </Button>
              </div>
            );
          })}
          <div className="grid md:grid-cols-3 gap-3">
            {manager && (
              <>
                <label>
                  Discount (USD)
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </label>
                <label>
                  Discount / price override reason
                  <input
                    className={inputClass}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              Tip (USD)
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={tip}
                onChange={(e) => setTip(Number(e.target.value))}
              />
            </label>
          </div>
          <p>
            Saving reserves tracked stock. Void an unpaid draft to release it.
            Prices and tax are calculated on the server; review the saved sale
            before taking payment.
          </p>
          <Button
            disabled={
              busy || !cart.length || !staff || !data.business.taxReviewedAt
            }
            onClick={() =>
              act({
                action: "create",
                locationId: location,
                staffId: staff,
                clientId: client || undefined,
                appointmentId: appointmentId || undefined,
                items: cart,
                discount,
                discountReason: reason,
                tip,
              })
            }
          >
            Save sale for review
          </Button>
        </CardContent>
      </Card>
      <label className="block font-semibold">
        Sales (latest 100)
        <select
          className={inputClass}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose sale</option>
          {data.sales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.transactionNumber} · {s.status} · {usd(s.totalAmount)}
            </option>
          ))}
        </select>
      </label>
      {sale && (
        <SalePanel
          key={sale.id + ":" + sale.version}
          sale={sale}
          manager={manager}
          busy={busy}
          act={act}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Provider reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Returning from checkout does not prove payment. Unknown outcomes are
            held until the provider session or refund receipt is reconciled.
          </p>
          {[
            ...data.checkouts.map((r) => ({ ...r, kind: "checkout" })),
            ...data.refunds
              .filter((r) =>
                ["PENDING", "UNKNOWN", "PROCESSING"].includes(r.status),
              )
              .map((r) => ({ ...r, kind: "refund" })),
          ].map((r) => (
            <ReconcileRow key={r.id} row={r} busy={busy} act={act} />
          ))}
          {!data.checkouts.length && !data.refunds.length && (
            <p>No provider requests yet.</p>
          )}
          <Link
            className="text-rose-700 underline"
            href="/operations/integrations"
          >
            Configure salon Stripe credentials and webhook →
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
function SalePanel({
  sale,
  manager,
  busy,
  act,
}: {
  sale: Row;
  manager: boolean;
  busy: boolean;
  act: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [review, setReview] = useState(false),
    [amount, setAmount] = useState(""),
    [method, setMethod] = useState("CASH"),
    [cash, setCash] = useState(""),
    [code, setCode] = useState(""),
    [received, setReceived] = useState(false),
    [reason, setReason] = useState(""),
    [refundPayment, setRefundPayment] = useState(""),
    [refundAmount, setRefundAmount] = useState(""),
    [cashReturned, setCashReturned] = useState(false);
  const paid = sale.payments
      .filter((p: Row) => p.verifiedAt)
      .reduce(
        (sum: number, p: Row) =>
          sum +
          Number(p.amount) -
          p.refunds
            .filter((r: Row) => r.status === "SUCCEEDED")
            .reduce((n: number, r: Row) => n + Number(r.amount), 0),
        0,
      ),
    balance = Number(sale.totalAmount) - paid;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{sale.transactionNumber}</CardTitle>
        <p>
          {sale.status} · Version {sale.version}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sale.reviewedAt && sale.status !== "PENDING" && (
          <p className="p-3 bg-amber-50">
            Legacy record: payments are not verified by this workflow.
          </p>
        )}
        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.lineItems.map((l: Row) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{l.quantity}</td>
                  <td>{usd(l.unitPrice)}</td>
                  <td>{usd(l.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Subtotal {usd(sale.subtotal)} · Discount {usd(sale.discountAmount)} ·
          Tax {usd(sale.taxAmount)} · Tip {usd(sale.tipAmount)}
        </p>
        <p className="font-semibold">
          Total {usd(sale.totalAmount)} · Verified net receipts {usd(paid)}
          {sale.status === "PENDING" ? ` · Amount due ${usd(balance)}` : ""}
        </p>
        {sale.status === "PENDING" && !sale.reviewedAt && (
          <>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={review}
                onChange={(e) => setReview(e.target.checked)}
              />
              I reviewed the saved items, prices, discount, tax and tip.
            </label>
            <Button
              disabled={busy || !review}
              onClick={() =>
                act({
                  action: "issue",
                  id: sale.id,
                  version: sale.version,
                  reviewConfirmed: true,
                })
              }
            >
              Approve sale for payment
            </Button>
          </>
        )}
        {sale.status === "PENDING" && sale.reviewedAt && (
          <div className="border rounded p-4 space-y-3">
            <h3 className="font-semibold">Record a payment</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <label>
                Amount (USD)
                <input
                  className={inputClass}
                  type="number"
                  min="0.01"
                  max={balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                Method
                <select
                  className={inputClass}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="GIFT_CARD">Gift card</option>
                </select>
              </label>
              {method === "CASH" ? (
                <label>
                  Cash received
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                  />
                </label>
              ) : (
                <label>
                  Gift card code
                  <input
                    className={inputClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
              )}
            </div>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={received}
                onChange={(e) => setReceived(e.target.checked)}
              />
              I confirm this payment has actually been received or the gift card
              is authorized for this sale.
            </label>
            <Button
              disabled={busy || !received || !amount}
              onClick={() =>
                act({
                  action: "payment",
                  id: sale.id,
                  version: sale.version,
                  amount: Number(amount),
                  method,
                  cashReceived: method === "CASH" ? Number(cash) : undefined,
                  giftCardCode: method === "GIFT_CARD" ? code : undefined,
                  receivedConfirmed: true,
                })
              }
            >
              Record payment
            </Button>
            <Button
              className="ml-2"
              variant="outline"
              disabled={busy}
              onClick={() => act({ action: "checkout", id: sale.id })}
            >
              Pay remaining balance with Stripe
            </Button>
          </div>
        )}
        <div className="overflow-auto">
          <h3 className="font-semibold">Payment receipts</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Verification</th>
                <th>Refunds</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.map((p: Row) => (
                <tr key={p.id}>
                  <td>{usd(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>
                    {p.verifiedAt
                      ? "Verified / recorded"
                      : "Legacy; unverified"}
                  </td>
                  <td>
                    {p.refunds
                      .map((r: Row) => `${usd(r.amount)} ${r.status}`)
                      .join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sale.status === "PENDING" && paid === 0 && (
          <>
            <label className="block">
              Void reason
              <input
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button
              disabled={busy || reason.trim().length < 5}
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    "Void this sale and release its reserved stock?",
                  )
                )
                  act({
                    action: "void",
                    id: sale.id,
                    version: sale.version,
                    reason,
                  });
              }}
            >
              Void and release stock
            </Button>
          </>
        )}
        {manager && sale.payments.some((p: Row) => p.verifiedAt) && (
          <details className="border rounded p-4">
            <summary className="cursor-pointer font-semibold">
              Refund a verified payment
            </summary>
            <div className="space-y-3 mt-3">
              <label>
                Payment
                <select
                  className={inputClass}
                  value={refundPayment}
                  onChange={(e) => setRefundPayment(e.target.value)}
                >
                  <option value="">Choose payment</option>
                  {sale.payments
                    .filter((p: Row) => p.verifiedAt)
                    .map((p: Row) => (
                      <option key={p.id} value={p.id}>
                        {p.method} · {usd(p.amount)} · {p.id.slice(-6)}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Refund amount (USD)
                <input
                  type="number"
                  className={inputClass}
                  min="0.01"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </label>
              <label>
                Reason
                <input
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {sale.payments.find((p: Row) => p.id === refundPayment)
                ?.method === "CASH" && (
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={cashReturned}
                    onChange={(e) => setCashReturned(e.target.checked)}
                  />
                  The cash has actually been handed back.
                </label>
              )}
              <p>
                Refunds return to the original payment source. Products are not
                automatically restocked.
              </p>
              <Button
                disabled={
                  busy ||
                  !refundPayment ||
                  !refundAmount ||
                  reason.trim().length < 5
                }
                onClick={() => {
                  if (
                    window.confirm(
                      `Refund ${usd(refundAmount)} to the original payment source?`,
                    )
                  )
                    act({
                      action: "refund",
                      paymentId: refundPayment,
                      amount: Number(refundAmount),
                      reason,
                      cashReturnedConfirmed: cashReturned,
                    });
                }}
              >
                Submit refund
              </Button>
            </div>
          </details>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          Print displayed sale
        </Button>
      </CardContent>
    </Card>
  );
}
function ReconcileRow({
  row,
  busy,
  act,
}: {
  row: Row;
  busy: boolean;
  act: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [ref, setRef] = useState(row.providerRef || "");
  return (
    <div className="border-b pb-3 space-y-2">
      <p>
        {row.kind} · {row.status} ·{" "}
        {row.amountCents ? usd(row.amountCents / 100) : usd(row.amount)}
      </p>
      <p className="text-sm">
        {row.providerRef || row.id} {row.lastError || ""}
      </p>
      {["PENDING", "OPEN", "UNKNOWN", "PROCESSING"].includes(row.status) && (
        <>
          <label>
            Provider {row.kind === "refund" ? "refund" : "checkout session"} ID
            <input
              className={inputClass}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </label>
          <Button
            disabled={busy || !ref}
            variant="outline"
            onClick={() =>
              act({
                action: row.kind + "-reconcile",
                id: row.id,
                providerRef: ref,
              })
            }
          >
            Reconcile receipt
          </Button>
          {row.kind === "checkout" && row.providerRef && (
            <Button
              className="ml-2"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Expire this open checkout?"))
                  act({
                    action: "checkout-expire",
                    id: row.id,
                    providerRef: ref,
                  });
              }}
            >
              Expire checkout
            </Button>
          )}
        </>
      )}
    </div>
  );
}
