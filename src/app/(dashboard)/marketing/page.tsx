"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Send,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

// Keep automations and segments as static for now (can be moved to DB later)
const staticAutomations = [
  {
    id: "1",
    name: "Welcome Series",
    trigger: "New Client Signup",
    status: "ACTIVE",
    sent: 234,
    conversions: 89,
  },
  {
    id: "2",
    name: "Birthday Reward",
    trigger: "Birthday in 7 days",
    status: "ACTIVE",
    sent: 156,
    conversions: 78,
  },
  {
    id: "3",
    name: "Re-booking Reminder",
    trigger: "45 days since visit",
    status: "ACTIVE",
    sent: 567,
    conversions: 123,
  },
  {
    id: "4",
    name: "Review Request",
    trigger: "24 hours after visit",
    status: "ACTIVE",
    sent: 890,
    conversions: 234,
  },
  {
    id: "5",
    name: "Win-back Campaign",
    trigger: "90 days since visit",
    status: "PAUSED",
    sent: 345,
    conversions: 45,
  },
];

const staticSegments = [
  { id: "1", name: "VIP Clients", count: 234, criteria: "Lifetime spend > $1000" },
  { id: "2", name: "New Clients (30 days)", count: 67, criteria: "First visit within 30 days" },
  { id: "3", name: "At-Risk", count: 156, criteria: "No visit in 60+ days" },
  { id: "4", name: "Birthday This Month", count: 45, criteria: "Birthday in current month" },
  { id: "5", name: "Color Clients", count: 189, criteria: "Booked color service" },
];

export default function MarketingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch("/api/marketing/campaigns");
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

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

  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.openCount || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
          <p className="text-slate-500 mt-1">
            Campaigns, automations, and client segments
          </p>
        </div>
        <Button onClick={() => router.push("/marketing/campaigns/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("campaigns")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Messages Sent</p>
                <p className="text-xl font-bold">{totalSent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reports?type=marketing")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Open Rate</p>
                <p className="text-xl font-bold">{avgOpenRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("segments")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Client Segments</p>
                <p className="text-xl font-bold">{staticSegments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("campaigns")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Campaigns</p>
                <p className="text-xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Clock className="h-4 w-4 mr-2" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Users className="h-4 w-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email & SMS Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No campaigns yet. Create your first campaign!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Open Rate</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/marketing/campaigns/${campaign.id}`)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-slate-500">
                              {campaign.sentAt
                                ? `Sent ${formatDate(new Date(campaign.sentAt))}`
                                : campaign.scheduledAt
                                ? `Scheduled ${formatDate(new Date(campaign.scheduledAt))}`
                                : `Created ${formatDate(new Date(campaign.createdAt))}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {campaign.type === "EMAIL" ? (
                              <Mail className="h-3 w-3 mr-1" />
                            ) : (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            )}
                            {campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-right">
                          {(campaign.sentCount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.sentCount > 0
                            ? `${Math.round((campaign.openCount / campaign.sentCount) * 100)}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">{campaign.clickCount || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Marketing Automations</CardTitle>
                <Button size="sm" onClick={() => router.push("/settings/automations/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Automation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automation</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staticAutomations.map((automation) => (
                    <TableRow key={automation.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/settings/automations/${automation.id}`)}>
                      <TableCell className="font-medium">
                        {automation.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {automation.trigger}
                      </TableCell>
                      <TableCell>{getStatusBadge(automation.status)}</TableCell>
                      <TableCell className="text-right">
                        {automation.sent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {automation.conversions}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(
                          (automation.conversions / automation.sent) * 100
                        )}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Client Segments</CardTitle>
                <Button size="sm" onClick={() => router.push("/marketing/segments/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staticSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="p-4 rounded-lg border hover:border-rose-300 cursor-pointer transition-colors"
                    onClick={() => router.push(`/marketing/segments/${segment.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{segment.name}</h3>
                      <Badge variant="secondary">
                        {segment.count} clients
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{segment.criteria}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/marketing/campaigns/new?segment=${segment.id}&type=email`); }}>
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/marketing/campaigns/new?segment=${segment.id}&type=sms`); }}>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        SMS
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
