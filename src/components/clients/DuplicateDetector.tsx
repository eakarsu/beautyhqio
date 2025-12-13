"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Merge,
  Eye,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  birthday?: string;
  createdAt: string;
  appointmentsCount?: number;
}

interface DuplicateGroup {
  id: string;
  matchScore: number;
  matchReason: string;
  clients: Client[];
}

interface DuplicateDetectorProps {
  onMerge?: (primaryId: string, duplicateIds: string[]) => void;
}

export function DuplicateDetector({ onMerge }: DuplicateDetectorProps) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [primaryClient, setPrimaryClient] = useState<string | null>(null);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients/duplicates");
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data);
      }
    } catch (error) {
      console.error("Error fetching duplicates:", error);
      // Demo data
      setDuplicates([
        {
          id: "1",
          matchScore: 95,
          matchReason: "Same phone number",
          clients: [
            {
              id: "c1",
              firstName: "John",
              lastName: "Smith",
              email: "john.smith@email.com",
              phone: "(555) 123-4567",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
              appointmentsCount: 12,
            },
            {
              id: "c2",
              firstName: "John",
              lastName: "Smith",
              email: "johnsmith@gmail.com",
              phone: "(555) 123-4567",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
              appointmentsCount: 3,
            },
          ],
        },
        {
          id: "2",
          matchScore: 85,
          matchReason: "Same email address",
          clients: [
            {
              id: "c3",
              firstName: "Sarah",
              lastName: "Johnson",
              email: "sarah.j@email.com",
              phone: "(555) 987-6543",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
              appointmentsCount: 8,
            },
            {
              id: "c4",
              firstName: "Sarah",
              lastName: "Johnson-Miller",
              email: "sarah.j@email.com",
              phone: "(555) 111-2222",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
              appointmentsCount: 2,
            },
          ],
        },
        {
          id: "3",
          matchScore: 75,
          matchReason: "Similar name and birthday",
          clients: [
            {
              id: "c5",
              firstName: "Michael",
              lastName: "Brown",
              email: "mbrown@email.com",
              phone: "(555) 333-4444",
              birthday: "1985-06-15",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
              appointmentsCount: 20,
            },
            {
              id: "c6",
              firstName: "Mike",
              lastName: "Brown",
              phone: "(555) 555-6666",
              birthday: "1985-06-15",
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
              appointmentsCount: 1,
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await fetch("/api/clients/duplicates/scan", { method: "POST" });
      await fetchDuplicates();
    } catch (error) {
      console.error("Error scanning for duplicates:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedGroup || !primaryClient) return;

    const duplicateIds = selectedGroup.clients
      .filter((c) => c.id !== primaryClient)
      .map((c) => c.id);

    try {
      const response = await fetch("/api/clients/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: primaryClient, duplicateIds }),
      });

      if (response.ok) {
        setDuplicates((prev) => prev.filter((d) => d.id !== selectedGroup.id));
        onMerge?.(primaryClient, duplicateIds);
      }
    } catch (error) {
      console.error("Error merging clients:", error);
    } finally {
      setShowMergeConfirm(false);
      setSelectedGroup(null);
      setPrimaryClient(null);
    }
  };

  const handleDismiss = async (groupId: string) => {
    try {
      await fetch(`/api/clients/duplicates/${groupId}/dismiss`, { method: "POST" });
      setDuplicates((prev) => prev.filter((d) => d.id !== groupId));
    } catch (error) {
      console.error("Error dismissing duplicate:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-600";
    if (score >= 75) return "text-orange-600";
    return "text-yellow-600";
  };

  const getScoreBadgeVariant = (score: number): "destructive" | "default" | "secondary" => {
    if (score >= 90) return "destructive";
    if (score >= 75) return "default";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Duplicate Detection
          </CardTitle>
          <CardDescription>
            Find and merge duplicate client records
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={handleScan}
          disabled={isScanning}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
          {isScanning ? "Scanning..." : "Scan Now"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading duplicates...
          </div>
        ) : duplicates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="font-medium text-green-700">No Duplicates Found</p>
            <p className="text-sm mt-1">Your client database is clean!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? "s" : ""}
            </div>

            {duplicates.map((group) => (
              <div
                key={group.id}
                className="border rounded-lg p-4 hover:border-rose-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={getScoreBadgeVariant(group.matchScore)}>
                      {group.matchScore}% Match
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {group.matchReason}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(group.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {group.clients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-muted/50 rounded-lg p-3"
                    >
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {client.appointmentsCount || 0} appointments
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Potential Duplicates</DialogTitle>
              <DialogDescription>
                Select which record to keep as the primary. All data from other records will be merged.
              </DialogDescription>
            </DialogHeader>

            {selectedGroup && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={getScoreBadgeVariant(selectedGroup.matchScore)}>
                    {selectedGroup.matchScore}% Match
                  </Badge>
                  <span className="text-muted-foreground">
                    {selectedGroup.matchReason}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedGroup.clients.map((client) => (
                    <div
                      key={client.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        primaryClient === client.id
                          ? "border-rose-500 bg-rose-50"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => setPrimaryClient(client.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-lg">
                            {client.firstName} {client.lastName}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Phone:</span>{" "}
                              {client.phone}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>{" "}
                              {client.email || "N/A"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>{" "}
                              {format(new Date(client.createdAt), "MMM d, yyyy")}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Appointments:</span>{" "}
                              {client.appointmentsCount || 0}
                            </div>
                            {client.birthday && (
                              <div>
                                <span className="text-muted-foreground">Birthday:</span>{" "}
                                {format(new Date(client.birthday), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        </div>
                        {primaryClient === client.id && (
                          <Badge className="bg-rose-600">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Click on a record to select it as the primary. The other record(s) will be merged into it.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => setShowMergeConfirm(true)}
                disabled={!primaryClient}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Merge className="h-4 w-4 mr-2" />
                Merge Records
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Merge Confirmation */}
        <AlertDialog open={showMergeConfirm} onOpenChange={setShowMergeConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All appointment history, notes, and preferences
                from the duplicate records will be merged into the primary record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMerge}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Confirm Merge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
