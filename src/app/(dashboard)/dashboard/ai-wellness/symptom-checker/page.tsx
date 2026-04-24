"use client";

import { useState, useEffect } from "react";
import { Activity, Plus, Trash2, Edit2, AlertCircle, CheckCircle, Clock, ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface SymptomCheck {
  id: string;
  symptoms: string[];
  duration: string;
  severity: string;
  urgencyLevel: string;
  shouldSeekCare: boolean;
  possibleConditions: { condition: string; probability: number; description: string }[];
  recommendations: string[];
  createdAt: string;
}

interface Analysis {
  possibleConditions: { condition: string; probability: number; description: string }[];
  recommendations: string[];
  urgencyLevel: string;
  shouldSeekCare: boolean;
  selfCareTips?: string[];
  suggestedServices?: string[];
}

const commonSymptoms = [
  "Dry skin", "Oily skin", "Acne", "Redness", "Sensitivity",
  "Hair loss", "Dandruff", "Brittle nails", "Dark circles",
  "Fatigue", "Headache", "Back pain", "Neck tension", "Stress"
];

export default function SymptomCheckerPage() {
  const [checks, setChecks] = useState<SymptomCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<SymptomCheck | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [additionalInfo, setAdditionalInfo] = useState("");

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    try {
      const res = await fetch("/api/ai/symptom-checker?limit=15");
      const data = await res.json();
      if (data.success) {
        setChecks(data.data);
      }
    } catch (error) {
      console.error("Error fetching checks:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length === 0) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/ai/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          duration,
          severity,
          additionalInfo,
          sessionId: `session-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        fetchChecks();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/symptom-checker?id=${id}`, { method: "DELETE" });
      setChecks(checks.filter((c) => c.id !== id));
      if (selectedCheck?.id === id) setSelectedCheck(null);
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const addSymptom = (symptom: string) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !symptoms.includes(customSymptom.trim())) {
      setSymptoms([...symptoms, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      default: return "text-green-600 bg-green-100";
    }
  };

  const loadSampleData = () => {
    setSymptoms(["Dry skin", "Fatigue", "Headache", "Stress"]);
    setDuration("1 week");
    setSeverity("moderate");
    setAdditionalInfo("I've been working long hours at a desk and not drinking enough water. My skin feels tight and flaky, especially around my forehead and cheeks.");
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
              <Link href="/dashboard/ai-wellness" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-red-500 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h1>
                <p className="text-sm text-gray-500">Analyze wellness symptoms and get recommendations</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setAnalysis(null); setSymptoms([]); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Analysis
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form / Analysis Section */}
          <div className="lg:col-span-2">
            {showForm || analysis ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                {!analysis ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Describe Your Symptoms</h2>
                      <button type="button" onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">Load Sample Data</button>
                    </div>

                    {/* Selected Symptoms */}
                    {symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {symptoms.map((symptom) => (
                          <span key={symptom} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                            {symptom}
                            <button type="button" onClick={() => removeSymptom(symptom)}>
                              <X className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Common Symptoms */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select symptoms (click to add)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map((symptom) => (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => addSymptom(symptom)}
                            disabled={symptoms.includes(symptom)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              symptoms.includes(symptom)
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white hover:bg-red-50 hover:border-red-300 border-gray-300"
                            }`}
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Symptom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Add custom symptom
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSymptom}
                          onChange={(e) => setCustomSymptom(e.target.value)}
                          placeholder="Type a symptom..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSymptom())}
                        />
                        <button type="button" onClick={addCustomSymptom} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">Select duration</option>
                        <option value="Just started">Just started</option>
                        <option value="1-3 days">1-3 days</option>
                        <option value="1 week">About 1 week</option>
                        <option value="2 weeks">2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="ongoing">Ongoing (more than 1 month)</option>
                      </select>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</label>
                      <div className="flex gap-4">
                        {["mild", "moderate", "severe"].map((level) => (
                          <label key={level} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="severity"
                              value={level}
                              checked={severity === level}
                              onChange={(e) => setSeverity(e.target.value)}
                              className="text-red-500 focus:ring-red-500"
                            />
                            <span className="capitalize">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Information (optional)
                      </label>
                      <textarea
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        placeholder="Any other details that might be relevant..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={loading || symptoms.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Activity className="h-5 w-5" />}
                        {loading ? "Analyzing..." : "Analyze Symptoms"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Analysis Results */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.urgencyLevel)}`}>
                        {analysis.urgencyLevel.toUpperCase()} Priority
                      </span>
                    </div>

                    {analysis.shouldSeekCare && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">Professional Consultation Recommended</p>
                          <p className="text-sm text-yellow-700">Consider consulting a healthcare professional for these symptoms.</p>
                        </div>
                      </div>
                    )}

                    {/* Possible Conditions */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Possible Conditions</h3>
                      <div className="space-y-3">
                        {analysis.possibleConditions.map((condition, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{condition.condition}</span>
                              <span className="text-sm text-gray-500">{condition.probability}% likely</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                                style={{ width: `${condition.probability}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{condition.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h3>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Self-Care Tips */}
                    {analysis.selfCareTips && analysis.selfCareTips.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Self-Care Tips</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysis.selfCareTips.map((tip, idx) => (
                            <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Services */}
                    {analysis.suggestedServices && analysis.suggestedServices.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Suggested Services</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.suggestedServices.map((service, idx) => (
                            <span key={idx} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 italic">
                        Disclaimer: This is wellness guidance only, not medical advice. Please consult a healthcare professional for medical concerns.
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowForm(true); setAnalysis(null); setSymptoms([]); }}
                      className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Start New Analysis
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI Symptom Analysis</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Describe your wellness symptoms and get AI-powered recommendations for skincare, haircare, and overall wellness.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Start Analysis
                </button>
              </div>
            )}
          </div>

          {/* History Section */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Analyses</h2>

              {fetching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : checks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No analyses yet</p>
              ) : (
                <div className="space-y-3">
                  {checks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedCheck?.id === check.id
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-red-300"
                      }`}
                      onClick={() => setSelectedCheck(check)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(check.urgencyLevel)}`}>
                          {check.urgencyLevel}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(check.id); }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {check.symptoms.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {s}
                          </span>
                        ))}
                        {check.symptoms.length > 3 && (
                          <span className="text-xs text-gray-500">+{check.symptoms.length - 3} more</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(check.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete Symptom Check"
        description="Delete this symptom check?"
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
