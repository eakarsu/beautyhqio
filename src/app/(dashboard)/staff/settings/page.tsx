"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User, Phone, Mail, Save, Briefcase, CreditCard, Building2,
  Check, ExternalLink, Loader2, Trash2, AlertCircle
} from "lucide-react";

interface StaffProfile {
  id: string;
  displayName: string | null;
  title: string | null;
  bio: string | null;
  phone: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface PayoutSettings {
  payoutMethod: string;
  bankAccount: {
    holderName: string;
    bankName: string;
    last4: string;
    accountType: string;
  } | null;
  stripeConnected: boolean;
}

interface StripeConnectStatus {
  connected: boolean;
  status: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export default function MySettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    phone: "",
  });

  // Payout settings state
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings | null>(null);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankAccountHolder: "",
    bankName: "",
    bankRoutingNumber: "",
    bankAccountNumber: "",
    bankAccountType: "checking",
  });

  useEffect(() => {
    fetchMyProfile();
    fetchPayoutSettings();
    fetchStripeStatus();
  }, []);

  // Check for Stripe redirect
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "success") {
      fetchStripeStatus();
    }
  }, [searchParams]);

  const fetchMyProfile = async () => {
    try {
      const response = await fetch("/api/staff/me");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          displayName: data.displayName || `${data.user.firstName} ${data.user.lastName}`,
          bio: data.bio || "",
          phone: data.user.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayoutSettings = async () => {
    try {
      const response = await fetch("/api/staff/me/payout-settings");
      if (response.ok) {
        const data = await response.json();
        setPayoutSettings(data);
      }
    } catch (error) {
      console.error("Error fetching payout settings:", error);
    }
  };

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch("/api/staff/me/stripe-connect");
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/staff/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [stripeError, setStripeError] = useState<string | null>(null);

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    setStripeError(null);
    try {
      const response = await fetch("/api/staff/me/stripe-connect", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        window.location.href = data.url;
      } else if (data.connectRequired) {
        setStripeError(data.message);
      } else {
        setStripeError("Failed to connect. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      setStripeError("Failed to connect. Please try again.");
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe account?")) return;
    try {
      const response = await fetch("/api/staff/me/stripe-connect", {
        method: "DELETE",
      });
      if (response.ok) {
        setStripeStatus({ connected: false, status: "not_connected" });
        fetchPayoutSettings();
      }
    } catch (error) {
      console.error("Error disconnecting Stripe:", error);
    }
  };

  const handleSaveBankDetails = async () => {
    setIsSavingBank(true);
    try {
      const response = await fetch("/api/staff/me/payout-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bankFormData,
          payoutMethod: "bank_transfer",
        }),
      });
      if (response.ok) {
        fetchPayoutSettings();
        setShowBankForm(false);
        setBankFormData({
          bankAccountHolder: "",
          bankName: "",
          bankRoutingNumber: "",
          bankAccountNumber: "",
          bankAccountType: "checking",
        });
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleRemoveBankAccount = async () => {
    if (!confirm("Are you sure you want to remove your bank account?")) return;
    try {
      const response = await fetch("/api/staff/me/payout-settings", {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPayoutSettings();
      }
    } catch (error) {
      console.error("Error removing bank account:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Profile not found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact your manager
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Settings</h1>
        <p className="text-muted-foreground">Manage your profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your display name and bio visible to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Read-only info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{profile.user.firstName} {profile.user.lastName}</p>
              </div>
            </div>
            {profile.title && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{profile.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* Editable fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Name shown to clients"
              />
              <p className="text-xs text-muted-foreground">
                This is the name clients will see when booking
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Your contact number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell clients about yourself and your specialties..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This will be shown on your profile when clients book with you
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-rose-600 hover:bg-rose-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Settings
          </CardTitle>
          <CardDescription>
            Choose how you want to receive your earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stripe Connect Option */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Stripe Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive automatic payouts directly to your bank account
                  </p>
                  {stripeStatus?.connected && stripeStatus.payoutsEnabled && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Connected and ready for payouts
                    </div>
                  )}
                  {stripeStatus?.connected && !stripeStatus.payoutsEnabled && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      Account pending verification
                    </div>
                  )}
                  {stripeError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{stripeError}</p>
                          <p className="mt-1 text-xs">Use the <strong>Bank Account</strong> option below instead.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                {stripeStatus?.connected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectStripe}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectStripe}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isConnectingStripe ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect with Stripe
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account Option */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Bank Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your bank details for manual payouts
                  </p>
                  {payoutSettings?.bankAccount && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {payoutSettings.bankAccount.bankName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payoutSettings.bankAccount.accountType} •••• {payoutSettings.bankAccount.last4}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payoutSettings.bankAccount.holderName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveBankAccount}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!payoutSettings?.bankAccount && !showBankForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowBankForm(true)}
                >
                  Add Bank Account
                </Button>
              )}
            </div>

            {/* Bank Account Form */}
            {showBankForm && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={bankFormData.bankAccountHolder}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankAccountHolder: e.target.value })}
                      placeholder="Full name on account"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={bankFormData.bankName}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                      placeholder="e.g., Chase, Bank of America"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Routing Number</Label>
                    <Input
                      value={bankFormData.bankRoutingNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankRoutingNumber: e.target.value })}
                      placeholder="9 digits"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={bankFormData.bankAccountNumber}
                      onChange={(e) => setBankFormData({ ...bankFormData, bankAccountNumber: e.target.value })}
                      placeholder="Account number"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accountType"
                          value="checking"
                          checked={bankFormData.bankAccountType === "checking"}
                          onChange={(e) => setBankFormData({ ...bankFormData, bankAccountType: e.target.value })}
                          className="text-rose-600"
                        />
                        Checking
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="accountType"
                          value="savings"
                          checked={bankFormData.bankAccountType === "savings"}
                          onChange={(e) => setBankFormData({ ...bankFormData, bankAccountType: e.target.value })}
                          className="text-rose-600"
                        />
                        Savings
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBankDetails}
                    disabled={isSavingBank || !bankFormData.bankAccountHolder || !bankFormData.bankRoutingNumber || !bankFormData.bankAccountNumber}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    {isSavingBank ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Bank Account
                  </Button>
                  <Button variant="ghost" onClick={() => setShowBankForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Current Payout Method */}
          {(stripeStatus?.connected || payoutSettings?.bankAccount) && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">
                  Current payout method:{" "}
                  {payoutSettings?.payoutMethod === "stripe_connect"
                    ? "Stripe Connect (automatic)"
                    : payoutSettings?.payoutMethod === "bank_transfer"
                    ? "Bank Transfer (manual)"
                    : "Manual"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
