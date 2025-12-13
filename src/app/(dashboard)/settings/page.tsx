"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Clock,
  CreditCard,
  Bell,
  Users,
  Shield,
  Palette,
  Globe,
} from "lucide-react";

interface SettingsData {
  businessName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  taxRate: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<SettingsData>({
    businessName: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "CA",
    zip: "",
    timezone: "america_los_angeles",
    taxRate: "8.75",
  });

  const [originalData, setOriginalData] = useState<SettingsData>({
    businessName: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "CA",
    zip: "",
    timezone: "america_los_angeles",
    taxRate: "8.75",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if any values have changed from original
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        const settingsData: SettingsData = {
          businessName: data.businessName || "Glamour Studio",
          phone: data.phone || "(555) 123-4567",
          email: data.email || "hello@glamourstudio.com",
          website: "www.glamourstudio.com",
          address: data.address || "123 Beauty Lane, Suite 100",
          city: "Los Angeles",
          state: "CA",
          zip: "90210",
          timezone: "america_los_angeles",
          taxRate: data.taxRate ? (parseFloat(data.taxRate) * 100).toFixed(2) : "8.75",
        };
        setFormData(settingsData);
        setOriginalData(settingsData);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          taxRate: parseFloat(formData.taxRate) / 100,
        }),
      });

      if (response.ok) {
        setOriginalData(formData);
        setHasChanges(false);
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">
            Manage your business preferences
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={hasChanges ? "bg-rose-600 hover:bg-rose-700" : ""}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
          <TabsTrigger value="business">
            <Building2 className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleInputChange("zip", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleInputChange("timezone", value)}
                >
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america_los_angeles">
                      Pacific Time (PT)
                    </SelectItem>
                    <SelectItem value="america_denver">
                      Mountain Time (MT)
                    </SelectItem>
                    <SelectItem value="america_chicago">
                      Central Time (CT)
                    </SelectItem>
                    <SelectItem value="america_new_york">
                      Eastern Time (ET)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Settings */}
        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { day: "Monday", open: "9:00 AM", close: "7:00 PM", isOpen: true },
                  { day: "Tuesday", open: "9:00 AM", close: "7:00 PM", isOpen: true },
                  { day: "Wednesday", open: "9:00 AM", close: "7:00 PM", isOpen: true },
                  { day: "Thursday", open: "9:00 AM", close: "8:00 PM", isOpen: true },
                  { day: "Friday", open: "9:00 AM", close: "8:00 PM", isOpen: true },
                  { day: "Saturday", open: "9:00 AM", close: "6:00 PM", isOpen: true },
                  { day: "Sunday", open: "", close: "", isOpen: false },
                ].map((schedule) => (
                  <div
                    key={schedule.day}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-24 font-medium">{schedule.day}</span>
                      {schedule.isOpen ? (
                        <>
                          <Select defaultValue={schedule.open}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"].map(
                                (time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <span className="text-slate-400">to</span>
                          <Select defaultValue={schedule.close}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "5:00 PM",
                                "6:00 PM",
                                "7:00 PM",
                                "8:00 PM",
                                "9:00 PM",
                              ].map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => alert(`${schedule.day} schedule updated`)}>
                      {schedule.isOpen ? "Set as Closed" : "Set Hours"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Credit/Debit Cards", enabled: true, fee: "2.9% + $0.30" },
                    { name: "Cash", enabled: true, fee: "No fee" },
                    { name: "Apple Pay", enabled: true, fee: "2.9% + $0.30" },
                    { name: "Google Pay", enabled: true, fee: "2.9% + $0.30" },
                    { name: "Gift Cards", enabled: true, fee: "No fee" },
                  ].map((method) => (
                    <div
                      key={method.name}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{method.name}</span>
                        <Badge variant="outline">{method.fee}</Badge>
                      </div>
                      <Badge variant={method.enabled ? "success" : "secondary"}>
                        {method.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange("taxRate", e.target.value)}
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input id="taxId" defaultValue="XX-XXXXXXX" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tip Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Tip Suggestions</Label>
                    <div className="flex gap-2">
                      {["15", "18", "20", "25"].map((tip) => (
                        <div key={tip} className="relative">
                          <Input
                            defaultValue={tip}
                            className="w-20 text-center pr-6"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Client Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Appointment Confirmation", email: true, sms: true },
                      { name: "Appointment Reminder (24hr)", email: true, sms: true },
                      { name: "Appointment Reminder (2hr)", email: false, sms: true },
                      { name: "Review Request", email: true, sms: false },
                      { name: "Birthday Message", email: true, sms: true },
                      { name: "Re-booking Reminder", email: true, sms: false },
                    ].map((notification) => (
                      <div
                        key={notification.name}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <span>{notification.name}</span>
                        <div className="flex gap-4">
                          <Badge
                            variant={notification.email ? "success" : "secondary"}
                            className="cursor-pointer"
                          >
                            Email
                          </Badge>
                          <Badge
                            variant={notification.sms ? "success" : "secondary"}
                            className="cursor-pointer"
                          >
                            SMS
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Staff Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { name: "New Booking", email: true, push: true },
                      { name: "Booking Cancellation", email: true, push: true },
                      { name: "Schedule Changes", email: true, push: true },
                      { name: "New Review", email: true, push: false },
                    ].map((notification) => (
                      <div
                        key={notification.name}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <span>{notification.name}</span>
                        <div className="flex gap-4">
                          <Badge
                            variant={notification.email ? "success" : "secondary"}
                            className="cursor-pointer"
                          >
                            Email
                          </Badge>
                          <Badge
                            variant={notification.push ? "success" : "secondary"}
                            className="cursor-pointer"
                          >
                            Push
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm" onClick={() => alert("Invitation email form opened")}>Invite Member</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Sarah Johnson", email: "sarah@glamourstudio.com", role: "Admin" },
                  { name: "Ashley Williams", email: "ashley@glamourstudio.com", role: "Staff" },
                  { name: "Michelle Tran", email: "michelle@glamourstudio.com", role: "Staff" },
                  { name: "David Chen", email: "david@glamourstudio.com", role: "Staff" },
                  { name: "Emma Davis", email: "emma@glamourstudio.com", role: "Staff" },
                ].map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Select defaultValue={member.role.toLowerCase()}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => alert(`${member.name} removed from team`)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button onClick={() => alert("Password updated successfully")}>Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Protect your account</p>
                    <p className="text-sm text-slate-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => alert("Two-factor authentication setup initiated")}>Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center text-slate-400">
                    Logo
                  </div>
                  <Button variant="outline" onClick={() => alert("File picker opened for logo upload")}>Upload Logo</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-rose-500" />
                  <Input defaultValue="#F43F5E" className="w-32" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Online Booking Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Google Calendar", status: "Connected", icon: "G" },
                  { name: "Stripe", status: "Connected", icon: "S" },
                  { name: "Mailchimp", status: "Not Connected", icon: "M" },
                  { name: "QuickBooks", status: "Not Connected", icon: "Q" },
                  { name: "Instagram", status: "Connected", icon: "I" },
                  { name: "Facebook", status: "Connected", icon: "F" },
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        {integration.icon}
                      </div>
                      <span className="font-medium">{integration.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          integration.status === "Connected"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {integration.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => alert(`${integration.name} ${integration.status === "Connected" ? "configuration" : "connection"} opened`)}>
                        {integration.status === "Connected"
                          ? "Configure"
                          : "Connect"}
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
