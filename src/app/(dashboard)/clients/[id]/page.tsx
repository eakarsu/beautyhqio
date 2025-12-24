"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  Calendar,
  Gift,
  Star,
  MessageSquare,
  Camera,
  FileText,
  Clock,
  DollarSign,
  Heart,
  Edit,
  MoreHorizontal,
  Sparkles,
  Brain,
  Loader2,
  CheckCircle,
  ShoppingBag,
  CreditCard,
  Trash2,
  Plus,
} from "lucide-react";
import { formatPhone, getInitials, formatDate, formatCurrency } from "@/lib/utils";
import StripeCardForm from "@/components/clients/StripeCardForm";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  mobile?: string;
  status: string;
  birthday?: string;
  preferredLanguage?: string;
  preferredContactMethod?: string;
  allowSms: boolean;
  allowEmail: boolean;
  notes?: string;
  internalNotes?: string;
  tags: string[];
  createdAt: string;
  totalVisits: number;
  totalSpent: number;
  avgTicket: number;
  loyaltyAccount?: {
    pointsBalance: number;
    tier: string;
  };
  appointments?: any[];
  activities?: any[];
  transactions?: any[];
  formulas?: any[];
  photos?: any[];
  clientNotes?: any[];
}

const activityIcons: Record<string, React.ElementType> = {
  APPOINTMENT_COMPLETED: Calendar,
  APPOINTMENT_BOOKED: Calendar,
  LOYALTY_EARNED: Gift,
  LOYALTY_REDEEMED: Gift,
  SMS_SENT: MessageSquare,
  EMAIL_SENT: Mail,
  REVIEW_RECEIVED: Star,
  PHOTO_ADDED: Camera,
  NOTE_ADDED: FileText,
};

interface StyleRecommendation {
  recommendations: {
    service: string;
    description: string;
    reason: string;
    confidence: number;
  }[];
  personalizedTips: string[];
  productsToConsider: string[];
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<StyleRecommendation | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
        }
      } catch (error) {
        console.error("Error fetching client:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchClient();
    }
  }, [params.id]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchPaymentMethods();
    }
  }, [params.id]);

  const handleDeleteCard = async (paymentMethodId: string) => {
    setDeletingCardId(paymentMethodId);
    try {
      const response = await fetch(
        `/api/clients/${params.id}/payment-methods?paymentMethodId=${paymentMethodId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setPaymentMethods((prev) => prev.filter((pm) => pm.id !== paymentMethodId));
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    } finally {
      setDeletingCardId(null);
    }
  };

  const fetchAIRecommendations = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/style-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: params.id,
          preferences: client?.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiRecommendations(data.recommendation);
      }
    } catch (error) {
      console.error("Failed to fetch AI recommendations:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Client not found</p>
        <Button onClick={() => router.push("/clients")} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  // Get activities and visits from client data
  const activities = client.activities || [];
  const visits = client.transactions?.filter(t => t.status === "COMPLETED") || [];
  const formulas = client.formulas || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">
              {getInitials(client.firstName, client.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {client.firstName} {client.lastName}
              </h1>
              <Badge variant={client.status === "VIP" ? "default" : "secondary"}>
                {client.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {formatPhone(client.phone)}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {client.email}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/messaging?clientId=${params.id}`)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button onClick={() => router.push(`/appointments/new?clientId=${params.id}`)}>
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Visits</p>
            <p className="text-xl font-bold">{client.totalVisits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Spent</p>
            <p className="text-xl font-bold">{formatCurrency(client.totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Avg Ticket</p>
            <p className="text-xl font-bold">{formatCurrency(client.avgTicket)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Loyalty Points</p>
            <p className="text-xl font-bold">{(client.loyaltyAccount?.pointsBalance || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Member Since</p>
            <p className="text-xl font-bold">{formatDate(client.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Visit History</TabsTrigger>
          <TabsTrigger value="formulas">Formulas</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No activity yet</div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any, idx: number) => {
                      const Icon = activityIcons[activity.type] || Clock;
                      return (
                        <div key={activity.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-rose-600" />
                            </div>
                            {idx < activities.length - 1 && (
                              <div className="w-px h-full bg-slate-200 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-slate-900">{activity.title}</p>
                            <p className="text-sm text-slate-500">{activity.description}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Details</CardTitle>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Birthday</p>
                    <p className="text-sm">{client.birthday ? formatDate(client.birthday) : "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Preferred Contact</p>
                    <p className="text-sm capitalize">{client.preferredContactMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Loyalty Tier</p>
                    <Badge variant="warning">{client.loyaltyAccount?.tier || "Bronze"}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{client.notes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span className="text-sm">Low-ammonia products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span className="text-sm">Sensitive scalp treatment</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Methods
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCardModal(true)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length === 0 ? (
                    <p className="text-sm text-slate-500">No payment methods saved</p>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 bg-gradient-to-r from-slate-700 to-slate-900 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {card.brand?.toUpperCase().slice(0, 4)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">•••• {card.last4}</p>
                              <p className="text-xs text-slate-500">
                                Expires {card.expMonth}/{card.expYear}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCard(card.id)}
                            disabled={deletingCardId === card.id}
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingCardId === card.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {visits.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No visit history yet</div>
                ) : (
                  visits.map((visit: any) => {
                    const serviceNames = visit.lineItems?.filter((i: any) => i.type === "SERVICE").map((i: any) => i.description || i.name) || [];
                    const tipAmount = Number(visit.tipAmount) || 0;
                    return (
                      <div
                        key={visit.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-medium">{serviceNames.length > 0 ? serviceNames.join(", ") : "Transaction"}</p>
                            <p className="text-sm text-slate-500">
                              {formatDate(visit.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(visit.totalAmount))}</p>
                          {tipAmount > 0 && (
                            <p className="text-sm text-slate-500">
                              +{formatCurrency(tipAmount)} tip
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Service Formulas</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Formula
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formulas.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No formulas recorded yet</div>
              ) : (
                <div className="space-y-4">
                  {formulas.map((formula: any) => (
                    <div
                      key={formula.id}
                      className="p-4 rounded-lg border bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{formula.serviceType || formula.type || "Service"}</h4>
                        <span className="text-xs text-slate-500">
                          Last used: {formatDate(formula.lastUsed)}
                        </span>
                      </div>
                      <p className="text-sm font-mono bg-slate-50 p-2 rounded">
                        {formula.formula || formula.content}
                      </p>
                      {formula.notes && (
                        <p className="text-sm text-slate-500 mt-2">{formula.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Photo Gallery</CardTitle>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Placeholder for photos */}
                <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-slate-300" />
                </div>
                <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-slate-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notes & Attachments</CardTitle>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-yellow-700 font-medium">Pinned</span>
                    <span className="text-xs text-slate-500">Dec 1, 2024</span>
                  </div>
                  <p className="text-sm">{client.notes}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Internal Note</span>
                    <span className="text-xs text-slate-500">Nov 15, 2024</span>
                  </div>
                  <p className="text-sm">{client.internalNotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-4">
          {/* Add Card Form - Shown inline for better mobile compatibility */}
          {showAddCardModal && (
            <Card className="border-rose-200 bg-rose-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5 text-rose-500" />
                  Add Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Add a credit or debit card for {client?.firstName}. This card will be securely stored with Stripe.
                </p>
                <StripeCardForm
                  clientId={params.id as string}
                  onSuccess={() => {
                    fetchPaymentMethods();
                    setShowAddCardModal(false);
                  }}
                  onCancel={() => setShowAddCardModal(false)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                  Saved Payment Methods
                </CardTitle>
                {!showAddCardModal && (
                  <Button onClick={() => setShowAddCardModal(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 && !showAddCardModal ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No payment methods saved
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Add a card to enable faster checkout and recurring payments.
                  </p>
                  <Button onClick={() => setShowAddCardModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              ) : paymentMethods.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No cards saved yet. Add one above.
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md flex items-center justify-center">
                          <span className="text-white text-xs font-bold uppercase">
                            {card.brand?.slice(0, 4)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            •••• •••• •••• {card.last4}
                          </p>
                          <p className="text-sm text-slate-500">
                            Expires {card.expMonth}/{card.expYear}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={deletingCardId === card.id}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingCardId === card.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <div className="space-y-6">
            {/* AI Header Card */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Brain className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">AI Style Recommendations</h3>
                    <p className="text-purple-100 mt-1">
                      Personalized service and product suggestions based on {client.firstName}&apos;s history and preferences
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchAIRecommendations}
                  disabled={aiLoading}
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {aiLoading ? "Analyzing..." : "Get AI Recommendations"}
                </Button>
              </div>
            </div>

            {aiRecommendations && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Recommendations */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Recommended Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiRecommendations.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border bg-gradient-to-r from-white to-purple-50 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-900">{rec.service}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {rec.confidence}% match
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                              <div className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-500">{rec.reason}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="ml-4">
                              <Calendar className="h-4 w-4 mr-1" />
                              Book
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tips and Products */}
                <div className="space-y-6">
                  {/* Personalized Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500" />
                        Personalized Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {aiRecommendations.personalizedTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-slate-600">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Product Suggestions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-amber-500" />
                        Products to Consider
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiRecommendations.productsToConsider.map((product, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-slate-700">{product}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {!aiRecommendations && !aiLoading && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 bg-purple-100 rounded-full mb-4">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No recommendations yet
                  </h3>
                  <p className="text-sm text-slate-500 text-center max-w-md">
                    Click &quot;Get AI Recommendations&quot; to analyze {client.firstName}&apos;s visit history and
                    preferences to generate personalized service and product suggestions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
