"use client";

/**
 * Pass 7 — inventory CRUD page (backlog #1).
 *
 * Top-level dashboard page (NOT under features/<slug>/pages/). Talks to
 * `/api/inventory` + `/api/inventory/[id]`. Uses shadcn/ui components already
 * present in the project.
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryItem {
  id: number;
  sku: string | null;
  name: string;
  quantity_on_hand: string | number;
  reorder_level: string | number | null;
  unit_cost: string | number | null;
  location: string | null;
  active: boolean;
}

export default function InventoryPass7Page() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("");
  const [reorder, setReorder] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name) return;
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sku: sku || null,
        quantityOnHand: qty ? Number(qty) : 0,
        reorderLevel: reorder ? Number(reorder) : null,
      }),
    });
    setName("");
    setSku("");
    setQty("");
    setReorder("");
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label>Reorder level</Label>
            <Input
              type="number"
              value={reorder}
              onChange={(e) => setReorder(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} disabled={!name}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reorder</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.sku || "—"}</TableCell>
                    <TableCell>{String(i.quantity_on_hand)}</TableCell>
                    <TableCell>
                      {i.reorder_level == null ? "—" : String(i.reorder_level)}
                    </TableCell>
                    <TableCell>{i.location || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(i.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
