"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  ShoppingBag,
  AlertTriangle,
  Target,
  DollarSign,
  Calendar,
  Star,
  Loader2,
  Gift,
  Zap,
} from "lucide-react";
import ClientSelector from "@/components/ai/ClientSelector";
import { AIResponseCard, ConfidenceMeter, ImpactBadge, RecommendationList } from "@/components/ai/AIResponseCard";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  loyaltyTier?: string;
}

interface InsightsResult {
  summary: string;
  clientScore: {
    value: number;
    label: string;
    trend: "up" | "down" | "stable";
  };
  behaviorInsights: Array<{
    category: string;
    insight: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  serviceRecommendations: Array<{
    service: string;
    reason: string;
    confidence: number;
    estimatedValue: number;
  }>;
  productRecommendations: Array<{
    product: string;
    reason: string;
    confidence: number;
  }>;
  retentionStrategies: string[];
  upsellOpportunities: string[];
  nextBestAction: {
    action: string;
    timing: string;
    expectedOutcome: string;
  };
  churnRisk: {
    level: string;
    factors: string[];
    preventionTips: string[];
  };
}

export default function ClientInsightsPage() {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!selectedClient) {
      setError("Please select a client");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/client-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientData: selectedClient,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "Failed to analyze");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getChurnColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "high":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Client Insights</h1>
            <p className="text-sm text-slate-500">AI-powered client analysis & recommendations</p>
          </div>
        </div>
      </div>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelector
            value={selectedClient}
            onChange={setSelectedClient}
            placeholder="Search for a client..."
          />
          <Button
            className="w-full"
            onClick={handleAnalyze}
            disabled={loading || !selectedClient}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Client...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Overview */}
          <div className="space-y-4">
            {/* Client Score */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-slate-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className={getScoreColor(result.clientScore.value)}
                        strokeWidth="8"
                        strokeDasharray={`${(result.clientScore.value / 100) * 352} 352`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-bold ${getScoreColor(result.clientScore.value)}`}>
                        {result.clientScore.value}
                      </span>
                      <span className="text-xs text-slate-500">Client Score</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                      {result.clientScore.label}
                    </Badge>
                    {getTrendIcon(result.clientScore.trend)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <AIResponseCard
              title="Summary"
              icon={<Sparkles className="h-5 w-5 text-rose-500" />}
            >
              <p className="text-slate-700">{result.summary}</p>
            </AIResponseCard>

            {/* Churn Risk */}
            <AIResponseCard
              title="Churn Risk Assessment"
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            >
              <div className="space-y-3">
                <Badge className={getChurnColor(result.churnRisk.level)}>
                  {result.churnRisk.level.charAt(0).toUpperCase() + result.churnRisk.level.slice(1)} Risk
                </Badge>
                {result.churnRisk.factors.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Factors:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {result.churnRisk.factors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.churnRisk.preventionTips.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Prevention Tips:</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {result.churnRisk.preventionTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AIResponseCard>
          </div>

          {/* Middle Column - Insights & Recommendations */}
          <div className="space-y-4">
            {/* Next Best Action */}
            <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-rose-500" />
                  Next Best Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="font-medium text-slate-900">{result.nextBestAction.action}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {result.nextBestAction.timing}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 bg-white/50 rounded-lg p-3">
                    <span className="font-medium">Expected Outcome:</span> {result.nextBestAction.expectedOutcome}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const action = result.nextBestAction.action.toLowerCase();
                      if (action.includes('appointment') || action.includes('schedule') || action.includes('book')) {
                        router.push(`/calendar/new?clientId=${selectedClient?.id}`);
                      } else if (action.includes('message') || action.includes('contact') || action.includes('reach out')) {
                        router.push(`/messaging?clientId=${selectedClient?.id}`);
                      } else if (action.includes('offer') || action.includes('discount') || action.includes('promo')) {
                        router.push(`/marketing/campaigns/new?clientId=${selectedClient?.id}`);
                      } else {
                        router.push(`/clients/${selectedClient?.id}`);
                      }
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Behavior Insights */}
            <AIResponseCard
              title="Behavior Insights"
              icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            >
              <div className="space-y-3">
                {result.behaviorInsights.map((insight, index) => (
                  <div key={index} className="p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        {insight.category}
                      </span>
                      <ImpactBadge impact={insight.impact} />
                    </div>
                    <p className="text-sm text-slate-700">{insight.insight}</p>
                  </div>
                ))}
              </div>
            </AIResponseCard>

            {/* Retention Strategies */}
            <AIResponseCard
              title="Retention Strategies"
              icon={<Heart className="h-5 w-5 text-red-500" />}
              expandable
            >
              <RecommendationList items={result.retentionStrategies} />
            </AIResponseCard>
          </div>

          {/* Right Column - Recommendations */}
          <div className="space-y-4">
            {/* Service Recommendations */}
            <AIResponseCard
              title="Service Recommendations"
              icon={<Star className="h-5 w-5 text-amber-500" />}
            >
              <div className="space-y-3">
                {result.serviceRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-slate-900">{rec.service}</span>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <DollarSign className="h-3 w-3" />
                        {rec.estimatedValue}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{rec.reason}</p>
                    <ConfidenceMeter value={rec.confidence} label="Confidence" />
                  </div>
                ))}
              </div>
            </AIResponseCard>

            {/* Product Recommendations */}
            <AIResponseCard
              title="Product Recommendations"
              icon={<ShoppingBag className="h-5 w-5 text-purple-500" />}
              expandable
            >
              <div className="space-y-3">
                {result.productRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 rounded-lg bg-purple-50">
                    <p className="font-medium text-slate-900">{rec.product}</p>
                    <p className="text-sm text-slate-600 mb-2">{rec.reason}</p>
                    <ConfidenceMeter value={rec.confidence} />
                  </div>
                ))}
              </div>
            </AIResponseCard>

            {/* Upsell Opportunities */}
            <AIResponseCard
              title="Upsell Opportunities"
              icon={<Gift className="h-5 w-5 text-green-500" />}
              expandable
            >
              <ul className="space-y-2">
                {result.upsellOpportunities.map((opp, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-700 p-2 rounded-lg bg-green-50"
                  >
                    <DollarSign className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {opp}
                  </li>
                ))}
              </ul>
            </AIResponseCard>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              Select a Client to Analyze
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              Choose a client from your database to get AI-powered insights including
              behavior analysis, service recommendations, retention strategies, and more.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
