"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Phone, Globe, Clock, MessageSquare, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VoiceReceptionistSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    isEnabled: true,
    businessHoursOnly: true,
    allowVoicemail: true,
    transferToHuman: true,
    autoConfirmBookings: false,
    defaultLanguage: "en",
    greetingStyle: "professional",
    maxCallDuration: "5",
    voiceType: "female",
    businessName: "Serenity Salon and Spa",
    receptionistName: "Sarah",
    customGreeting: "",
    afterHoursMessage: "Thank you for calling. We're currently closed. Our business hours are Monday through Saturday, 9 AM to 7 PM. Please call back during business hours or leave a message.",
    transferNumber: "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai/voice")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Voice Receptionist Settings</h1>
          <p className="text-muted-foreground">Configure how the AI handles incoming calls</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic configuration for the voice receptionist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Voice Receptionist</Label>
                <p className="text-sm text-muted-foreground">Turn the AI receptionist on or off</p>
              </div>
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(v) => setSettings({...settings, isEnabled: v})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Business Hours Only</Label>
                <p className="text-sm text-muted-foreground">Only answer calls during business hours</p>
              </div>
              <Switch
                checked={settings.businessHoursOnly}
                onCheckedChange={(v) => setSettings({...settings, businessHoursOnly: v})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Voicemail</Label>
                <p className="text-sm text-muted-foreground">Let callers leave a voicemail</p>
              </div>
              <Switch
                checked={settings.allowVoicemail}
                onCheckedChange={(v) => setSettings({...settings, allowVoicemail: v})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Transfer to Human Option</Label>
                <p className="text-sm text-muted-foreground">Allow callers to request a human</p>
              </div>
              <Switch
                checked={settings.transferToHuman}
                onCheckedChange={(v) => setSettings({...settings, transferToHuman: v})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Confirm Bookings</Label>
                <p className="text-sm text-muted-foreground">Automatically confirm appointments without staff review</p>
              </div>
              <Switch
                checked={settings.autoConfirmBookings}
                onCheckedChange={(v) => setSettings({...settings, autoConfirmBookings: v})}
              />
            </div>

            {settings.transferToHuman && (
              <div className="space-y-2">
                <Label>Transfer Phone Number</Label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={settings.transferNumber}
                  onChange={(e) => setSettings({...settings, transferNumber: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">Number to transfer calls to when human is requested</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice & Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Voice & Language
            </CardTitle>
            <CardDescription>Configure voice and language preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select
                  value={settings.defaultLanguage}
                  onValueChange={(v) => setSettings({...settings, defaultLanguage: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voice Type</Label>
                <Select
                  value={settings.voiceType}
                  onValueChange={(v) => setSettings({...settings, voiceType: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female (Joanna)</SelectItem>
                    <SelectItem value="female2">Female (Salli)</SelectItem>
                    <SelectItem value="male">Male (Matthew)</SelectItem>
                    <SelectItem value="male2">Male (Joey)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Greeting Style</Label>
                <Select
                  value={settings.greetingStyle}
                  onValueChange={(v) => setSettings({...settings, greetingStyle: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Call Duration</Label>
                <Select
                  value={settings.maxCallDuration}
                  onValueChange={(v) => setSettings({...settings, maxCallDuration: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Personalization
            </CardTitle>
            <CardDescription>Customize the receptionist's identity and messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  placeholder="Your Salon Name"
                  value={settings.businessName}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Receptionist Name</Label>
                <Input
                  placeholder="Sarah"
                  value={settings.receptionistName}
                  onChange={(e) => setSettings({...settings, receptionistName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Greeting (Optional)</Label>
              <Textarea
                placeholder="Leave blank to use default greeting. Example: Thank you for calling [Business Name], this is [Name], how may I help you today?"
                value={settings.customGreeting}
                onChange={(e) => setSettings({...settings, customGreeting: e.target.value})}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">Use [Business Name] and [Name] as placeholders</p>
            </div>

            <div className="space-y-2">
              <Label>After Hours Message</Label>
              <Textarea
                placeholder="Message to play when calling outside business hours"
                value={settings.afterHoursMessage}
                onChange={(e) => setSettings({...settings, afterHoursMessage: e.target.value})}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/ai/voice")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
