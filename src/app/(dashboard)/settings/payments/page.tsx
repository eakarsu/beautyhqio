"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, CreditCard, DollarSign, Gift, Percent, CheckCircle } from "lucide-react";

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState({
    acceptCash: true,
    acceptCard: true,
    acceptApplePay: true,
    acceptGooglePay: true,
    acceptGiftCards: true,
    taxRate: 8.25,
    tipSuggestions: [15, 20, 25],
    customTipEnabled: true,
    autoGratuity: false,
    autoGratuityPercent: 18,
    autoGratuityPartySize: 6,
    stripeConnected: true,
    squareConnected: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground">Configure payment methods and processing</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Payment Processors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Processors
            </CardTitle>
            <CardDescription>Connect your payment processing accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Stripe</div>
                  <div className="text-sm text-muted-foreground">
                    Accept credit cards, Apple Pay, Google Pay
                  </div>
                </div>
              </div>
              {settings.stripeConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button variant="outline">Connect</Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Square</div>
                  <div className="text-sm text-muted-foreground">
                    In-person payments and POS integration
                  </div>
                </div>
              </div>
              {settings.squareConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button variant="outline">Connect</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Accepted Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Cash</span>
                </div>
                <Switch
                  checked={settings.acceptCash}
                  onCheckedChange={(v) => setSettings({ ...settings, acceptCash: v })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Credit/Debit Card</span>
                </div>
                <Switch
                  checked={settings.acceptCard}
                  onCheckedChange={(v) => setSettings({ ...settings, acceptCard: v })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-800" />
                  <span>Apple Pay</span>
                </div>
                <Switch
                  checked={settings.acceptApplePay}
                  onCheckedChange={(v) => setSettings({ ...settings, acceptApplePay: v })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span>Google Pay</span>
                </div>
                <Switch
                  checked={settings.acceptGooglePay}
                  onCheckedChange={(v) => setSettings({ ...settings, acceptGooglePay: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-rose-600" />
                <span>Gift Cards</span>
              </div>
              <Switch
                checked={settings.acceptGiftCards}
                onCheckedChange={(v) => setSettings({ ...settings, acceptGiftCards: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Tax Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Applied to taxable services and products
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tip Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tip Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Suggested Tip Percentages</Label>
              <div className="flex gap-2">
                {settings.tipSuggestions.map((tip, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-20"
                      value={tip}
                      onChange={(e) => {
                        const newTips = [...settings.tipSuggestions];
                        newTips[index] = parseInt(e.target.value) || 0;
                        setSettings({ ...settings, tipSuggestions: newTips });
                      }}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Custom Tip Amount</Label>
                <p className="text-sm text-muted-foreground">Allow clients to enter custom tip</p>
              </div>
              <Switch
                checked={settings.customTipEnabled}
                onCheckedChange={(v) => setSettings({ ...settings, customTipEnabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Automatic Gratuity</Label>
                <p className="text-sm text-muted-foreground">
                  Add automatic gratuity for groups
                </p>
              </div>
              <Switch
                checked={settings.autoGratuity}
                onCheckedChange={(v) => setSettings({ ...settings, autoGratuity: v })}
              />
            </div>

            {settings.autoGratuity && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label>Gratuity Percentage</Label>
                  <Input
                    type="number"
                    value={settings.autoGratuityPercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoGratuityPercent: parseInt(e.target.value) || 18,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Party Size</Label>
                  <Input
                    type="number"
                    value={settings.autoGratuityPartySize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoGratuityPartySize: parseInt(e.target.value) || 6,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
