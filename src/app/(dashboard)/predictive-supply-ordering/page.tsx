"use client";

/** Pass 7 — predictive supply ordering page (backlog #7). */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DraftItem {
  source: string;
  product_id: string | number;
  sku: string | null;
  name: string;
  qty: number;
  unit_cost: number;
  vendor_id: string | null;
  reason: string;
}

interface Envelope {
  success: boolean;
  business_id: string;
  item_count: number;
  estimated_total: number;
  draft_id: number | null;
  requires_approval: boolean;
  disclaimer: string;
  requires_human_review: boolean;
  drafts: { status: string; items: DraftItem[]; estimated_total: number }[];
}

export default function PredictiveSupplyOrderingPage() {
  const [businessId, setBusinessId] = useState("");
  const [persist, setPersist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [env, setEnv] = useState<Envelope | null>(null);

  async function run() {
    if (!businessId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/predictive-supply-ordering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, persist }),
      });
      const data = await res.json();
      setEnv(data);
    } finally {
      setBusy(false);
    }
  }

  const items = env?.drafts?.[0]?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Predictive Supply Ordering</h1>
        <p className="text-sm text-muted-foreground">
          Advisory draft only. Does NOT auto-place purchase orders. Review and
          convert via <code>/api/purchase-orders</code> after human approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate draft</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Business ID</Label>
            <Input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="persist"
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
            />
            <Label htmlFor="persist">Persist draft (advisory)</Label>
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={!businessId || busy}>
              {busy ? "Calculating…" : "Generate draft"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {env && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Draft ({env.item_count} items)</span>
              {env.requires_approval && (
                <Badge variant="destructive">requires approval</Badge>
              )}
              {env.draft_id != null && (
                <Badge variant="secondary">id #{env.draft_id}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {env.disclaimer && (
              <p className="text-sm italic text-muted-foreground">
                {env.disclaimer}
              </p>
            )}
            <p className="text-sm">
              <strong>Estimated total:</strong> $
              {Number(env.estimated_total || 0).toFixed(2)}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit cost</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline">{i.source}</Badge>
                    </TableCell>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.sku || "—"}</TableCell>
                    <TableCell>{i.qty}</TableCell>
                    <TableCell>
                      ${Number(i.unit_cost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {i.reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
