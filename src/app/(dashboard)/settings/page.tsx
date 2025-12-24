"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface CalendarStaff {
  id: string;
  name: string;
  email: string;
  connected: boolean;
  calendarId: string | null;
}

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

  // Google Calendar integration state
  const [calendarStaff, setCalendarStaff] = useState<CalendarStaff[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [connectingStaffId, setConnectingStaffId] = useState<string | null>(null);

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

  // Fetch Google Calendar connection status for all staff
  const fetchCalendarStatus = async () => {
    setCalendarLoading(true);
    try {
      const response = await fetch("/api/calendar/status");
      if (response.ok) {
        const data = await response.json();
        setCalendarStaff(data);
      }
    } catch (error) {
      console.error("Error fetching calendar status:", error);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Connect staff member to Google Calendar
  const handleConnectCalendar = async (staffId: string) => {
    setConnectingStaffId(staffId);
    try {
      const response = await fetch(`/api/calendar/auth?staffId=${staffId}&redirect=/settings?tab=integrations`);
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        alert("Failed to start Google Calendar connection");
      }
    } catch (error) {
      console.error("Error connecting calendar:", error);
      alert("Failed to connect to Google Calendar");
    } finally {
      setConnectingStaffId(null);
    }
  };

  // Disconnect staff member from Google Calendar
  const handleDisconnectCalendar = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to disconnect Google Calendar for ${staffName}? Future appointments will no longer sync.`)) {
      return;
    }

    setConnectingStaffId(staffId);
    try {
      const response = await fetch(`/api/calendar/status?staffId=${staffId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCalendarStaff((prev) =>
          prev.map((staff) =>
            staff.id === staffId ? { ...staff, connected: false, calendarId: null } : staff
          )
        );
      } else {
        alert("Failed to disconnect Google Calendar");
      }
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      alert("Failed to disconnect Google Calendar");
    } finally {
      setConnectingStaffId(null);
    }
  };

  // Load calendar status when switching to integrations tab
  useEffect(() => {
    if (activeTab === "integrations" && calendarStaff.length === 0) {
      fetchCalendarStatus();
    }
  }, [activeTab]);

  // Check for successful Google Calendar connection on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setActiveTab("integrations");
      fetchCalendarStatus();
      // Clean up URL
      window.history.replaceState({}, "", "/settings?tab=integrations");
    }
    if (params.get("tab") === "integrations") {
      setActiveTab("integrations");
    }
  }, []);

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
          <div className="space-y-6">
            {/* Google Calendar Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Google Calendar</CardTitle>
                    <CardDescription>
                      Sync appointments with staff members&apos; Google Calendars
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {calendarLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-slate-500">Loading staff...</span>
                  </div>
                ) : calendarStaff.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No staff members found.</p>
                    <p className="text-sm mt-1">Add staff members to enable calendar sync.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600 mb-4 p-3 bg-blue-50 rounded-lg">
                      <strong>How it works:</strong> Connect each staff member&apos;s Google account to automatically sync their appointments to their personal Google Calendar.
                    </div>
                    {calendarStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            staff.connected ? "bg-green-100" : "bg-slate-100"
                          }`}>
                            {staff.connected ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{staff.name}</p>
                            <p className="text-sm text-slate-500">{staff.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={staff.connected ? "success" : "secondary"}>
                            {staff.connected ? "Connected" : "Not Connected"}
                          </Badge>
                          {staff.connected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnectCalendar(staff.id, staff.name)}
                              disabled={connectingStaffId === staff.id}
                            >
                              {connectingStaffId === staff.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Disconnect"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleConnectCalendar(staff.id)}
                              disabled={connectingStaffId === staff.id}
                            >
                              {connectingStaffId === staff.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Connect
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Other Integrations */}
            <Card>
              <CardHeader>
                <CardTitle>Other Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Stripe", status: "Connected", icon: "S", description: "Payment processing" },
                    { name: "Mailchimp", status: "Not Connected", icon: "M", description: "Email marketing" },
                    { name: "QuickBooks", status: "Not Connected", icon: "Q", description: "Accounting" },
                    { name: "Instagram", status: "Connected", icon: "I", description: "Social media" },
                    { name: "Facebook", status: "Connected", icon: "F", description: "Social media" },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {integration.icon}
                        </div>
                        <div>
                          <span className="font-medium">{integration.name}</span>
                          <p className="text-sm text-slate-500">{integration.description}</p>
                        </div>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
