"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  UserCheck,
  Sparkles,
  Loader2,
  Mail,
  MessageSquare,
  Gift,
  Calendar,
  Shuffle,
  Users,
} from "lucide-react";

const sampleData = [
  {
    inactiveDays: "45",
    segment: "vip",
    campaignType: "return_offer",
  },
  {
    inactiveDays: "90",
    segment: "regular",
    campaignType: "we_miss_you",
  },
  {
    inactiveDays: "30",
    segment: "new",
    campaignType: "followup",
  },
  {
    inactiveDays: "60",
    segment: "lapsed",
    campaignType: "birthday",
  },
];

export default function ReactivationPage() {
  const router = useRouter();
  const [inactiveDays, setInactiveDays] = useState("");
  const [segment, setSegment] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setInactiveDays(sample.inactiveDays);
    setSegment(sample.segment);
    setCampaignType(sample.campaignType);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/reactivation-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inactiveDays: parseInt(inactiveDays) || 30,
          limit: 50,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      // Get campaign based on type or first available
      const emailCampaign = data.campaigns?.find((c: any) => c.type === "email") || data.campaigns?.[0];
      const smsCampaign = data.campaigns?.find((c: any) => c.type === "sms");

      // Map API response to UI expected format
      setResult({
        targetAudience: {
          count: data.summary?.totalInactiveClients || 0,
          description: `Clients inactive for ${inactiveDays}+ days`,
        },
        emailContent: emailCampaign ? {
          subject: emailCampaign.subject,
          body: emailCampaign.message?.replace("{firstName}", "[Client Name]"),
        } : null,
        smsContent: smsCampaign?.message || `We miss you! Come back and enjoy ${emailCampaign?.offer || "a special offer"}. Book now!`,
        offerDetails: emailCampaign ? {
          offer: emailCampaign.name,
          reason: `Target segment: ${emailCampaign.targetSegment || "all"}`,
          discount: emailCampaign.offerValue || emailCampaign.offer,
          validityDays: 14,
        } : null,
        bestTimeToSend: emailCampaign?.bestSendTime || "Tuesday 10:00 AM",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Client Reactivation</h1>
            <p className="text-sm text-slate-500">AI-powered win-back campaigns</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Campaign Settings</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Inactive Days */}
            <div className="space-y-2">
              <Label>Days Since Last Visit</Label>
              <Select value={inactiveDays} onValueChange={setInactiveDays}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30+ days inactive</SelectItem>
                  <SelectItem value="45">45+ days inactive</SelectItem>
                  <SelectItem value="60">60+ days inactive</SelectItem>
                  <SelectItem value="90">90+ days inactive</SelectItem>
                  <SelectItem value="180">180+ days inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Segment */}
            <div className="space-y-2">
              <Label>Client Segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="vip">VIP Clients</SelectItem>
                  <SelectItem value="regular">Regular Clients</SelectItem>
                  <SelectItem value="new">New Clients (1-2 visits)</SelectItem>
                  <SelectItem value="lapsed">Lapsed High-Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Type */}
            <div className="space-y-2">
              <Label>Campaign Type</Label>
              <Select value={campaignType} onValueChange={setCampaignType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="we_miss_you">We Miss You</SelectItem>
                  <SelectItem value="return_offer">Special Return Offer</SelectItem>
                  <SelectItem value="birthday">Birthday Campaign</SelectItem>
                  <SelectItem value="followup">Service Follow-up</SelectItem>
                  <SelectItem value="product_repurchase">Product Repurchase</SelectItem>
                  <SelectItem value="loyalty_reminder">Loyalty Points Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Campaign...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Reactivation Campaign
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Content</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Target Audience */}
                {result.targetAudience && (
                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <Label className="text-indigo-800">Target Audience</Label>
                    </div>
                    <p className="text-sm text-indigo-700">
                      {result.targetAudience.count} clients match criteria
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {result.targetAudience.description}
                    </p>
                  </div>
                )}

                {/* Email Content */}
                {result.emailContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <Label>Email Campaign</Label>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <p className="font-medium text-sm">Subject: {result.emailContent.subject}</p>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">
                        {result.emailContent.body}
                      </p>
                    </div>
                  </div>
                )}

                {/* SMS Content */}
                {result.smsContent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <Label>SMS Message</Label>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-slate-700">{result.smsContent}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {result.smsContent.length} characters
                      </p>
                    </div>
                  </div>
                )}

                {/* Offer Details */}
                {result.offerDetails && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-rose-500" />
                      <Label>Suggested Offer</Label>
                    </div>
                    <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                      <p className="font-medium">{result.offerDetails.offer}</p>
                      <p className="text-sm text-slate-600 mt-1">{result.offerDetails.reason}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-rose-600">{result.offerDetails.discount}</Badge>
                        <Badge variant="outline">
                          Expires: {result.offerDetails.validityDays} days
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Best Time to Send */}
                {result.bestTimeToSend && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        Best Time to Send: {result.bestTimeToSend}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Campaign content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
