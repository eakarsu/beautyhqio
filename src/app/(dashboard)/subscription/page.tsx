"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CreditCard, DollarSign, Users, Zap, Crown, Building2, Check, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subscription {
  id: string;
  businessName: string;
  businessType: string;
  email: string;
  plan: string;
  status: string;
  monthlyPrice: number;
  commissionRate: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  invoiceCount: number;
}

const PLAN_DETAILS = [
  {
    name: "PRO",
    price: 149,
    commission: 5,
    icon: Crown,
    color: "purple",
    description: "Best for established salons with high volume",
    features: [
      "5% commission on leads",
      "Top placement in search",
      "Verified badge",
      "Dedicated account manager",
      "Custom integrations",
      "Priority support 24/7",
      "Advanced analytics",
    ],
  },
  {
    name: "GROWTH",
    price: 49,
    commission: 12,
    icon: Zap,
    color: "rose",
    description: "Perfect for growing salons",
    features: [
      "12% commission on leads",
      "Featured placement",
      "Analytics dashboard",
      "Priority support",
      "Marketing tools",
    ],
  },
  {
    name: "STARTER",
    price: 0,
    commission: 20,
    icon: Building2,
    color: "gray",
    description: "Get started for free",
    features: [
      "20% commission on leads",
      "Listed on marketplace",
      "Basic profile",
      "Email support",
    ],
  },
];

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSub, setNewSub] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    businessType: "HAIR_SALON",
    plan: "STARTER",
  });

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/all-subscriptions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
        setSelectedSubscription(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete subscription");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSub.businessName || !newSub.email) {
      alert("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/all-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub),
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptions([data.subscription, ...subscriptions]);
        setShowNewDialog(false);
        setNewSub({ businessName: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", businessType: "HAIR_SALON", plan: "STARTER" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create subscription");
      }
    } catch (err) {
      alert("Failed to create subscription");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetch("/api/all-subscriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscriptions) {
          setSubscriptions(data.subscriptions);
        } else {
          setError(data.error || "No subscriptions found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      TRIAL: "bg-blue-100 text-blue-800",
      PAST_DUE: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[status] || "bg-gray-100"}>
        {status}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      PRO: "bg-purple-100 text-purple-800",
      GROWTH: "bg-rose-100 text-rose-800",
      STARTER: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[plan] || "bg-gray-100"}>
        {plan}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">All Subscriptions</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">All Subscriptions</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Stats
  const proCount = subscriptions.filter(s => s.plan === "PRO").length;
  const growthCount = subscriptions.filter(s => s.plan === "GROWTH").length;
  const starterCount = subscriptions.filter(s => s.plan === "STARTER").length;
  const monthlyRevenue = subscriptions.reduce((sum, s) => sum + s.monthlyPrice, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Subscriptions</h1>
          <p className="text-gray-600">All business subscriptions on BeautyHQ</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Subscription
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold">${monthlyRevenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Pro Plans</p>
                <p className="text-2xl font-bold">{proCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-sm text-gray-500">Growth Plans</p>
                <p className="text-2xl font-bold">{growthCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_DETAILS.map((plan) => {
            const Icon = plan.icon;
            const count = subscriptions.filter(s => s.plan === plan.name).length;
            const colorClasses: Record<string, { border: string; bg: string; text: string; icon: string }> = {
              purple: { border: "border-purple-300", bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
              rose: { border: "border-rose-300", bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
              gray: { border: "border-gray-300", bg: "bg-gray-50", text: "text-gray-600", icon: "text-gray-500" },
            };
            const colors = colorClasses[plan.color];

            return (
              <Card key={plan.name} className={`${colors.border} border-2`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={colors.bg + " " + colors.text}>{count} active</Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                    <p className={`text-sm font-medium ${colors.text} mt-1`}>
                      {plan.commission}% commission on leads
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>Click on a row to see details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedSubscription(sub)}
                >
                  <TableCell>
                    <div>
                      <span className="font-medium">{sub.businessName}</span>
                      <p className="text-sm text-gray-500">{sub.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.businessType.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="font-medium">
                    ${sub.monthlyPrice}/mo
                  </TableCell>
                  <TableCell>{sub.commissionRate}%</TableCell>
                  <TableCell>
                    {sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>{sub.invoiceCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subscription Detail Dialog */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.businessName}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business</p>
                  <p className="font-medium">{selectedSubscription.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedSubscription.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium">{selectedSubscription.businessType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <div className="mt-1">{getPlanBadge(selectedSubscription.plan)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Price</p>
                  <p className="font-medium text-lg">${selectedSubscription.monthlyPrice}/mo</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="font-medium text-lg">{selectedSubscription.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoices</p>
                  <p className="font-medium">{selectedSubscription.invoiceCount}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Period Ends</p>
                    <p className="font-medium">
                      {selectedSubscription.currentPeriodEnd
                        ? new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Trial Ends</p>
                    <p className="font-medium">
                      {selectedSubscription.trialEndsAt
                        ? new Date(selectedSubscription.trialEndsAt).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSubscription(selectedSubscription.id)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Subscription"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Subscription Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Subscription</DialogTitle>
            <DialogDescription>
              Add a new business subscription to the marketplace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={newSub.businessName}
                onChange={(e) => setNewSub({ ...newSub, businessName: e.target.value })}
                placeholder="Enter business name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSub.email}
                  onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
                  placeholder="business@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newSub.phone}
                  onChange={(e) => setNewSub({ ...newSub, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newSub.address}
                onChange={(e) => setNewSub({ ...newSub, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newSub.city}
                  onChange={(e) => setNewSub({ ...newSub, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newSub.state}
                  onChange={(e) => setNewSub({ ...newSub, state: e.target.value })}
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={newSub.zipCode}
                  onChange={(e) => setNewSub({ ...newSub, zipCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={newSub.businessType}
                onValueChange={(value) => setNewSub({ ...newSub, businessType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HAIR_SALON">Hair Salon</SelectItem>
                  <SelectItem value="NAIL_SALON">Nail Salon</SelectItem>
                  <SelectItem value="SPA">Spa</SelectItem>
                  <SelectItem value="BARBERSHOP">Barbershop</SelectItem>
                  <SelectItem value="MULTI_SERVICE">Multi-Service</SelectItem>
                  <SelectItem value="LASH_BROW">Lash & Brow</SelectItem>
                  <SelectItem value="MAKEUP">Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select
                value={newSub.plan}
                onValueChange={(value) => setNewSub({ ...newSub, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Starter - Free (20% commission)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GROWTH">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Growth - $49/mo (12% commission)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PRO">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <span>Pro - $149/mo (5% commission)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Plan Summary</p>
              {newSub.plan === "STARTER" && (
                <p className="text-sm text-gray-600">Free monthly fee, 20% commission on leads</p>
              )}
              {newSub.plan === "GROWTH" && (
                <p className="text-sm text-gray-600">$49/month, 12% commission on leads</p>
              )}
              {newSub.plan === "PRO" && (
                <p className="text-sm text-gray-600">$149/month, 5% commission on leads</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubscription} disabled={creating}>
                {creating ? "Creating..." : "Create Subscription"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
