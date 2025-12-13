"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  DollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  BarChart3,
  PieChart,
  Zap,
} from "lucide-react";
import { AIResponseCard, ConfidenceMeter, RecommendationList } from "@/components/ai/AIResponseCard";

interface RevenueResult {
  prediction: {
    expectedRevenue: number;
    confidenceInterval: { low: number; high: number };
    confidence: number;
    comparedToLastMonth: string;
    comparedToLastYear: string;
  };
  breakdown: {
    servicesRevenue: number;
    productRevenue: number;
    expectedAppointments: number;
    expectedNewClients: number;
  };
  monthlyForecast: Array<{
    month: string;
    revenue: number;
    trend: string;
  }>;
  growthDrivers: Array<{
    factor: string;
    impact: string;
    confidence: number;
    actionable: boolean;
  }>;
  risks: Array<{
    factor: string;
    potentialImpact: string;
    probability: number;
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potentialValue: number;
    effort: string;
    timeframe: string;
  }>;
  recommendations: Array<{
    priority: number;
    action: string;
    expectedImpact: string;
    implementation: string;
  }>;
  kpiTargets: {
    revenueTarget: number;
    appointmentTarget: number;
    avgTicketTarget: number;
    newClientTarget: number;
  };
}

export default function RevenuePredictorPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("next_month");
  const [includeSeasonality, setIncludeSeasonality] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RevenueResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/revenue-predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeframe,
          includeSeasonality,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "Failed to predict");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith("+")) return "text-green-600";
    if (change.startsWith("-")) return "text-red-600";
    return "text-slate-600";
  };

  const getChangeIcon = (change: string) => {
    if (change.startsWith("+")) return <ArrowUpRight className="h-4 w-4" />;
    if (change.startsWith("-")) return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Revenue Predictor</h1>
            <p className="text-sm text-slate-500">AI-powered revenue forecasting</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Forecast Period:</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next_week">Next Week</SelectItem>
                  <SelectItem value="next_month">Next Month</SelectItem>
                  <SelectItem value="next_quarter">Next Quarter</SelectItem>
                  <SelectItem value="next_year">Next Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={includeSeasonality}
                onCheckedChange={setIncludeSeasonality}
              />
              <Label>Include Seasonal Factors</Label>
            </div>
            <Button onClick={handlePredict} disabled={loading} className="ml-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Main Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Predicted Revenue</p>
                    <p className="text-4xl font-bold text-green-800 mt-1">
                      {formatCurrency(result.prediction.expectedRevenue)}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className={`flex items-center gap-1 ${getChangeColor(result.prediction.comparedToLastMonth)}`}>
                        {getChangeIcon(result.prediction.comparedToLastMonth)}
                        <span className="text-sm font-medium">{result.prediction.comparedToLastMonth}</span>
                        <span className="text-xs text-slate-500">vs last month</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <ConfidenceMeter value={result.prediction.confidence} label="Confidence" />
                    <p className="text-xs text-slate-500 mt-2">
                      Range: {formatCurrency(result.prediction.confidenceInterval.low)} - {formatCurrency(result.prediction.confidenceInterval.high)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Appointments</p>
                    <p className="text-xl font-bold">{result.breakdown.expectedAppointments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">New Clients</p>
                    <p className="text-xl font-bold">{result.breakdown.expectedNewClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Targets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-rose-500" />
                Recommended KPI Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 text-center">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(result.kpiTargets.revenueTarget)}</p>
                  <p className="text-sm text-slate-500">Revenue Target</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 text-center">
                  <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{result.kpiTargets.appointmentTarget}</p>
                  <p className="text-sm text-slate-500">Appointment Target</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 text-center">
                  <PieChart className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(result.kpiTargets.avgTicketTarget)}</p>
                  <p className="text-sm text-slate-500">Avg Ticket Target</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 text-center">
                  <Users className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{result.kpiTargets.newClientTarget}</p>
                  <p className="text-sm text-slate-500">New Client Target</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Drivers */}
            <AIResponseCard
              title="Growth Drivers"
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            >
              <div className="space-y-3">
                {result.growthDrivers.map((driver, index) => (
                  <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-slate-900">{driver.factor}</span>
                      <span className="text-green-600 font-semibold">{driver.impact}</span>
                    </div>
                    <ConfidenceMeter value={driver.confidence} />
                    {driver.actionable && (
                      <Badge className="mt-2 bg-green-100 text-green-700">
                        <Zap className="h-3 w-3 mr-1" />
                        Actionable
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </AIResponseCard>

            {/* Risks */}
            <AIResponseCard
              title="Potential Risks"
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            >
              <div className="space-y-3">
                {result.risks.map((risk, index) => (
                  <div key={index} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-slate-900">{risk.factor}</span>
                      <span className="text-red-600 font-semibold">{risk.potentialImpact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <span>Probability: {risk.probability}%</span>
                    </div>
                    <p className="text-sm text-slate-600 bg-white/50 rounded p-2">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </AIResponseCard>

            {/* Opportunities */}
            <AIResponseCard
              title="Growth Opportunities"
              icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
            >
              <div className="space-y-3">
                {result.opportunities.map((opp, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-white">
                    <p className="font-medium text-slate-900 mb-2">{opp.opportunity}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-semibold">
                        +{formatCurrency(opp.potentialValue)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={getEffortColor(opp.effort)}>{opp.effort} effort</Badge>
                        <Badge variant="outline">{opp.timeframe}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AIResponseCard>
          </div>

          {/* Recommendations */}
          <AIResponseCard
            title="Priority Recommendations"
            icon={<Sparkles className="h-5 w-5 text-rose-500" />}
          >
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex gap-4 p-4 rounded-lg border bg-white">
                  <div className="h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 font-bold">
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-slate-900">{rec.action}</p>
                      <Badge className="bg-green-100 text-green-700">{rec.expectedImpact}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">{rec.implementation}</p>
                  </div>
                </div>
              ))}
            </div>
          </AIResponseCard>

          {/* Monthly Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-48">
                {result.monthlyForecast.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t-lg ${
                        month.trend === "up" ? "bg-green-500" : month.trend === "down" ? "bg-red-400" : "bg-slate-400"
                      }`}
                      style={{
                        height: `${(month.revenue / Math.max(...result.monthlyForecast.map(m => m.revenue))) * 150}px`,
                      }}
                    />
                    <div className="text-center">
                      <p className="font-bold text-sm">{formatCurrency(month.revenue)}</p>
                      <p className="text-xs text-slate-500">{month.month}</p>
                      {month.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                      ) : month.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              Generate Revenue Forecast
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              Select a timeframe and click Generate Forecast to get AI-powered revenue predictions,
              growth opportunities, risk analysis, and actionable recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
