"use client";

/** Pass 7 — suppliers CRUD page (backlog #2). */
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

interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  lead_time_days: number | null;
  active: boolean;
}

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [leadTime, setLeadTime] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
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
    await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contactName: contactName || null,
        email: email || null,
        leadTimeDays: leadTime ? Number(leadTime) : null,
      }),
    });
    setName("");
    setContactName("");
    setEmail("");
    setLeadTime("");
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Suppliers</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add supplier</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Contact</Label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Lead time (days)</Label>
            <Input
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
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
          <CardTitle>Suppliers ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Lead time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.contact_name || "—"}</TableCell>
                    <TableCell>{s.email || "—"}</TableCell>
                    <TableCell>
                      {s.lead_time_days == null ? "—" : `${s.lead_time_days}d`}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(s.id)}
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
