"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Brain,
  Sparkles,
  MessageSquare,
  Star,
  Languages,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Copy,
  ChevronRight,
  Lightbulb,
  Wand2,
  Bot,
  Calendar,
  User,
  BarChart3,
  Mic,
  AlertCircle,
  Palette,
  ArrowRight,
  Share2,
  ShoppingBag,
  Package,
  UserCheck,
  DollarSign,
  MessageCircle,
} from "lucide-react";

interface AIResponse {
  loading: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

type MessageType =
  | "appointment_reminder"
  | "follow_up"
  | "promotion"
  | "birthday"
  | "thank_you"
  | "reactivation";

const aiFeatures = [
  {
    id: "chat",
    title: "AI Chat Assistant",
    description: "Ask anything about your salon - scheduling, analytics, marketing strategies",
    icon: Bot,
    color: "from-rose-500 to-purple-600",
    href: "/ai/chat",
    badge: "New",
  },
  {
    id: "scheduling",
    title: "Smart Scheduling",
    description: "AI-powered appointment optimization and staff matching",
    icon: Calendar,
    color: "from-blue-500 to-cyan-600",
    href: "/ai/scheduling",
    badge: "New",
  },
  {
    id: "client-insights",
    title: "Client Insights",
    description: "Deep analysis of client behavior, preferences, and retention strategies",
    icon: User,
    color: "from-purple-500 to-pink-600",
    href: "/ai/client-insights",
    badge: "New",
  },
  {
    id: "revenue",
    title: "Revenue Predictor",
    description: "AI-powered revenue forecasting and growth opportunities",
    icon: BarChart3,
    color: "from-green-500 to-emerald-600",
    href: "/ai/revenue",
    badge: "New",
  },
  {
    id: "no-show",
    title: "No-Show Prediction",
    description: "Predict appointment no-shows and get prevention recommendations",
    icon: AlertCircle,
    color: "from-amber-500 to-orange-600",
    href: "/ai/no-show",
  },
  {
    id: "style",
    title: "Style Recommendations",
    description: "AI-powered personalized style and service recommendations",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    href: "/ai/style",
  },
  {
    id: "voice",
    title: "Voice Receptionist",
    description: "AI-powered voice assistant for handling calls",
    icon: Mic,
    color: "from-indigo-500 to-purple-600",
    href: "/ai/voice",
  },
  {
    id: "social-media",
    title: "Social Media Content",
    description: "Generate engaging posts for Instagram, Facebook & more",
    icon: Share2,
    color: "from-pink-500 to-fuchsia-600",
    href: "/ai/social-media",
    badge: "New",
  },
  {
    id: "upsell",
    title: "Upsell Suggestions",
    description: "AI-powered personalized upsell and cross-sell recommendations",
    icon: ShoppingBag,
    color: "from-violet-500 to-purple-600",
    href: "/ai/upsell",
    badge: "New",
  },
  {
    id: "inventory",
    title: "Inventory Forecast",
    description: "Predict product demand and optimize stock levels",
    icon: Package,
    color: "from-orange-500 to-amber-600",
    href: "/ai/inventory",
    badge: "New",
  },
  {
    id: "reactivation",
    title: "Client Reactivation",
    description: "Generate win-back campaigns for inactive clients",
    icon: UserCheck,
    color: "from-indigo-500 to-blue-600",
    href: "/ai/reactivation",
    badge: "New",
  },
  {
    id: "pricing",
    title: "Price Optimizer",
    description: "AI-powered pricing recommendations for services",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-600",
    href: "/ai/pricing",
    badge: "New",
  },
  {
    id: "sentiment",
    title: "Sentiment Analysis",
    description: "Analyze customer reviews and feedback sentiment",
    icon: MessageCircle,
    color: "from-violet-500 to-purple-600",
    href: "/ai/sentiment",
    badge: "New",
  },
  {
    id: "waitlist",
    title: "Smart Waitlist",
    description: "AI-powered queue management and wait time optimization",
    icon: Clock,
    color: "from-cyan-500 to-blue-600",
    href: "/ai/waitlist",
    badge: "New",
  },
];

export default function AIDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("features");
  const [responses, setResponses] = useState<Record<string, AIResponse>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Form states
  const [messageType, setMessageType] = useState<MessageType>("appointment_reminder");
  const [clientName, setClientName] = useState("");

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients?limit=100");
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
          // Pre-select first client if available
          if (data.clients && data.clients.length > 0) {
            const firstClient = data.clients[0];
            setSelectedClientId(firstClient.id);
            setClientName(`${firstClient.firstName} ${firstClient.lastName}`);
            // Also prepopulate review client
            setSelectedReviewClientId(firstClient.id);
            setReviewClientName(`${firstClient.firstName} ${firstClient.lastName}`);
          }
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);
  const [messageTone, setMessageTone] = useState("friendly");
  const [messageLanguage, setMessageLanguage] = useState("English");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewClientName, setReviewClientName] = useState("");
  const [selectedReviewClientId, setSelectedReviewClientId] = useState<string>("");

  const [translateText, setTranslateText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");

  const fetchAI = async (endpoint: string, key: string, body?: Record<string, unknown>) => {
    setResponses((prev) => ({
      ...prev,
      [key]: { loading: true, data: null, error: null },
    }));

    try {
      const options: RequestInit = body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { method: "GET" };

      const res = await fetch(`/api/ai/${endpoint}`, options);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "AI request failed");

      setResponses((prev) => ({
        ...prev,
        [key]: { loading: false, data, error: null },
      }));
    } catch (error) {
      setResponses((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">AI-Powered Features</h2>
        <p className="text-slate-500">Choose an AI assistant to help with your salon operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiFeatures.map((feature) => (
          <Card
            key={feature.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group"
            onClick={() => router.push(feature.href)}
          >
            <CardContent className="p-0">
              <div className={`h-2 bg-gradient-to-r ${feature.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  {feature.badge && (
                    <Badge className="bg-rose-500 text-white">{feature.badge}</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 mb-4">{feature.description}</p>
                <div className="flex items-center text-rose-500 text-sm font-medium">
                  <span>Open</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderInsights = () => {
    const response = responses.insights;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Business Insights</h2>
            <p className="text-slate-500 mt-1">AI-powered analysis of your business performance</p>
          </div>
          <Button
            onClick={() => fetchAI("business-insights", "insights")}
            disabled={response?.loading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {response?.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Insights
          </Button>
        </div>

        {response?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {response.error}
          </div>
        )}

        {response?.data && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                    <p className="text-purple-100 leading-relaxed">
                      {(response.data as { insights?: { summary?: string } })?.insights?.summary ||
                        "No summary available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Current Revenue",
                  value: `$${((response.data as { metrics?: { revenue?: { current?: number } } })?.metrics?.revenue?.current || 0).toLocaleString()}`,
                  change:
                    ((response.data as { metrics?: { revenue?: { current?: number; previous?: number } } })?.metrics?.revenue?.current || 0) -
                    ((response.data as { metrics?: { revenue?: { previous?: number } } })?.metrics?.revenue?.previous || 0),
                },
                {
                  label: "Appointments",
                  value: (response.data as { metrics?: { appointments?: { current?: number } } })?.metrics?.appointments?.current || 0,
                  change:
                    ((response.data as { metrics?: { appointments?: { current?: number; previous?: number } } })?.metrics?.appointments?.current || 0) -
                    ((response.data as { metrics?: { appointments?: { previous?: number } } })?.metrics?.appointments?.previous || 0),
                },
                {
                  label: "Client Retention",
                  value: `${(response.data as { metrics?: { clientRetention?: number } })?.metrics?.clientRetention || 0}%`,
                },
                {
                  label: "Avg. Ticket",
                  value: `$${((response.data as { metrics?: { averageTicket?: number } })?.metrics?.averageTicket || 0).toFixed(2)}`,
                },
              ].map((metric, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500">{metric.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                    {metric.change !== undefined && (
                      <p className={`text-sm mt-1 ${metric.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {metric.change >= 0 ? "+" : ""}
                        {typeof metric.change === "number" && metric.label.includes("Revenue")
                          ? `$${metric.change.toLocaleString()}`
                          : metric.change}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Insights List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {((response.data as { insights?: { insights?: Array<{ category: string; finding: string; impact: string; action: string }> } })?.insights?.insights || []).map(
                  (insight: { category: string; finding: string; impact: string; action: string }, i: number) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            insight.impact === "positive"
                              ? "bg-green-100 text-green-600"
                              : insight.impact === "negative"
                                ? "bg-red-100 text-red-600"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {insight.impact === "positive" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : insight.impact === "negative" ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">{insight.category}</Badge>
                          <p className="text-slate-900 font-medium">{insight.finding}</p>
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {insight.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-amber-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {((response.data as { insights?: { recommendations?: string[] } })?.insights?.recommendations || []).map(
                    (rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-sm font-medium flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderMessages = () => {
    const response = responses.messages;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Message Generator</h2>
          <p className="text-slate-500 mt-1">Generate professional messages for your clients</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Message Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Message Type</Label>
                  <Select value={messageType} onValueChange={(v) => setMessageType(v as MessageType)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="thank_you">Thank You</SelectItem>
                      <SelectItem value="reactivation">Re-activation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={messageTone} onValueChange={setMessageTone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name</Label>
                  {clients.length > 0 ? (
                    <Select
                      value={selectedClientId}
                      onValueChange={(id) => {
                        setSelectedClientId(id);
                        const client = clients.find(c => c.id === id);
                        if (client) {
                          setClientName(`${client.firstName} ${client.lastName}`);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name"
                      className="mt-1"
                    />
                  )}
                </div>

                <div>
                  <Label>Language</Label>
                  <Select value={messageLanguage} onValueChange={setMessageLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() =>
                  fetchAI("message-generator", "messages", {
                    type: messageType,
                    clientName: clientName || "Valued Customer",
                    tone: messageTone,
                    language: messageLanguage,
                    businessName: "Beauty & Wellness Salon",
                  })
                }
                disabled={response?.loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {response?.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Message
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <div className="space-y-4">
            {response?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {response.error}
              </div>
            )}

            {response?.data && (
              <div className="space-y-4">
                {/* Email Version */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Email Version</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `Subject: ${(response.data as { message?: { subject?: string } })?.message?.subject}\n\n${(response.data as { message?: { message?: string } })?.message?.message}`
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500 mb-1">Subject:</p>
                    <p className="font-medium text-slate-900 mb-4">
                      {(response.data as { message?: { subject?: string } })?.message?.subject}
                    </p>
                    <p className="text-sm text-slate-500 mb-1">Body:</p>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {(response.data as { message?: { message?: string } })?.message?.message}
                    </p>
                  </CardContent>
                </Card>

                {/* SMS Version */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">SMS Version</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard((response.data as { message?: { smsVersion?: string } })?.message?.smsVersion || "")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">
                      {(response.data as { message?: { smsVersion?: string } })?.message?.smsVersion}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {((response.data as { message?: { smsVersion?: string } })?.message?.smsVersion || "").length}/160 characters
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    const response = responses.reviews;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Review Response</h2>
          <p className="text-slate-500 mt-1">Generate professional responses to customer reviews</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Review Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                {clients.length > 0 ? (
                  <Select
                    value={selectedReviewClientId}
                    onValueChange={(id) => {
                      setSelectedReviewClientId(id);
                      const client = clients.find(c => c.id === id);
                      if (client) {
                        setReviewClientName(`${client.firstName} ${client.lastName}`);
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={reviewClientName}
                    onChange={(e) => setReviewClientName(e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition-colors ${
                        star <= reviewRating ? "text-amber-400" : "text-slate-300"
                      }`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-slate-600">{reviewRating}/5</span>
                </div>
              </div>

              <div>
                <Label>Review Text</Label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste the customer review here..."
                  rows={5}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              <Button
                onClick={() =>
                  fetchAI("review-response", "reviews", {
                    rating: reviewRating,
                    reviewText: reviewText || "Great service!",
                    clientName: reviewClientName || "Customer",
                    businessName: "Beauty & Wellness Salon",
                  })
                }
                disabled={response?.loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {response?.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Response
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <div className="space-y-4">
            {response?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {response.error}
              </div>
            )}

            {response?.data && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Generated Response</CardTitle>
                      <Badge
                        className={
                          (response.data as { response?: { tone?: string } })?.response?.tone === "grateful"
                            ? "bg-green-100 text-green-700"
                            : (response.data as { response?: { tone?: string } })?.response?.tone === "apologetic"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }
                      >
                        {(response.data as { response?: { tone?: string } })?.response?.tone}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard((response.data as { response?: { response?: string } })?.response?.response || "")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {(response.data as { response?: { response?: string } })?.response?.response}
                    </p>
                  </CardContent>
                </Card>

                {((response.data as { response?: { keyPoints?: string[] } })?.response?.keyPoints || []).length > 0 && (
                  <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="pt-4">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Key Points Addressed</h4>
                      <ul className="space-y-1">
                        {((response.data as { response?: { keyPoints?: string[] } })?.response?.keyPoints || []).map(
                          (point: string, i: number) => (
                            <li key={i} className="text-sm text-purple-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {point}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTranslate = () => {
    const response = responses.translate;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Translation</h2>
          <p className="text-slate-500 mt-1">Translate text for your multilingual clients</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="Korean">Korean</SelectItem>
                    <SelectItem value="Chinese (Simplified)">Chinese (Simplified)</SelectItem>
                    <SelectItem value="Chinese (Traditional)">Chinese (Traditional)</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="Russian">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Text to Translate</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const sampleTexts = [
                        "Hello! Thank you for booking your appointment with us. We look forward to seeing you on your scheduled date. Please arrive 10 minutes early to ensure we can start on time.",
                        "Welcome to our salon! We offer a wide range of beauty services including haircuts, coloring, manicures, pedicures, facials, and spa treatments. Our experienced team is here to help you look and feel your best.",
                        "Your appointment has been confirmed for tomorrow at 2:00 PM. If you need to reschedule, please call us at least 24 hours in advance. See you soon!",
                        "We hope you enjoyed your visit today! As a valued client, we'd like to offer you 15% off your next service. Use code THANKYOU15 when booking online.",
                        "Our salon will be closed for the holidays from December 24th to January 1st. We wish you a happy holiday season and look forward to serving you in the new year!",
                      ];
                      const randomSample = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
                      setTranslateText(randomSample);
                    }}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    Load Sample
                  </Button>
                </div>
                <textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="Enter text to translate..."
                  rows={6}
                  className="mt-1 w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              <Button
                onClick={() =>
                  fetchAI("translate", "translate", {
                    text: translateText,
                    targetLanguage,
                  })
                }
                disabled={response?.loading || !translateText}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {response?.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4 mr-2" />
                )}
                Translate
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <div className="space-y-4">
            {response?.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {response.error}
              </div>
            )}

            {response?.data && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Translation</CardTitle>
                    <p className="text-sm text-slate-500">
                      {(response.data as { detectedSourceLanguage?: string })?.detectedSourceLanguage} → {targetLanguage}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard((response.data as { translation?: string })?.translation || "")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap text-lg leading-relaxed">
                    {(response.data as { translation?: string })?.translation}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Hub</h1>
          <p className="text-slate-500">Powered by Claude AI via OpenRouter</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="translate" className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Translate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="mt-6">
          {renderFeatures()}
        </TabsContent>
        <TabsContent value="insights" className="mt-6">
          {renderInsights()}
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          {renderMessages()}
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          {renderReviews()}
        </TabsContent>
        <TabsContent value="translate" className="mt-6">
          {renderTranslate()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
