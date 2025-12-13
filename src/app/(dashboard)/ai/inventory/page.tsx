"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shuffle,
  ShoppingCart,
} from "lucide-react";

const sampleData = [
  {
    category: "Hair Care",
    timeframe: "30",
    seasonalFactor: "summer",
  },
  {
    category: "Styling Products",
    timeframe: "60",
    seasonalFactor: "winter",
  },
  {
    category: "Nail Products",
    timeframe: "30",
    seasonalFactor: "holiday",
  },
  {
    category: "Skincare",
    timeframe: "90",
    seasonalFactor: "spring",
  },
];

export default function InventoryForecastPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [seasonalFactor, setSeasonalFactor] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setCategory(sample.category);
    setTimeframe(sample.timeframe);
    setSeasonalFactor(sample.seasonalFactor);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/inventory-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          daysAhead: parseInt(timeframe) || 30,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze");
      }

      // Map API response to UI expected format
      setResult({
        reorderAlerts: data.aiAnalysis?.urgentReorders?.map((item: any) => ({
          product: item.productName,
          currentStock: item.currentStock,
          daysUntilStockout: item.daysUntilStockout || 7,
          suggestedOrder: item.recommendedOrder,
        })) || [],
        trendingUp: data.products?.topSellers?.slice(0, 3).map((item: any) => ({
          product: item.name,
          growthPercent: Math.round(item.avgWeeklySales * 10),
          reason: `${item.totalSold90Days} units sold in last 90 days`,
        })) || [],
        trendingDown: data.aiAnalysis?.slowMovers?.map((item: any) => ({
          product: item.productName,
          daysOfStock: 180,
          suggestion: item.suggestion,
        })) || [],
        purchaseRecommendations: {
          totalValue: Math.round(data.aiAnalysis?.estimatedReorderCost || 0),
          itemCount: data.aiAnalysis?.urgentReorders?.length || 0,
        },
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Inventory Forecast</h1>
            <p className="text-sm text-slate-500">AI-powered demand prediction</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Forecast Parameters</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Product Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Hair Care">Hair Care</SelectItem>
                  <SelectItem value="Styling Products">Styling Products</SelectItem>
                  <SelectItem value="Skincare">Skincare</SelectItem>
                  <SelectItem value="Nail Products">Nail Products</SelectItem>
                  <SelectItem value="Color Products">Color Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
              <Label>Forecast Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Next 30 Days</SelectItem>
                  <SelectItem value="60">Next 60 Days</SelectItem>
                  <SelectItem value="90">Next 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seasonal Factor */}
            <div className="space-y-2">
              <Label>Seasonal Consideration</Label>
              <Select value={seasonalFactor} onValueChange={setSeasonalFactor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="summer">Summer Rush</SelectItem>
                  <SelectItem value="winter">Winter Season</SelectItem>
                  <SelectItem value="holiday">Holiday Season</SelectItem>
                  <SelectItem value="spring">Spring/Prom Season</SelectItem>
                  <SelectItem value="backtoschool">Back to School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleAnalyze} disabled={loading}>
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
            <CardTitle className="text-lg">Forecast Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Reorder Alerts */}
                {result.reorderAlerts && result.reorderAlerts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Label className="text-red-700">Reorder Now</Label>
                    </div>
                    {result.reorderAlerts.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.product}</span>
                          <Badge variant="destructive">
                            {item.currentStock} left
                          </Badge>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          Predicted to run out in {item.daysUntilStockout} days
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Suggested order: {item.suggestedOrder} units
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trending Up */}
                {result.trendingUp && result.trendingUp.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <Label className="text-green-700">Trending Up</Label>
                    </div>
                    {result.trendingUp.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.product}</span>
                          <Badge className="bg-green-600">
                            +{item.growthPercent}%
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trending Down */}
                {result.trendingDown && result.trendingDown.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-amber-500" />
                      <Label className="text-amber-700">Slow Moving</Label>
                    </div>
                    {result.trendingDown.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.product}</span>
                          <Badge variant="outline" className="text-amber-700">
                            {item.daysOfStock} days stock
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{item.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Purchase Recommendations */}
                {result.purchaseRecommendations && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <Label className="text-blue-800">Order Summary</Label>
                    </div>
                    <p className="text-sm text-blue-700">
                      Estimated order value: ${result.purchaseRecommendations.totalValue}
                    </p>
                    <p className="text-sm text-blue-700">
                      {result.purchaseRecommendations.itemCount} products to reorder
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Inventory forecast will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
