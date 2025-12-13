"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Users,
  Plus,
  Phone,
  X,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WaitlistEntry {
  id: string;
  position: number;
  estimatedWait?: number;
  status: string;
  serviceNotes?: string;
  phone?: string;
  addedAt: string;
  client?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

const statusColors: Record<string, string> = {
  WAITING: "bg-blue-100 text-blue-800",
  NOTIFIED: "bg-amber-100 text-amber-800",
  SEATED: "bg-green-100 text-green-800",
  LEFT: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    clientName: "",
    phone: "",
    serviceNotes: "",
    estimatedDuration: 30,
  });

  useEffect(() => {
    fetchWaitlist();
    const interval = setInterval(fetchWaitlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlist = async () => {
    try {
      const response = await fetch("/api/waitlist");
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewEntry({ clientName: "", phone: "", serviceNotes: "", estimatedDuration: 30 });
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error adding to waitlist:", error);
    }
  };

  const handleSeat = async (id: string) => {
    try {
      const response = await fetch(`/api/waitlist/${id}/seat`, {
        method: "POST",
      });
      if (response.ok) {
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error seating client:", error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error);
    }
  };

  const handleNotify = async (id: string) => {
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NOTIFIED" }),
      });
      if (response.ok) {
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error notifying client:", error);
    }
  };

  const getClientName = (entry: WaitlistEntry) => {
    if (entry.client) {
      return `${entry.client.firstName} ${entry.client.lastName}`;
    }
    return "Walk-in";
  };

  const getPhone = (entry: WaitlistEntry) => {
    return entry.client?.phone || entry.phone || "";
  };

  const waitingCount = entries.filter((e) => e.status === "WAITING").length;
  const avgWait = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + (e.estimatedWait || 0), 0) / entries.length)
    : 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Walk-in Waitlist</h1>
          <p className="text-muted-foreground">Manage walk-in clients waiting for service</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Waitlist</DialogTitle>
              <DialogDescription>Add a new walk-in client to the waitlist</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={newEntry.clientName}
                  onChange={(e) => setNewEntry({ ...newEntry, clientName: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newEntry.phone}
                  onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                  placeholder="For SMS notification"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceNotes">Service Requested</Label>
                <Textarea
                  id="serviceNotes"
                  value={newEntry.serviceNotes}
                  onChange={(e) => setNewEntry({ ...newEntry, serviceNotes: e.target.value })}
                  placeholder="What service are they waiting for?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newEntry.estimatedDuration}
                  onChange={(e) => setNewEntry({ ...newEntry, estimatedDuration: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEntry} className="bg-rose-600 hover:bg-rose-700">
                Add to Waitlist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{waitingCount}</div>
                <div className="text-sm text-muted-foreground">Currently Waiting</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{avgWait} min</div>
                <div className="text-sm text-muted-foreground">Avg Wait Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {entries.filter((e) => e.status === "SEATED").length}
                </div>
                <div className="text-sm text-muted-foreground">Seated Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Waitlist</CardTitle>
          <CardDescription>Clients waiting for service in order of arrival</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading waitlist...</div>
          ) : entries.filter((e) => e.status === "WAITING" || e.status === "NOTIFIED").length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No one is currently waiting</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Walk-in
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries
                .filter((e) => e.status === "WAITING" || e.status === "NOTIFIED")
                .map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getClientName(entry)}</span>
                          <Badge className={statusColors[entry.status]}>{entry.status}</Badge>
                        </div>
                        {entry.serviceNotes && (
                          <div className="text-sm text-muted-foreground">{entry.serviceNotes}</div>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {getPhone(entry) && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {getPhone(entry)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Waiting {formatDistanceToNow(new Date(entry.addedAt))}
                          </span>
                          {entry.estimatedWait && (
                            <span>~{entry.estimatedWait} min wait</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === "WAITING" && getPhone(entry) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotify(entry.id)}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Notify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleSeat(entry.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Seat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(entry.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
