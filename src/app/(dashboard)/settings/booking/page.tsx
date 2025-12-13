"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, Calendar, Clock, Bell, CreditCard } from "lucide-react";

export default function BookingSettingsPage() {
  const [settings, setSettings] = useState({
    allowOnlineBooking: true,
    requireDeposit: false,
    depositAmount: 25,
    depositPercent: 0,
    advanceBookingDays: 30,
    cancellationHours: 24,
    bufferMinutes: 15,
    allowSameDayBooking: true,
    allowWalkIns: true,
    confirmationRequired: true,
    reminderHours: 24,
    secondReminderHours: 2,
    bookingMessage: "",
    cancellationPolicy: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/settings/booking", {
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
          <h1 className="text-2xl font-bold">Booking Settings</h1>
          <p className="text-muted-foreground">Configure online booking and scheduling options</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Online Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Online Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow clients to book appointments online
                </p>
              </div>
              <Switch
                checked={settings.allowOnlineBooking}
                onCheckedChange={(v) => setSettings({ ...settings, allowOnlineBooking: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Same-Day Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow appointments to be booked for today
                </p>
              </div>
              <Switch
                checked={settings.allowSameDayBooking}
                onCheckedChange={(v) => setSettings({ ...settings, allowSameDayBooking: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Walk-ins</Label>
                <p className="text-sm text-muted-foreground">Accept walk-in appointments</p>
              </div>
              <Switch
                checked={settings.allowWalkIns}
                onCheckedChange={(v) => setSettings({ ...settings, allowWalkIns: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Advance Booking (days)</Label>
                <Input
                  type="number"
                  value={settings.advanceBookingDays}
                  onChange={(e) =>
                    setSettings({ ...settings, advanceBookingDays: parseInt(e.target.value) || 30 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  How far in advance clients can book
                </p>
              </div>
              <div className="space-y-2">
                <Label>Buffer Time (minutes)</Label>
                <Input
                  type="number"
                  value={settings.bufferMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, bufferMinutes: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">Time between appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Deposits & Cancellation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Deposit</Label>
                <p className="text-sm text-muted-foreground">
                  Require a deposit for online bookings
                </p>
              </div>
              <Switch
                checked={settings.requireDeposit}
                onCheckedChange={(v) => setSettings({ ...settings, requireDeposit: v })}
              />
            </div>

            {settings.requireDeposit && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label>Fixed Amount ($)</Label>
                  <Input
                    type="number"
                    value={settings.depositAmount}
                    onChange={(e) =>
                      setSettings({ ...settings, depositAmount: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Or Percentage (%)</Label>
                  <Input
                    type="number"
                    value={settings.depositPercent}
                    onChange={(e) =>
                      setSettings({ ...settings, depositPercent: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Cancellation Notice (hours)</Label>
              <Input
                type="number"
                value={settings.cancellationHours}
                onChange={(e) =>
                  setSettings({ ...settings, cancellationHours: parseInt(e.target.value) || 24 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Hours before appointment when cancellation is no longer free
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cancellation Policy</Label>
              <Textarea
                value={settings.cancellationPolicy}
                onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                placeholder="Enter your cancellation policy..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Reminders & Confirmations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmation Required</Label>
                <p className="text-sm text-muted-foreground">
                  Require clients to confirm their appointment
                </p>
              </div>
              <Switch
                checked={settings.confirmationRequired}
                onCheckedChange={(v) => setSettings({ ...settings, confirmationRequired: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Reminder (hours before)</Label>
                <Select
                  value={settings.reminderHours.toString()}
                  onValueChange={(v) => setSettings({ ...settings, reminderHours: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Second Reminder (hours before)</Label>
                <Select
                  value={settings.secondReminderHours.toString()}
                  onValueChange={(v) => setSettings({ ...settings, secondReminderHours: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="0">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Booking Confirmation Message</Label>
              <Textarea
                value={settings.bookingMessage}
                onChange={(e) => setSettings({ ...settings, bookingMessage: e.target.value })}
                placeholder="Thank you for booking! We look forward to seeing you..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
