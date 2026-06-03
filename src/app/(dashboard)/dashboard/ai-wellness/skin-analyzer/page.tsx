"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowLeft, Loader2, Droplets, Sun, Clock, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Analysis {
  skinCondition: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    overallHealth: number;
    summary: string;
  };
  recommendations: {
    ingredients: { name: string; benefit: string; howToUse: string }[];
    avoid: string[];
  };
  productSuggestions: { step: string; type: string; keyIngredients: string[]; benefit: string }[];
  routineAdvice: {
    morning: string[];
    evening: string[];
    weekly: string[];
  };
  treatmentSuggestions: { treatment: string; frequency: string; benefit: string; idealFor: string }[];
  lifestyleTips: string[];
  expectedTimeline: { week1_2: string; month1: string; month3: string };
}

interface SkinAnalysis {
  id: string;
  skinType: string;
  concerns: string[];
  createdAt: string;
}

const skinTypes = ["oily", "dry", "combination", "normal", "sensitive"];
const skinConcerns = [
  "Acne", "Aging", "Dark spots", "Dryness", "Dullness", "Fine lines",
  "Hyperpigmentation", "Large pores", "Oiliness", "Redness", "Sensitivity",
  "Texture", "Uneven tone", "Wrinkles", "Dark circles", "Dehydration"
];

export default function SkinAnalyzerPage() {
  const [analyses, setAnalyses] = useState<SkinAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await fetch("/api/ai/skin-analyzer?limit=15");
      const data = await res.json();
      if (data.success) setAnalyses(data.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skinType || concerns.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/skin-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skinType, concerns, age: age ? parseInt(age) : null, lifestyle }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        fetchAnalyses();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/skin-analyzer?id=${id}`, { method: "DELETE" });
      setAnalyses(analyses.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleConcern = (concern: string) => {
    setConcerns(concerns.includes(concern) ? concerns.filter((c) => c !== concern) : [...concerns, concern]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const loadSampleData = () => {
    setSkinType("combination");
    setConcerns(["Acne", "Dark spots", "Large pores", "Oiliness"]);
    setAge("28");
    setLifestyle("Office worker, moderate stress, exercises 3x/week, drinks coffee daily, tries to sleep 7-8 hours");
    setShowForm(true);
    setAnalysis(null);
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
              <div className="p-3 bg-pink-500 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Skin Analyzer</h1>
                <p className="text-sm text-gray-500">Personalized skincare recommendations</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setAnalysis(null); setConcerns([]); setSkinType(""); }}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              New Analysis
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!analysis && !showForm ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Start Card */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Sparkles className="h-16 w-16 text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Get Your Skin Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Answer a few questions about your skin and receive a comprehensive analysis with personalized recommendations.
              </p>
              <button onClick={() => setShowForm(true)} className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
                Start Analysis
              </button>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Analyses</h3>
              {analyses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No analyses yet</p>
              ) : (
                <div className="space-y-3">
                  {analyses.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium capitalize">{a.skinType} skin</p>
                        <p className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setConfirmDeleteId(a.id)} className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : showForm && !analysis ? (
          /* Form */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tell us about your skin</h2>
                <button type="button" onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">Load Sample Data</button>
              </div>

              {/* Skin Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Skin Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {skinTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSkinType(type)}
                      className={`py-3 px-4 rounded-lg border-2 capitalize transition-colors ${
                        skinType === type
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Skin Concerns (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {skinConcerns.map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleConcern(concern)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        concerns.includes(concern)
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 hover:bg-pink-100 text-gray-700"
                      }`}
                    >
                      {concern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age (optional)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Lifestyle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lifestyle (optional)</label>
                <textarea
                  value={lifestyle}
                  onChange={(e) => setLifestyle(e.target.value)}
                  placeholder="Describe your lifestyle (e.g., outdoor activities, stress levels, sleep habits...)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !skinType || concerns.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {loading ? "Analyzing..." : "Analyze My Skin"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : analysis ? (
          /* Results */
          <div className="space-y-8">
            {/* Skin Condition Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Skin Condition</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{analysis.skinCondition.summary}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Hydration", value: analysis.skinCondition.hydration, icon: Droplets },
                  { label: "Oiliness", value: analysis.skinCondition.oiliness, icon: Sun },
                  { label: "Sensitivity", value: analysis.skinCondition.sensitivity, icon: Clock },
                  { label: "Overall Health", value: analysis.skinCondition.overallHealth, icon: CheckCircle },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                    <item.icon className={`h-6 w-6 mx-auto mb-2 ${getScoreColor(item.value)}`} />
                    <div className={`text-2xl font-bold ${getScoreColor(item.value)}`}>{item.value}%</div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Routine */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Morning Routine", steps: analysis.routineAdvice.morning, color: "bg-yellow-500" },
                { title: "Evening Routine", steps: analysis.routineAdvice.evening, color: "bg-purple-500" },
                { title: "Weekly Treatments", steps: analysis.routineAdvice.weekly, color: "bg-pink-500" },
              ].map((routine) => (
                <div key={routine.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className={`w-10 h-10 ${routine.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{routine.title}</h3>
                  <ol className="space-y-2">
                    {routine.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {/* Products */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommended Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.productSuggestions.map((product, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl">
                    <div className="font-medium text-gray-900 dark:text-white">{product.step}</div>
                    <div className="text-sm text-pink-600 font-medium">{product.type}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{product.benefit}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.keyIngredients.map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/50 rounded text-xs">{ing}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatments & Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Professional Treatments</h3>
                <div className="space-y-3">
                  {analysis.treatmentSuggestions.map((treatment, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="font-medium">{treatment.treatment}</div>
                      <div className="text-sm text-gray-500">{treatment.frequency} • {treatment.idealFor}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Lifestyle Tips</h3>
                <ul className="space-y-2">
                  {analysis.lifestyleTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => { setShowForm(true); setAnalysis(null); }}
              className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Start New Analysis
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete Analysis"
        description="Delete this analysis?"
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
