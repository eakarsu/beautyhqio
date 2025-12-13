"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, MessageSquare, Bell, Phone } from "lucide-react";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    // SMS Settings
    smsEnabled: true,
    smsAppointmentReminder: true,
    smsConfirmation: true,
    smsCancellation: true,
    smsMarketing: true,
    smsFromName: "Luxe Beauty",

    // Email Settings
    emailEnabled: true,
    emailAppointmentReminder: true,
    emailConfirmation: true,
    emailReceipt: true,
    emailMarketing: true,
    emailFromName: "Luxe Beauty Studio",
    emailFromAddress: "hello@luxebeauty.com",

    // Templates
    reminderTemplate: "Hi {client_name}, this is a reminder of your appointment tomorrow at {time} with {staff_name}. Reply CONFIRM to confirm.",
    confirmationTemplate: "Your appointment at Luxe Beauty Studio is confirmed for {date} at {time}. See you soon!",
    cancellationTemplate: "Your appointment on {date} has been cancelled. Call us to reschedule.",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/settings/notifications", {
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
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">Configure SMS and email notifications</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="sms">
        <TabsList className="mb-6">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SMS Notifications</CardTitle>
                <CardDescription>Configure text message notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send text messages to clients
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, smsEnabled: v })}
                  />
                </div>

                {settings.smsEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Sender Name</Label>
                      <Input
                        value={settings.smsFromName}
                        onChange={(e) => setSettings({ ...settings, smsFromName: e.target.value })}
                        placeholder="Your business name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown as the sender for SMS messages
                      </p>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <Label>SMS Notification Types</Label>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Appointment Reminders</span>
                        <Switch
                          checked={settings.smsAppointmentReminder}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, smsAppointmentReminder: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Booking Confirmations</span>
                        <Switch
                          checked={settings.smsConfirmation}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, smsConfirmation: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cancellation Notices</span>
                        <Switch
                          checked={settings.smsCancellation}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, smsCancellation: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Marketing Messages</span>
                        <Switch
                          checked={settings.smsMarketing}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, smsMarketing: v })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send emails to clients</p>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, emailEnabled: v })}
                  />
                </div>

                {settings.emailEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Name</Label>
                        <Input
                          value={settings.emailFromName}
                          onChange={(e) =>
                            setSettings({ ...settings, emailFromName: e.target.value })
                          }
                          placeholder="Your business name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input
                          type="email"
                          value={settings.emailFromAddress}
                          onChange={(e) =>
                            setSettings({ ...settings, emailFromAddress: e.target.value })
                          }
                          placeholder="hello@yourbusiness.com"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <Label>Email Notification Types</Label>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Appointment Reminders</span>
                        <Switch
                          checked={settings.emailAppointmentReminder}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, emailAppointmentReminder: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Booking Confirmations</span>
                        <Switch
                          checked={settings.emailConfirmation}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, emailConfirmation: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Receipts</span>
                        <Switch
                          checked={settings.emailReceipt}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, emailReceipt: v })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Marketing Emails</span>
                        <Switch
                          checked={settings.emailMarketing}
                          onCheckedChange={(v) =>
                            setSettings({ ...settings, emailMarketing: v })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>
                  Customize your notification messages. Use {"{variable}"} for dynamic content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Appointment Reminder</Label>
                  <Textarea
                    value={settings.reminderTemplate}
                    onChange={(e) =>
                      setSettings({ ...settings, reminderTemplate: e.target.value })
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {"{client_name}"}, {"{date}"}, {"{time}"}, {"{staff_name}"}, {"{service}"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Booking Confirmation</Label>
                  <Textarea
                    value={settings.confirmationTemplate}
                    onChange={(e) =>
                      setSettings({ ...settings, confirmationTemplate: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cancellation Notice</Label>
                  <Textarea
                    value={settings.cancellationTemplate}
                    onChange={(e) =>
                      setSettings({ ...settings, cancellationTemplate: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
