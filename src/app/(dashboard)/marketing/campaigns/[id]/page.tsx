"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Send,
  Users,
  MousePointer,
  Eye,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Play,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject?: string;
  content?: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  targetSegment?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/marketing/campaigns/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCampaign(data);
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchCampaign();
    }
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case "ACTIVE":
      case "SENT":
        return <Badge variant="success">{status}</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline">Scheduled</Badge>;
      case "COMPLETED":
        return <Badge variant="secondary">Completed</Badge>;
      case "PAUSED":
        return <Badge variant="destructive">Paused</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaign.id}/send`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedCampaign = await response.json();
        setCampaign(updatedCampaign);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;

    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/api/marketing/campaigns/${campaign.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/marketing");
      } else {
        alert("Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("Failed to delete campaign");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/marketing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500">The campaign you're looking for doesn't exist.</p>
            <Button className="mt-4" onClick={() => router.push("/marketing")}>
              Back to Marketing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openRate = campaign.sentCount > 0
    ? Math.round((campaign.openCount / campaign.sentCount) * 100)
    : 0;
  const clickRate = campaign.sentCount > 0
    ? Math.round((campaign.clickCount / campaign.sentCount) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/marketing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              {getStatusBadge(campaign.status)}
            </div>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              {campaign.type === "EMAIL" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {campaign.type} Campaign
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={() => router.push(`/marketing/campaigns/${campaign.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSendCampaign} disabled={isSending}>
                <Play className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Now"}
              </Button>
            </>
          )}
          <Button variant="destructive" size="icon" onClick={handleDeleteCampaign}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Sent</p>
                <p className="text-xl font-bold">{(campaign.sentCount || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Opened</p>
                <p className="text-xl font-bold">{(campaign.openCount || 0).toLocaleString()} ({openRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Clicked</p>
                <p className="text-xl font-bold">{(campaign.clickCount || 0).toLocaleString()} ({clickRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Target Segment</p>
                <p className="text-xl font-bold">{campaign.targetSegment || "All Clients"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Content</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.type === "EMAIL" && campaign.subject && (
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Subject Line</p>
                <p className="font-medium text-lg">{campaign.subject}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 mb-2">Message</p>
              <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap">
                {campaign.content || "No content"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">{formatDate(new Date(campaign.createdAt))}</p>
              </div>
            </div>

            {campaign.scheduledAt && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Scheduled For</p>
                  <p className="font-medium">{formatDate(new Date(campaign.scheduledAt))}</p>
                </div>
              </div>
            )}

            {campaign.sentAt && (
              <div className="flex items-start gap-3">
                <Send className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Sent At</p>
                  <p className="font-medium">{formatDate(new Date(campaign.sentAt))}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-slate-400 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Last Updated</p>
                <p className="font-medium">{formatDate(new Date(campaign.updatedAt))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
