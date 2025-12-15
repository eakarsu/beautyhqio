"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Transfer {
  id: string;
  amount: number;
  currency: string;
  description: string;
  type: string;
  created: string;
  reversed: boolean;
}

interface StaffPayoutsProps {
  staffId: string;
  stripeAccountId?: string | null;
  stripeAccountStatus?: string | null;
}

export default function StaffPayouts({
  staffId,
  stripeAccountId,
  stripeAccountStatus,
}: StaffPayoutsProps) {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accountStatus, setAccountStatus] = useState(stripeAccountStatus || "not_connected");

  useEffect(() => {
    if (stripeAccountId) {
      fetchAccountStatus();
      fetchBalance();
      fetchTransfers();
    }
  }, [stripeAccountId, staffId]);

  const fetchAccountStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/stripe/connect/status?staffId=${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setAccountStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching account status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/stripe/connect/balance?staffId=${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance({ available: data.available, pending: data.pending });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await fetch(`/api/stripe/connect/transfer?staffId=${staffId}`);
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const handleConnectBank = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error starting onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (accountStatus) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case "restricted":
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Action Required
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Building2 className="h-3 w-3 mr-1" />
            Not Connected
          </Badge>
        );
    }
  };

  // Not connected state
  if (!stripeAccountId || accountStatus === "not_connected") {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Building2 className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Bank Account</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Connect your bank account to receive tips, commissions, and salary payouts directly to your bank.
              Your information is secured by Stripe.
            </p>
            <Button onClick={handleConnectBank} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4 mr-2" />
                  Connect Bank Account
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Powered by Stripe Connect
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending verification state
  if (accountStatus === "pending" || accountStatus === "restricted") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Account
              </CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>
              {accountStatus === "pending"
                ? "Your account is being verified. This usually takes 1-2 business days."
                : "Additional information is required to complete verification."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnectBank} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {accountStatus === "pending" ? "Check Status" : "Complete Verification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active account state
  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Your bank account is connected and ready to receive payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleConnectBank} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Manage Account
          </Button>
        </CardContent>
      </Card>

      {/* Balance */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Available Balance</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(balance.available)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {formatCurrency(balance.pending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payouts</CardTitle>
          <CardDescription>Your recent tips, commissions, and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payouts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{transfer.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transfer.created).toLocaleDateString()} •{" "}
                        <span className="capitalize">{transfer.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +{formatCurrency(transfer.amount)}
                    </p>
                    {transfer.reversed && (
                      <Badge variant="destructive" className="text-xs">
                        Reversed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
