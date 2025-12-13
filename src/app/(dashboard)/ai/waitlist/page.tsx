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
  Clock,
  Sparkles,
  Loader2,
  Users,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Shuffle,
  TrendingUp,
} from "lucide-react";

const sampleData = [
  {
    currentWaitlist: "5",
    averageServiceTime: "45",
    staffAvailable: "3",
    dayType: "saturday",
  },
  {
    currentWaitlist: "8",
    averageServiceTime: "60",
    staffAvailable: "2",
    dayType: "weekday",
  },
  {
    currentWaitlist: "3",
    averageServiceTime: "30",
    staffAvailable: "4",
    dayType: "weekday",
  },
  {
    currentWaitlist: "12",
    averageServiceTime: "90",
    staffAvailable: "3",
    dayType: "holiday",
  },
];

export default function WaitlistPage() {
  const router = useRouter();
  const [currentWaitlist, setCurrentWaitlist] = useState("");
  const [averageServiceTime, setAverageServiceTime] = useState("");
  const [staffAvailable, setStaffAvailable] = useState("");
  const [dayType, setDayType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setCurrentWaitlist(sample.currentWaitlist);
    setAverageServiceTime(sample.averageServiceTime);
    setStaffAvailable(sample.staffAvailable);
    setDayType(sample.dayType);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    // Simulate AI analysis (in production, this would call a real API)
    setTimeout(() => {
      const waitCount = parseInt(currentWaitlist) || 5;
      const serviceTime = parseInt(averageServiceTime) || 45;
      const staff = parseInt(staffAvailable) || 3;

      const avgWaitTime = Math.round((waitCount * serviceTime) / staff);
      const cancellationRisk = waitCount > 6 ? "high" : waitCount > 3 ? "medium" : "low";

      setResult({
        estimatedWaitTime: avgWaitTime,
        cancellationPredictions: [
          { position: 3, client: "Walk-in #3", risk: 35, reason: "Long wait time for walk-in" },
          { position: 5, client: "Walk-in #5", risk: 55, reason: "Over 1 hour wait, first-time visitor" },
          { position: 7, client: "Sarah M.", risk: 20, reason: "Regular client, usually patient" },
        ].slice(0, Math.min(waitCount, 3)),
        optimizationSuggestions: [
          "Consider offering position #5 a 10% discount to wait",
          "Notify clients at positions 4-6 of updated wait times",
          `Current throughput: ${staff} clients per ${serviceTime} min average`,
          waitCount > 5 ? "Consider opening additional station if available" : "Waitlist is manageable",
        ],
        notifyClients: waitCount > 4 ? [
          { position: waitCount - 1, message: "You're next! Please be ready." },
          { position: Math.ceil(waitCount / 2), message: `Estimated wait: ${Math.round(avgWaitTime / 2)} min` },
        ] : [],
        peakPrediction: {
          nextPeakHour: dayType === "saturday" ? "2:00 PM" : "5:00 PM",
          expectedIncrease: dayType === "saturday" ? "+40%" : "+25%",
        },
        staffRecommendation: waitCount > staff * 2
          ? "Consider calling in additional staff"
          : "Current staffing is adequate",
      });
      setLoading(false);
    }, 1500);
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 50) return "bg-red-100 text-red-700 border-red-200";
    if (risk >= 30) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Smart Waitlist</h1>
            <p className="text-sm text-slate-500">AI-powered queue management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Current Status</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Waitlist */}
            <div className="space-y-2">
              <Label>People on Waitlist</Label>
              <Input
                type="number"
                placeholder="5"
                value={currentWaitlist}
                onChange={(e) => setCurrentWaitlist(e.target.value)}
              />
            </div>

            {/* Average Service Time */}
            <div className="space-y-2">
              <Label>Average Service Time (minutes)</Label>
              <Select value={averageServiceTime} onValueChange={setAverageServiceTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min (Quick service)</SelectItem>
                  <SelectItem value="45">45 min (Standard)</SelectItem>
                  <SelectItem value="60">60 min (Full service)</SelectItem>
                  <SelectItem value="90">90 min (Extended)</SelectItem>
                  <SelectItem value="120">120 min (Complex)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff Available */}
            <div className="space-y-2">
              <Label>Staff Currently Available</Label>
              <Input
                type="number"
                placeholder="3"
                value={staffAvailable}
                onChange={(e) => setStaffAvailable(e.target.value)}
              />
            </div>

            {/* Day Type */}
            <div className="space-y-2">
              <Label>Day Type</Label>
              <Select value={dayType} onValueChange={setDayType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="holiday">Holiday/Special</SelectItem>
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
                  Optimize Waitlist
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
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Wait Time Estimate */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-700">Estimated Wait Time</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {result.estimatedWaitTime} minutes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cancellation Predictions */}
                {result.cancellationPredictions && result.cancellationPredictions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <Label>Cancellation Risk</Label>
                    </div>
                    {result.cancellationPredictions.map((pred: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border ${getRiskColor(pred.risk)}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Position #{pred.position}</span>
                          <Badge variant="outline">{pred.risk}% risk</Badge>
                        </div>
                        <p className="text-sm mt-1">{pred.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notify Clients */}
                {result.notifyClients && result.notifyClients.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <Label>Send Notifications</Label>
                    </div>
                    {result.notifyClients.map((client: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Position #{client.position}</p>
                          <p className="text-sm text-slate-600">{client.message}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Notify
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Peak Prediction */}
                {result.peakPrediction && (
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">
                        Next Peak: {result.peakPrediction.nextPeakHour}
                      </span>
                      <Badge className="bg-purple-600">
                        {result.peakPrediction.expectedIncrease}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Optimization Tips */}
                {result.optimizationSuggestions && (
                  <div className="space-y-2">
                    <Label>Optimization Tips</Label>
                    <ul className="space-y-1">
                      {result.optimizationSuggestions.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Staff Recommendation */}
                {result.staffRecommendation && (
                  <div className="p-3 rounded-lg bg-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-600" />
                      <span className="text-sm">{result.staffRecommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Waitlist analysis will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
