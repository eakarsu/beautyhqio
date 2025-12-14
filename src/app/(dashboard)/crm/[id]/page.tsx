"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  User,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  salonName: string;
  ownerName: string;
  email?: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  source: string;
  status: string;
  priority: string;
  notes?: string;
  lastContactAt?: string;
  nextFollowUp?: string;
  convertedAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  DEMO_SCHEDULED: "bg-purple-100 text-purple-800",
  DEMO_COMPLETED: "bg-indigo-100 text-indigo-800",
  TRIAL: "bg-orange-100 text-orange-800",
  NEGOTIATING: "bg-pink-100 text-pink-800",
  CONVERTED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const sourceLabels: Record<string, string> = {
  GOOGLE_MAPS: "Google Maps",
  YELP: "Yelp",
  REFERRAL: "Referral",
  WALK_IN: "Walk-in",
  TRADE_SHOW: "Trade Show",
  COLD_CALL: "Cold Call",
  WEBSITE: "Website",
  SOCIAL_MEDIA: "Social Media",
  OTHER: "Other",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DEMO_SCHEDULED: "Demo Scheduled",
  DEMO_COMPLETED: "Demo Completed",
  TRIAL: "Trial",
  NEGOTIATING: "Negotiating",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    source: "OTHER",
    status: "NEW",
    priority: "MEDIUM",
    notes: "",
    nextFollowUp: "",
    lostReason: "",
  });

  // Original data to track changes
  const [originalData, setOriginalData] = useState({
    salonName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    source: "OTHER",
    status: "NEW",
    priority: "MEDIUM",
    notes: "",
    nextFollowUp: "",
    lostReason: "",
  });

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        const formValues = {
          salonName: data.salonName || "",
          ownerName: data.ownerName || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          source: data.source || "OTHER",
          status: data.status || "NEW",
          priority: data.priority || "MEDIUM",
          notes: data.notes || "",
          nextFollowUp: data.nextFollowUp
            ? format(new Date(data.nextFollowUp), "yyyy-MM-dd")
            : "",
          lostReason: data.lostReason || "",
        };
        setFormData(formValues);
        setOriginalData(formValues);
      } else {
        router.push("/crm");
      }
    } catch (error) {
      console.error("Error fetching lead:", error);
      router.push("/crm");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lastContactAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        router.push("/crm");
      } else {
        alert("Failed to update lead");
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/crm");
      } else {
        alert("Failed to delete lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const markContacted = async () => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastContactAt: new Date().toISOString(),
          status: formData.status === "NEW" ? "CONTACTED" : formData.status,
        }),
      });

      if (response.ok) {
        fetchLead();
      }
    } catch (error) {
      console.error("Error marking contacted:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/crm")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lead.salonName}</h1>
              <Badge className={statusColors[lead.status]}>
                {statusLabels[lead.status]}
              </Badge>
              <Badge className={priorityColors[lead.priority]}>
                {lead.priority}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Added {formatDistanceToNow(new Date(lead.createdAt))} ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markContacted}>
            <Phone className="h-4 w-4 mr-2" />
            Mark Contacted
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lead Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salon Name</Label>
                <Input
                  value={formData.salonName}
                  onChange={(e) =>
                    setFormData({ ...formData, salonName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
                {formData.website && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(formData.website, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>ZIP</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                placeholder="Add notes about this lead..."
              />
            </div>

            {formData.status === "LOST" && (
              <div className="space-y-2">
                <Label>Lost Reason</Label>
                <Textarea
                  value={formData.lostReason}
                  onChange={(e) =>
                    setFormData({ ...formData, lostReason: e.target.value })
                  }
                  rows={2}
                  placeholder="Why was this lead lost?"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => setFormData({ ...formData, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Next Follow-up</Label>
                <Input
                  type="date"
                  value={formData.nextFollowUp}
                  onChange={(e) =>
                    setFormData({ ...formData, nextFollowUp: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span>{format(new Date(lead.updatedAt), "MMM d, yyyy")}</span>
              </div>
              {lead.lastContactAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Contact:</span>
                  <span>
                    {format(new Date(lead.lastContactAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {lead.convertedAt && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Building2 className="h-4 w-4" />
                  <span>Converted:</span>
                  <span>{format(new Date(lead.convertedAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.phone && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`tel:${formData.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call {formData.phone}
                </Button>
              )}
              {formData.email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${formData.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email {formData.email}
                </Button>
              )}
              {formData.address && formData.city && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${encodeURIComponent(
                        `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`
                      )}`
                    )
                  }
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Lead</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
