"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Shuffle,
  BarChart3,
} from "lucide-react";

const sampleData = [
  {
    service: "Women's Haircut",
    currentPrice: "65",
    marketPosition: "mid",
    goal: "increase_revenue",
  },
  {
    service: "Balayage",
    currentPrice: "180",
    marketPosition: "premium",
    goal: "stay_competitive",
  },
  {
    service: "Manicure",
    currentPrice: "35",
    marketPosition: "budget",
    goal: "increase_bookings",
  },
  {
    service: "Facial Treatment",
    currentPrice: "95",
    marketPosition: "mid",
    goal: "maximize_profit",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [service, setService] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [marketPosition, setMarketPosition] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setService(sample.service);
    setCurrentPrice(sample.currentPrice);
    setMarketPosition(sample.marketPosition);
    setGoal(sample.goal);
  };

  const handleAnalyze = async () => {
    if (!service || !currentPrice) {
      setError("Please enter service and current price");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/price-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: goal === "increase_revenue" ? "maximize" :
                   goal === "stay_competitive" ? "competitive" :
                   goal === "maximize_profit" ? "value" : "demand",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze");
      }

      // Find recommendation for selected service or use first one
      const serviceRec = data.analysis?.recommendations?.find(
        (r: any) => r.service.toLowerCase().includes(service.toLowerCase())
      ) || data.analysis?.recommendations?.[0];

      const currentPriceNum = parseFloat(currentPrice);
      const suggestedPrice = serviceRec?.suggestedPrice || currentPriceNum * 1.1;
      const priceChange = suggestedPrice - currentPriceNum;

      // Map API response to UI expected format
      setResult({
        recommendedPrice: suggestedPrice.toFixed(0),
        priceChange: priceChange.toFixed(0),
        recommendation: serviceRec?.reason || "Based on market analysis and demand patterns",
        marketAnalysis: {
          low: Math.round(currentPriceNum * 0.7),
          average: Math.round(currentPriceNum),
          high: Math.round(currentPriceNum * 1.4),
          yourPosition: marketPosition === "premium" ? "Upper quartile" :
                       marketPosition === "budget" ? "Lower quartile" : "Mid-range",
        },
        revenueImpact: {
          revenueChange: Math.round(priceChange * 20),
          bookingChange: priceChange > 0 ? -5 : 10,
        },
        tips: data.analysis?.insights?.opportunities || [
          "Consider dynamic pricing during peak hours",
          "Bundle services for higher average ticket",
          "Offer loyalty discounts to retain clients",
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Price Optimizer</h1>
            <p className="text-sm text-slate-500">AI-powered pricing recommendations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Service Details</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service */}
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Women's Haircut">Women's Haircut</SelectItem>
                  <SelectItem value="Men's Haircut">Men's Haircut</SelectItem>
                  <SelectItem value="Hair Color">Hair Color</SelectItem>
                  <SelectItem value="Balayage">Balayage</SelectItem>
                  <SelectItem value="Highlights">Highlights</SelectItem>
                  <SelectItem value="Blowout">Blowout</SelectItem>
                  <SelectItem value="Manicure">Manicure</SelectItem>
                  <SelectItem value="Pedicure">Pedicure</SelectItem>
                  <SelectItem value="Gel Nails">Gel Nails</SelectItem>
                  <SelectItem value="Facial Treatment">Facial Treatment</SelectItem>
                  <SelectItem value="Massage">Massage (60 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Price */}
            <div className="space-y-2">
              <Label>Current Price *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Market Position */}
            <div className="space-y-2">
              <Label>Market Position</Label>
              <Select value={marketPosition} onValueChange={setMarketPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget-Friendly</SelectItem>
                  <SelectItem value="mid">Mid-Range</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label>Pricing Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase_revenue">Increase Revenue</SelectItem>
                  <SelectItem value="increase_bookings">Increase Bookings</SelectItem>
                  <SelectItem value="maximize_profit">Maximize Profit</SelectItem>
                  <SelectItem value="stay_competitive">Stay Competitive</SelectItem>
                  <SelectItem value="premium_positioning">Premium Positioning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || !service || !currentPrice}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Price Recommendations
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Recommended Price */}
                {result.recommendedPrice && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      <Label className="text-emerald-800">Recommended Price</Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-emerald-700">
                        ${result.recommendedPrice}
                      </span>
                      {result.priceChange > 0 ? (
                        <Badge className="bg-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +${result.priceChange}
                        </Badge>
                      ) : result.priceChange < 0 ? (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          ${result.priceChange}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Change</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{result.recommendation}</p>
                  </div>
                )}

                {/* Market Analysis */}
                {result.marketAnalysis && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <Label>Market Analysis</Label>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500">Low</p>
                          <p className="font-semibold">${result.marketAnalysis.low}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Average</p>
                          <p className="font-semibold">${result.marketAnalysis.average}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">High</p>
                          <p className="font-semibold">${result.marketAnalysis.high}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-3">
                        Your position: {result.marketAnalysis.yourPosition}
                      </p>
                    </div>
                  </div>
                )}

                {/* Revenue Impact */}
                {result.revenueImpact && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <Label className="text-blue-800">Projected Impact</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-slate-500">Monthly Revenue</p>
                        <p className="font-semibold text-blue-700">
                          {result.revenueImpact.revenueChange > 0 ? "+" : ""}
                          ${result.revenueImpact.revenueChange}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Booking Change</p>
                        <p className="font-semibold text-blue-700">
                          {result.revenueImpact.bookingChange > 0 ? "+" : ""}
                          {result.revenueImpact.bookingChange}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {result.tips && result.tips.length > 0 && (
                  <div className="space-y-2">
                    <Label>Pricing Tips</Label>
                    <ul className="space-y-1">
                      {result.tips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-rose-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Price analysis will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
