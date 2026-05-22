"use client";

/** Pass 7 — corporate wellness programs + enrollments (backlog #5). */
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

interface Program {
  id: number;
  client_org_id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  seat_count: number | null;
  status: string;
}

interface Enrollment {
  id: number;
  program_id: number;
  client_org_id: string;
  member_email: string | null;
  member_name: string | null;
  status: string;
}

export default function CorporateWellnessPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [clientOrgId, setClientOrgId] = useState("");
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("");
  const [enrollProgramId, setEnrollProgramId] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberName, setMemberName] = useState("");

  async function loadPrograms() {
    const res = await fetch(
      `/api/corporate-wellness/programs${
        clientOrgId ? `?clientOrgId=${encodeURIComponent(clientOrgId)}` : ""
      }`
    );
    const data = await res.json();
    setPrograms(data.items || []);
  }

  async function loadEnrollments() {
    if (!clientOrgId) {
      setEnrollments([]);
      return;
    }
    const res = await fetch(
      `/api/corporate-wellness/enrollments?clientOrgId=${encodeURIComponent(
        clientOrgId
      )}`
    );
    const data = await res.json();
    setEnrollments(data.items || []);
  }

  useEffect(() => {
    loadPrograms();
    loadEnrollments();
  }, [clientOrgId]);

  async function createProgram() {
    if (!name || !clientOrgId) return;
    await fetch("/api/corporate-wellness/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientOrgId,
        name,
        seatCount: seats ? Number(seats) : null,
      }),
    });
    setName("");
    setSeats("");
    await loadPrograms();
  }

  async function enroll() {
    if (!enrollProgramId || !clientOrgId) return;
    await fetch("/api/corporate-wellness/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: enrollProgramId,
        clientOrgId,
        memberEmail: memberEmail || null,
        memberName: memberName || null,
      }),
    });
    setMemberEmail("");
    setMemberName("");
    await loadEnrollments();
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Corporate Wellness</h1>
        <p className="text-sm text-muted-foreground">
          Multi-tenant scope is enforced by <code>client_org_id</code>. Set a
          tenant tag to load and create programs / enrollments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant scope</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>client_org_id</Label>
            <Input
              value={clientOrgId}
              onChange={(e) => setClientOrgId(e.target.value)}
              placeholder="e.g. acme-corp"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create program</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Seats</Label>
            <Input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={createProgram} disabled={!name || !clientOrgId}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs ({programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.client_org_id}</TableCell>
                  <TableCell>{p.seat_count ?? "—"}</TableCell>
                  <TableCell>{p.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enroll member</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Program ID</Label>
            <Input
              value={enrollProgramId}
              onChange={(e) => setEnrollProgramId(e.target.value)}
            />
          </div>
          <div>
            <Label>Member name</Label>
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>
          <div>
            <Label>Member email</Label>
            <Input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={enroll}
              disabled={!enrollProgramId || !clientOrgId}
            >
              Enroll
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollments ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!clientOrgId ? (
            <p className="text-sm text-muted-foreground">
              Set a tenant scope above to view enrollments.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.id}</TableCell>
                    <TableCell>{e.program_id}</TableCell>
                    <TableCell>{e.member_name || "—"}</TableCell>
                    <TableCell>{e.member_email || "—"}</TableCell>
                    <TableCell>{e.status}</TableCell>
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
