"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, DollarSign, TrendingUp, Calendar, Phone, Trash2 } from "lucide-react";

interface Lead {
  id: string;
  status: string;
  source: string;
  client: string | null;
  clientPhone: string | null;
  commission: number | null;
  createdAt: string;
  viewedAt: string | null;
  bookedAt: string | null;
  completedAt: string | null;
}

export default function LeadsReportPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/test-leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads(leads.filter(l => l.id !== id));
        setSelectedLead(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch("/api/test-leads")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        if (data.leads) {
          setLeads(data.leads);
        } else {
          setError(data.error || "No leads found");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-gray-100 text-gray-800",
      VIEWED_PROFILE: "bg-blue-100 text-blue-800",
      STARTED_BOOKING: "bg-yellow-100 text-yellow-800",
      BOOKED: "bg-green-100 text-green-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
      NO_SHOW: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={colors[status] || "bg-gray-100"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      MARKETPLACE_SEARCH: "bg-blue-100 text-blue-800",
      MARKETPLACE_BROWSE: "bg-indigo-100 text-indigo-800",
      GOOGLE_ORGANIC: "bg-green-100 text-green-800",
      FACEBOOK_ADS: "bg-sky-100 text-sky-800",
      REFERRAL_LINK: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[source] || "bg-gray-100"} variant="outline">
        {source.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Leads</h1>
        <p>Loading leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Leads</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Calculate stats
  const completedLeads = leads.filter(l => l.status === "COMPLETED").length;
  const bookedLeads = leads.filter(l => l.status === "BOOKED" || l.status === "COMPLETED").length;
  const totalCommission = leads.reduce((sum, l) => sum + (l.commission || 0), 0);
  const conversionRate = leads.length > 0 ? ((bookedLeads / leads.length) * 100).toFixed(1) : "0";

  // Group by status
  const statusCounts = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by source
  const sourceCounts = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Leads</h1>
        <p className="text-gray-600">Track leads from the BeautyHQ marketplace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Booked</p>
                <p className="text-2xl font-bold">{bookedLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Commission</p>
                <p className="text-2xl font-bold">${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Source Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  {getStatusBadge(status)}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(sourceCounts).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  {getSourceBadge(source)}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads ({leads.length})</CardTitle>
          <CardDescription>Click on a row to see lead details</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No leads found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(lead.source)}
                    </TableCell>
                    <TableCell>{lead.client || "-"}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-right">
                      {lead.commission ? `$${lead.commission.toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              {selectedLead?.client || "Anonymous Lead"}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Status & Source */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedLead.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Source</p>
                  {getSourceBadge(selectedLead.source)}
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{selectedLead.client || "Anonymous"}</span>
                </div>
                {selectedLead.clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{selectedLead.clientPhone}</span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-3">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedLead.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedLead.bookedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Booked</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedLead.bookedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedLead.completedAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedLead.completedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Commission */}
              {selectedLead.commission && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Commission Earned</span>
                    <span className="text-xl font-bold text-green-600">
                      ${selectedLead.commission.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Lead"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
