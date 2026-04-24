"use client";

import { useState, useEffect } from "react";
import { Calendar, ArrowLeft, Loader2, Clock, Users, TrendingUp, AlertTriangle, CheckCircle, Zap, RefreshCw, DollarSign } from "lucide-react";
import Link from "next/link";

interface OptimizationAnalysis {
  issues: { type: string; staff: string; description: string }[];
  recommendations: { action: string; details: string; impact: string }[];
  openSlots: { staff: string; time: string; duration: number }[];
  metrics: { utilization: number; gaps: number; potentialRevenue: number };
  raw?: string;
}

interface OptimizationResult {
  date: string;
  staffCount: number;
  appointmentCount: number;
  analysis: OptimizationAnalysis;
}

export default function AppointmentOptimizerPage() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [optimizeFor, setOptimizeFor] = useState("gaps");

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/appointment-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          optimize: optimizeFor,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to optimize appointments");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to connect to optimization service");
    } finally {
      setLoading(false);
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case "gap": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "overlap": return "bg-red-100 text-red-700 border-red-200";
      case "efficiency": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "move": return "bg-purple-100 text-purple-700";
      case "add": return "bg-green-100 text-green-700";
      case "buffer": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const loadSampleData = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setOptimizeFor("revenue");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/ai-wellness" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-blue-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Appointment Optimizer</h1>
                <p className="text-sm text-gray-500">Smart scheduling powered by AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Optimization Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date to Optimize
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Optimize For
              </label>
              <select
                value={optimizeFor}
                onChange={(e) => setOptimizeFor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="gaps">Minimize Gaps</option>
                <option value="revenue">Maximize Revenue</option>
                <option value="satisfaction">Client Satisfaction</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={loadSampleData}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 whitespace-nowrap"
              >
                Load Sample Data
              </button>
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                {loading ? "Analyzing..." : "Optimize Schedule"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-semibold mb-4">Optimization Summary for {result.date}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{result.staffCount}</div>
                  <div className="text-sm text-white/80">Staff Members</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{result.appointmentCount}</div>
                  <div className="text-sm text-white/80">Appointments</div>
                </div>
                {result.analysis.metrics && (
                  <>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{result.analysis.metrics.utilization}%</div>
                      <div className="text-sm text-white/80">Utilization</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{result.analysis.metrics.gaps} min</div>
                      <div className="text-sm text-white/80">Total Gaps</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Issues Found */}
            {result.analysis.issues && result.analysis.issues.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Issues Identified
                </h3>
                <div className="space-y-3">
                  {result.analysis.issues.map((issue, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-l-4 ${getIssueColor(issue.type)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs uppercase font-medium">{issue.type}</span>
                          <div className="font-medium mt-1">{issue.staff}</div>
                          <p className="text-sm mt-1">{issue.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI Recommendations
                </h3>
                <div className="space-y-4">
                  {result.analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(rec.action)}`}>
                          {rec.action}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{rec.details}</p>
                          <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Impact: {rec.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Slots */}
            {result.analysis.openSlots && result.analysis.openSlots.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Available Slots for Booking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.analysis.openSlots.map((slot, idx) => (
                    <div key={idx} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700 dark:text-green-300">{slot.staff}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {slot.time}
                        </div>
                        <div className="mt-1">Duration: {slot.duration} minutes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Revenue */}
            {result.analysis.metrics?.potentialRevenue > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Opportunity
                </h3>
                <p className="text-3xl font-bold">${result.analysis.metrics.potentialRevenue.toLocaleString()}</p>
                <p className="text-white/80 text-sm mt-1">Potential additional revenue by filling open slots</p>
              </div>
            )}

            {/* Raw AI Response (fallback) */}
            {result.analysis.raw && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">AI Analysis</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {result.analysis.raw}
                  </pre>
                </div>
              </div>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Run New Analysis
            </button>
          </div>
        )}

        {!result && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <Calendar className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Optimize Your Schedule</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Get AI-powered insights to reduce gaps, optimize staff utilization, and identify revenue opportunities in your appointment schedule.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Identify scheduling gaps
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Optimize staff utilization
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Maximize revenue potential
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
