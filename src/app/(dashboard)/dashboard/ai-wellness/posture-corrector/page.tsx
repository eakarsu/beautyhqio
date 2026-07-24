"use client";

import { useState, useEffect } from "react";
import { Users, ArrowLeft, Loader2, Plus, Trash2, CheckCircle, AlertTriangle, Target } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Assessment {
  postureScore: number;
  assessment: { overallStatus: string; summary: string; riskFactors: string[] };
  issues: { area: string; severity: string; description: string; cause: string }[];
  exercises: { name: string; targetArea: string; instructions: string; duration: string; frequency: string; difficulty: string }[];
  stretches: { name: string; targetArea: string; instructions: string; hold: string; frequency: string }[];
  ergonomicTips: { category: string; tip: string; implementation: string }[];
  dailyRoutine: { morning: string[]; workday: string[]; evening: string[] };
  improvementPlan: { week1: string; week2: string; week3: string; week4: string; ongoing: string };
  suggestedServices: { service: string; benefit: string; frequency: string }[];
}

interface PostureRecord {
  id: string;
  occupation: string;
  postureScore: number;
  createdAt: string;
}

const occupations = [
  "Software Developer", "Office Worker", "Teacher", "Nurse", "Driver",
  "Hairstylist", "Chef", "Student", "Remote Worker", "Retail Worker",
  "Massage Therapist", "Dentist", "Construction Worker", "Other"
];

const painAreas = [
  "Neck", "Upper back", "Lower back", "Shoulders", "Hips",
  "Wrists", "Knees", "Feet", "Jaw/TMJ", "Headaches"
];

const postureIssues = [
  "Forward head posture", "Rounded shoulders", "Hunched back",
  "Lower back strain", "Hip tightness", "Repetitive strain",
  "Text neck", "Sitting fatigue", "Standing fatigue"
];

export default function PostureCorrectorPage() {
  const [records, setRecords] = useState<PostureRecord[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [occupation, setOccupation] = useState("");
  const [hoursSeated, setHoursSeated] = useState(6);
  const [selectedPainAreas, setSelectedPainAreas] = useState<string[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("light");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/ai/posture-corrector?limit=15");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occupation) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/posture-corrector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation, hoursSeated,
          painAreas: selectedPainAreas,
          currentIssues: selectedIssues,
          activityLevel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAssessment(data.assessment);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/posture-corrector?id=${id}`, { method: "DELETE" });
      setRecords(records.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelection = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe": case "high": return "bg-red-100 text-red-700 border-red-200";
      case "moderate": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const loadSampleData = () => {
    setOccupation("Software Developer");
    setHoursSeated(9);
    setSelectedPainAreas(["Neck", "Upper back", "Lower back", "Wrists"]);
    setSelectedIssues(["Forward head posture", "Rounded shoulders", "Text neck"]);
    setActivityLevel("sedentary");
    setShowForm(true);
    setAssessment(null);
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
              <div className="p-3 bg-green-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Posture Corrector</h1>
                <p className="text-sm text-gray-500">Improve your posture with personalized guidance</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setAssessment(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="h-5 w-5" />
              New Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && !assessment ? (
          /* Form */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Posture Assessment</h2>
                <button type="button" onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">Load Sample Data</button>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Occupation</label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select your occupation</option>
                  {occupations.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>

              {/* Hours Seated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hours seated per day: {hoursSeated}
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={hoursSeated}
                  onChange={(e) => setHoursSeated(parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>

              {/* Pain Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pain Areas (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {painAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleSelection(area, selectedPainAreas, setSelectedPainAreas)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedPainAreas.includes(area)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white border-gray-300 hover:border-green-500"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Issues */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Posture Issues
                </label>
                <div className="flex flex-wrap gap-2">
                  {postureIssues.map((issue) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => toggleSelection(issue, selectedIssues, setSelectedIssues)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedIssues.includes(issue)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white border-gray-300 hover:border-green-500"
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {["sedentary", "light", "active", "very active"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActivityLevel(level)}
                      className={`py-2 px-3 rounded-lg text-sm capitalize border transition-colors ${
                        activityLevel === level
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white border-gray-300 hover:border-green-500"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !occupation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
                  {loading ? "Analyzing..." : "Get Assessment"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : assessment ? (
          /* Results */
          <div className="space-y-8">
            {/* Score */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Posture Score</h2>
              <div className={`text-7xl font-bold ${getScoreColor(assessment.postureScore)}`}>{assessment.postureScore}</div>
              <p className="text-gray-500 mt-2">out of 100</p>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-lg mx-auto">{assessment.assessment.summary}</p>
            </div>

            {/* Issues */}
            {assessment.issues.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Identified Issues
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assessment.issues.map((issue, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{issue.area}</span>
                        <span className="text-xs uppercase">{issue.severity}</span>
                      </div>
                      <p className="text-sm">{issue.description}</p>
                      <p className="text-xs mt-2 opacity-75">Cause: {issue.cause}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommended Exercises</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="font-medium text-green-800 dark:text-green-200">{exercise.name}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">{exercise.targetArea}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{exercise.instructions}</p>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className="px-2 py-1 bg-white/50 rounded">{exercise.duration}</span>
                      <span className="px-2 py-1 bg-white/50 rounded">{exercise.frequency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ergonomic Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ergonomic Tips</h3>
              <div className="space-y-3">
                {assessment.ergonomicTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{tip.tip}</span>
                      <p className="text-sm text-gray-500 mt-1">{tip.implementation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-Week Plan */}
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">4-Week Improvement Plan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { week: "Week 1", focus: assessment.improvementPlan.week1 },
                  { week: "Week 2", focus: assessment.improvementPlan.week2 },
                  { week: "Week 3", focus: assessment.improvementPlan.week3 },
                  { week: "Week 4", focus: assessment.improvementPlan.week4 },
                ].map((item) => (
                  <div key={item.week} className="bg-white/20 rounded-lg p-4">
                    <div className="font-medium">{item.week}</div>
                    <p className="text-sm text-white/80 mt-1">{item.focus}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowForm(true); setAssessment(null); }}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              New Assessment
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <Users className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assess Your Posture</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Get a personalized posture assessment with exercises, stretches, and ergonomic tips tailored to your occupation and lifestyle.
              </p>
              <button onClick={() => setShowForm(true)} className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Start Assessment
              </button>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Assessment History</h3>
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No assessments yet</p>
              ) : (
                <div className="space-y-3">
                  {records.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                      <div>
                        <div className={`text-lg font-bold ${getScoreColor(record.postureScore || 50)}`}>{record.postureScore}</div>
                        <p className="text-sm text-gray-600">{record.occupation}</p>
                        <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setConfirmDeleteId(record.id)} className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete Assessment"
        description="Delete this assessment?"
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
