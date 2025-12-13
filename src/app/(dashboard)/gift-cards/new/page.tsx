"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gift } from "lucide-react";

export default function NewGiftCardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    template: "default",
    sendEmail: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get business ID first
      const businessRes = await fetch("/api/business");
      const businesses = await businessRes.json();
      const businessId = businesses[0]?.id;

      const response = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          amount: parseFloat(formData.amount) || 0,
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          message: formData.message,
        }),
      });

      if (response.ok) {
        router.push("/gift-cards");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create gift card");
      }
    } catch (error) {
      console.error("Error creating gift card:", error);
      alert("Failed to create gift card");
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [25, 50, 75, 100, 150, 200];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Gift Card</h1>
          <p className="text-muted-foreground">Create a new gift card</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Card Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={formData.amount === String(amount) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, amount: String(amount) })}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Custom amount"
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Purchaser Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchaser Name *</Label>
                  <Input
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    placeholder="Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchaser Email</Label>
                  <Input
                    type="email"
                    value={formData.purchaserEmail}
                    onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Recipient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Personal Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={formData.template}
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="thank-you">Thank You</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={isLoading || !formData.amount || !formData.purchaserName}
              >
                {isLoading ? "Creating..." : "Create Gift Card"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
