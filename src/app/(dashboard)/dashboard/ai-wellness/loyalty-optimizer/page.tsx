"use client";

import { useState, useEffect } from "react";
import { Gift, ArrowLeft, Loader2, TrendingUp, Users, Target, Star, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Optimization {
  currentAssessment: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  programSuggestions: {
    category: string;
    suggestion: string;
    currentState: string;
    recommendedChange: string;
    expectedImpact: string;
    priority: string;
  }[];
  rewardOptimizations: {
    rewardType: string;
    suggestion: string;
    pointsCost: number;
    perceivedValue: string;
    appeal: string;
  }[];
  tierStructure: {
    recommended: boolean;
    tiers: { name: string; requirement: string; benefits: string[]; color: string }[];
  };
  engagementStrategies: {
    strategy: string;
    description: string;
    targetAudience: string;
    expectedEngagement: string;
  }[];
  retentionTactics: { tactic: string; trigger: string; action: string; expectedOutcome: string }[];
  gamificationIdeas: { feature: string; description: string; engagement: string }[];
  metrics: {
    currentProjected: { memberGrowth: string; redemptionRate: string; retentionImprovement: string };
    withOptimizations: { memberGrowth: string; redemptionRate: string; retentionImprovement: string };
  };
  implementationRoadmap: { immediate: string[]; shortTerm: string[]; longTerm: string[] };
}

export default function LoyaltyOptimizerPage() {
  const [optimization, setOptimization] = useState<Optimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/loyalty-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: "default" }),
      });

      const data = await res.json();
      if (data.success) {
        setOptimization(data.optimization);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const tierColors: Record<string, string> = {
    Bronze: "from-amber-600 to-amber-400",
    Silver: "from-gray-400 to-gray-300",
    Gold: "from-yellow-500 to-yellow-300",
    Platinum: "from-purple-500 to-purple-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Loyalty Program Manager</h1>
                <p className="text-sm text-gray-500">Optimize your loyalty program with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300"
              >
                Load Sample Data
              </button>
              <button
                onClick={handleOptimize}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                {loading ? "Analyzing..." : "Analyze Program"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          /* Welcome */
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center max-w-2xl mx-auto">
            <Gift className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Optimize Your Loyalty Program</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get AI-powered recommendations to improve member engagement, increase redemption rates, and boost retention.
            </p>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Start Analysis"}
            </button>
          </div>
        ) : optimization && (
          <div className="space-y-8">
            {/* Score & Assessment */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Program Assessment</h2>
                <div className={`text-7xl font-bold ${getScoreColor(optimization.currentAssessment.overallScore)}`}>
                  {optimization.currentAssessment.overallScore}
                </div>
                <p className="text-gray-500 mt-2">Overall Score</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {optimization.currentAssessment.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Weaknesses</h4>
                  <ul className="space-y-1">
                    {optimization.currentAssessment.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {w}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Opportunities</h4>
                  <ul className="space-y-1">
                    {optimization.currentAssessment.opportunities.map((o, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Program Suggestions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-yellow-500" />
                Priority Recommendations
              </h3>
              <div className="space-y-4">
                {optimization.programSuggestions.map((suggestion, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs uppercase font-medium text-gray-500">{suggestion.category}</span>
                        <h4 className="font-medium mt-1">{suggestion.suggestion}</h4>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.recommendedChange}</p>
                      </div>
                      <span className="px-2 py-1 bg-white/50 rounded text-xs font-medium">{suggestion.priority}</span>
                    </div>
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      Expected Impact: {suggestion.expectedImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Structure */}
            {optimization.tierStructure.recommended && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommended Tier Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {optimization.tierStructure.tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl bg-gradient-to-br ${tierColors[tier.color] || "from-gray-500 to-gray-400"} text-white`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5" />
                        <span className="font-semibold">{tier.name}</span>
                      </div>
                      <p className="text-sm text-white/80 mb-3">{tier.requirement}</p>
                      <ul className="text-sm space-y-1">
                        {tier.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span>•</span> {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Comparison */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Projected Improvements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Member Growth", current: optimization.metrics.currentProjected.memberGrowth, optimized: optimization.metrics.withOptimizations.memberGrowth },
                  { label: "Redemption Rate", current: optimization.metrics.currentProjected.redemptionRate, optimized: optimization.metrics.withOptimizations.redemptionRate },
                  { label: "Retention", current: optimization.metrics.currentProjected.retentionImprovement, optimized: optimization.metrics.withOptimizations.retentionImprovement },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white/20 rounded-lg p-4">
                    <div className="text-sm text-white/80 mb-2">{metric.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 line-through">{metric.current}</span>
                      <span>→</span>
                      <span className="text-2xl font-bold">{metric.optimized}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Strategies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Engagement Strategies
                </h3>
                <div className="space-y-3">
                  {optimization.engagementStrategies.map((strategy, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-medium">{strategy.strategy}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.description}</p>
                      <div className="text-xs text-blue-600 mt-1">Target: {strategy.targetAudience}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Gamification Ideas</h3>
                <div className="space-y-3">
                  {optimization.gamificationIdeas.map((idea, idx) => (
                    <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="font-medium">{idea.feature}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{idea.description}</p>
                      <div className="text-xs text-purple-600 mt-1">Engagement: {idea.engagement}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Implementation Roadmap */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Implementation Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Immediate", items: optimization.implementationRoadmap.immediate, color: "bg-red-500" },
                  { title: "Short Term", items: optimization.implementationRoadmap.shortTerm, color: "bg-yellow-500" },
                  { title: "Long Term", items: optimization.implementationRoadmap.longTerm, color: "bg-green-500" },
                ].map((phase) => (
                  <div key={phase.title}>
                    <div className={`${phase.color} text-white px-3 py-1 rounded-t-lg text-sm font-medium`}>
                      {phase.title}
                    </div>
                    <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg p-4">
                      <ul className="space-y-2">
                        {phase.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowResults(false); setOptimization(null); }}
              className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Run New Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
