"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Circle, Plus } from "lucide-react";

interface StaffTask {
  id: string;
  title: string;
  description?: string | null;
  status: "OPEN" | "DONE" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH";
  dueAt?: string | null;
  assignee?: { firstName: string; lastName: string } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || "Tasks could not be loaded");
      setTasks(data.tasks ?? []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tasks could not be loaded");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTask() {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), priority }),
    });
    if (res.ok) { setTitle(""); load(); }
  }

  async function setStatus(task: StaffTask, status: string) {
    await fetch("/api/tasks/" + task.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const open = tasks.filter((t) => t.status === "OPEN");
  const done = tasks.filter((t) => t.status !== "OPEN");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">Follow-ups for the team, including tasks created by automations. Everything here is saved in your database.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New task</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input className="min-w-64 flex-1" placeholder="e.g. Call supplier about shampoo stock" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="rounded-md border px-2 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
          </select>
          <Button onClick={createTask}><Plus className="mr-1 h-4 w-4" />Add task</Button>
        </CardContent>
      </Card>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading tasks...</p> : (
        <>
          <div className="space-y-2">
            <h2 className="font-medium">Open ({open.length})</h2>
            {open.length === 0 && <p className="text-sm text-muted-foreground">No open tasks. You are all caught up.</p>}
            {open.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.assignee ? "Assigned to " + task.assignee.firstName + " " + task.assignee.lastName + " - " : ""}
                    {task.dueAt ? "Due " + new Date(task.dueAt).toLocaleString() : "No due date"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={task.priority === "HIGH" ? "destructive" : "secondary"}>{task.priority}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setStatus(task, "DONE")}><CheckCircle className="mr-1 h-4 w-4" />Done</Button>
                </div>
              </div>
            ))}
          </div>
          {done.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-medium">Closed ({done.length})</h2>
              {done.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 opacity-70">
                  <p className="font-medium line-through">{task.title}</p>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(task, "OPEN")}><Circle className="mr-1 h-4 w-4" />Reopen</Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
