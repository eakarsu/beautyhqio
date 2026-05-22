"use client";

/** Pass 7 — facility maintenance page (backlog #3). */
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  scheduled_date: string | null;
  status: string | null;
  assignee: string | null;
}

export default function FacilityMaintenancePage() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [scheduled, setScheduled] = useState("");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/facility-maintenance");
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
    if (!title) return;
    await fetch("/api/facility-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        scheduledDate: scheduled || null,
        priority,
        description: description || null,
      }),
    });
    setTitle("");
    setScheduled("");
    setPriority("normal");
    setDescription("");
    await load();
  }

  async function complete(id: number) {
    await fetch(`/api/facility-maintenance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "done",
        completedAt: new Date().toISOString(),
      }),
    });
    await load();
  }

  async function remove(id: number) {
    await fetch(`/api/facility-maintenance/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Facility Maintenance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Schedule task</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Scheduled date</Label>
            <Input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Input
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="low / normal / high"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Button onClick={add} disabled={!title}>
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>
                      {t.scheduled_date
                        ? new Date(t.scheduled_date).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.priority || "—"}</Badge>
                    </TableCell>
                    <TableCell>{t.status || "—"}</TableCell>
                    <TableCell className="space-x-2">
                      {t.status !== "done" && (
                        <Button size="sm" onClick={() => complete(t.id)}>
                          Mark done
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => remove(t.id)}
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
