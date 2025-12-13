"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "EMAIL",
    subject: "",
    content: "",
    targetAudience: "ALL",
    scheduledDate: "",
    scheduledTime: "",
    sendNow: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get business ID first
      const businessRes = await fetch("/api/business");
      const businesses = await businessRes.json();
      const businessId = businesses[0]?.id;

      const scheduledAt = formData.sendNow
        ? null
        : formData.scheduledDate && formData.scheduledTime
          ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
          : null;

      const response = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: formData.name,
          type: formData.type,
          subject: formData.subject,
          content: formData.content,
          targetSegment: formData.targetAudience,
          scheduledAt,
        }),
      });

      if (response.ok) {
        router.push("/marketing");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Campaign</h1>
          <p className="text-muted-foreground">Create a new marketing campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.type === "EMAIL" ? (
                <Mail className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Holiday Special - 20% Off"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Clients</SelectItem>
                    <SelectItem value="ACTIVE">Active Clients</SelectItem>
                    <SelectItem value="INACTIVE_30">Inactive 30+ Days</SelectItem>
                    <SelectItem value="INACTIVE_60">Inactive 60+ Days</SelectItem>
                    <SelectItem value="INACTIVE_90">Inactive 90+ Days</SelectItem>
                    <SelectItem value="NEW">New Clients</SelectItem>
                    <SelectItem value="LOYALTY_MEMBERS">Loyalty Members</SelectItem>
                    <SelectItem value="BIRTHDAY_THIS_MONTH">Birthday This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "EMAIL" && (
              <div className="space-y-2">
                <Label>Email Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Your exclusive offer awaits!"
                  required={formData.type === "EMAIL"}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{formData.type === "EMAIL" ? "Email Content" : "SMS Message"} *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={
                  formData.type === "EMAIL"
                    ? "Write your email content here..."
                    : "Keep it short! SMS messages should be under 160 characters."
                }
                rows={formData.type === "EMAIL" ? 8 : 3}
                required
              />
              {formData.type === "SMS" && (
                <p className="text-sm text-muted-foreground">
                  {formData.content.length}/160 characters
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Send Immediately</Label>
                  <p className="text-sm text-muted-foreground">
                    Send the campaign right after creation
                  </p>
                </div>
                <Switch
                  checked={formData.sendNow}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendNow: checked })}
                />
              </div>

              {!formData.sendNow && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheduled Date</Label>
                    <Input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled Time</Label>
                    <Input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={isLoading || !formData.name || !formData.content}
              >
                {isLoading ? "Creating..." : formData.sendNow ? "Create & Send" : "Create Campaign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
